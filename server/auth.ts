import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { RoleName, User } from '../src/types.ts';

const TOKEN_SECRET = process.env.AUTH_SECRET || crypto.createHash('sha256').update('apex-prestige-motors-dms-secret-v1').digest('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

interface TokenPayload {
  uid: number;
  email: string;
  role: RoleName;
  exp: number;
}

export function issueToken(user: User, roleName: RoleName): string {
  const payload: TokenPayload = {
    uid: user.id,
    email: user.email,
    role: roleName,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(encoded)
      .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  authUser?: {
    id: number;
    email: string;
    fullName: string;
    roleId: number;
    roleName: RoleName;
    roleLabel: string;
    permissions: string[];
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
  const user = db.getUserById(payload.uid);
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Account is disabled or not found' });
  }
  const role = db.getRoleById(user.roleId);
  if (!role) {
    return res.status(403).json({ error: 'Assigned role is invalid' });
  }
  req.authUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleId: user.roleId,
    roleName: role.name,
    roleLabel: role.label,
    permissions: role.permissions,
  };
  next();
}

export function requirePermission(...required: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const perms = req.authUser.permissions;
    if (perms.includes('*')) {
      return next();
    }
    const allowed = required.some((p) => perms.includes(p));
    if (!allowed) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
}
