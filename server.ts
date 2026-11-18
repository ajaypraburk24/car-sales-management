import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { db } from './server/db.ts';
import {
  hashPassword,
  verifyPassword,
  issueToken,
  requireAuth,
  requirePermission,
  type AuthRequest,
} from './server/auth.ts';
import type { DashboardSummary } from './src/types.ts';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '15mb' }));

// ---- Authentication Routes ----
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = db.getUserByEmail(String(email).trim());
    if (!user || !user.passwordHash || !verifyPassword(String(password), user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'This account is currently deactivated' });
    }
    const role = db.getRoleById(user.roleId);
    if (!role) {
      return res.status(500).json({ error: 'Role configuration missing' });
    }
    const token = issueToken(user, role.name);
    const { passwordHash: _ph, resetToken: _rt, resetTokenExpiry: _rte, ...safeUser } = user;
    res.json({
      token,
      user: {
        ...safeUser,
        roleName: role.name,
        roleLabel: role.label,
        permissions: role.permissions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Please provide your registered email address' });
    }
    const user = db.getUserByEmail(String(email).trim());
    if (!user) {
      return res.status(404).json({ error: 'No dealership account found with this email' });
    }
    const code = String(crypto.randomInt(100000, 999999));
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    db.setResetToken(user.id, code, expiry);
    res.json({
      message: 'Verification code generated. Use it within 15 minutes to reset your password.',
      verificationCode: code,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Unable to initiate password reset' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const user = db.getUserByEmail(String(email).trim());
    if (!user || !user.resetToken || user.resetToken !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid verification code or email' });
    }
    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }
    db.updateUserPassword(user.id, hashPassword(String(newPassword)));
    res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password reset failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.authUser });
});

app.post('/api/auth/change-password', requireAuth, (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const user = db.getUserById(req.authUser!.id);
    if (!user || !user.passwordHash || !verifyPassword(String(currentPassword), user.passwordHash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    db.updateUserPassword(user.id, hashPassword(String(newPassword)));
    res.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update password' });
  }
});

// ---- Dashboard Analytics ----
app.get('/api/dashboard', requireAuth, requirePermission('dashboard:read'), (_req, res) => {
  try {
    const vehicles = db.getVehicles();
    const customers = db.getCustomers();
    const sales = db.getSales();
    const expenses = db.getExpenses();
    const employees = db.getEmployees();

    const activeSales = sales.filter((s) => s.status !== 'Cancelled');
    const totalRevenue = activeSales.reduce((acc, s) => acc + s.finalAmount, 0);
    const pendingPayments = activeSales.reduce((acc, s) => acc + s.remainingBalance, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

    const monthLabels = ['Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026'];
    const monthKeys = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

    const monthlyRevenue = monthKeys.map((mk, idx) => {
      const mSales = activeSales.filter((s) => s.saleDate.startsWith(mk));
      const mExp = expenses.filter((e) => e.expenseDate.startsWith(mk));
      return {
        month: monthLabels[idx],
        revenue: mSales.reduce((a, b) => a + b.finalAmount, 0),
        salesCount: mSales.length,
        expenses: mExp.reduce((a, b) => a + b.amount, 0),
      };
    });

    // Best-selling cars aggregation
    const modelMap = new Map<string, { brand: string; model: string; unitsSold: number; revenue: number }>();
    for (const sale of activeSales) {
      for (const item of sale.items || []) {
        const veh = vehicles.find((v) => v.id === item.vehicleId);
        if (!veh) continue;
        const key = `${veh.brand}__${veh.model}`;
        const existing = modelMap.get(key) || {
          brand: veh.brand,
          model: veh.model,
          unitsSold: 0,
          revenue: 0,
        };
        existing.unitsSold += item.quantity;
        existing.revenue += sale.finalAmount;
        modelMap.set(key, existing);
      }
    }
    const bestSellingCars = Array.from(modelMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const salesPerformance = employees
      .filter((e) => e.status === 'Active')
      .map((e) => {
        const rev = e.totalRevenue || 0;
        const target = e.monthlyTarget || 1;
        return {
          employeeId: e.id,
          name: e.fullName,
          salesCount: e.totalSalesCount || 0,
          revenue: rev,
          target,
          achievementPct: Math.round((rev / target) * 100),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const summary: DashboardSummary = {
      kpis: {
        totalCars: vehicles.length,
        availableCars: vehicles.filter((v) => v.status === 'Available').length,
        soldCars: vehicles.filter((v) => v.status === 'Sold').length,
        reservedCars: vehicles.filter((v) => v.status === 'Reserved').length,
        totalCustomers: customers.length,
        totalSalesCount: activeSales.length,
        totalRevenue,
        pendingPayments,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      },
      monthlyRevenue,
      recentSales: sales.slice(0, 5),
      recentCustomers: customers.slice(0, 5),
      bestSellingCars,
      salesPerformance,
    };

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load dashboard' });
  }
});

// ---- Vehicles ----
app.get('/api/vehicles', requireAuth, requirePermission('vehicles:read'), (_req, res) => {
  res.json(db.getVehicles());
});

app.post('/api/vehicles', requireAuth, requirePermission('vehicles:write'), (req, res) => {
  try {
    const { images, ...fields } = req.body || {};
    if (!fields.brand || !fields.model || !fields.sellingPrice) {
      return res.status(400).json({ error: 'Brand, model, and selling price are required' });
    }
    const created = db.createVehicle(
      {
        brand: String(fields.brand),
        model: String(fields.model),
        variant: String(fields.variant || 'Standard'),
        manufacturingYear: Number(fields.manufacturingYear || 2026),
        registrationNumber: String(fields.registrationNumber || 'UNREGISTERED'),
        fuelType: fields.fuelType || 'Petrol',
        transmission: fields.transmission || 'Automatic',
        mileage: String(fields.mileage || '12 km/l'),
        engineCapacity: String(fields.engineCapacity || '1998 cc'),
        colour: String(fields.colour || 'Obsidian Black'),
        kilometresDriven: Number(fields.kilometresDriven || 0),
        exShowroomPrice: Number(fields.exShowroomPrice || fields.sellingPrice),
        sellingPrice: Number(fields.sellingPrice),
        stockQuantity: Number(fields.stockQuantity ?? 1),
        description: String(fields.description || ''),
        status: fields.status || 'Available',
      },
      Array.isArray(images) ? images : []
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add vehicle' });
  }
});

app.put('/api/vehicles/:id', requireAuth, requirePermission('vehicles:write'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const { images, ...fields } = req.body || {};
    const updated = db.updateVehicle(id, fields, Array.isArray(images) ? images : undefined);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update vehicle' });
  }
});

app.delete('/api/vehicles/:id', requireAuth, requirePermission('vehicles:write'), (req, res) => {
  try {
    db.deleteVehicle(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete vehicle' });
  }
});

// ---- Customers ----
app.get('/api/customers', requireAuth, requirePermission('customers:read'), (_req, res) => {
  res.json(db.getCustomers());
});

app.post('/api/customers', requireAuth, requirePermission('customers:write'), (req, res) => {
  try {
    const { fullName, mobile, email } = req.body || {};
    if (!fullName || !mobile) {
      return res.status(400).json({ error: 'Customer full name and mobile number are required' });
    }
    const created = db.createCustomer({
      fullName: String(fullName),
      mobile: String(mobile),
      email: String(email || ''),
      address: String(req.body.address || ''),
      city: String(req.body.city || ''),
      state: String(req.body.state || ''),
      pinCode: String(req.body.pinCode || ''),
      idProofType: req.body.idProofType || 'None',
      idProofNumber: String(req.body.idProofNumber || ''),
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', requireAuth, requirePermission('customers:write'), (req, res) => {
  try {
    const updated = db.updateCustomer(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', requireAuth, requirePermission('customers:write'), (req, res) => {
  try {
    db.deleteCustomer(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete customer' });
  }
});

// ---- Sales ----
app.get('/api/sales', requireAuth, requirePermission('sales:read'), (_req, res) => {
  res.json(db.getSales());
});

app.post('/api/sales', requireAuth, requirePermission('sales:write'), (req, res) => {
  try {
    const sale = db.createSale(req.body);
    res.status(201).json(sale);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create sale' });
  }
});

app.patch('/api/sales/:id/status', requireAuth, requirePermission('sales:write'), (req, res) => {
  try {
    const updated = db.updateSaleStatus(Number(req.params.id), req.body.status);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update sale status' });
  }
});

// ---- Payments ----
app.get('/api/payments', requireAuth, requirePermission('payments:read'), (_req, res) => {
  res.json(db.getPayments());
});

app.post('/api/payments', requireAuth, requirePermission('payments:write'), (req, res) => {
  try {
    const payment = db.recordPayment(req.body);
    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record payment' });
  }
});

// ---- Invoices ----
app.get('/api/invoices', requireAuth, requirePermission('invoices:read'), (_req, res) => {
  res.json(db.getInvoices());
});

// ---- Enquiries ----
app.get('/api/enquiries', requireAuth, requirePermission('enquiries:read'), (_req, res) => {
  res.json(db.getEnquiries());
});

app.post('/api/enquiries', requireAuth, requirePermission('enquiries:write'), (req, res) => {
  try {
    const { customerName, contactNumber } = req.body || {};
    if (!customerName || !contactNumber) {
      return res.status(400).json({ error: 'Customer name and contact number are required' });
    }
    const created = db.createEnquiry({
      customerName: String(customerName),
      contactNumber: String(contactNumber),
      email: String(req.body.email || ''),
      interestedVehicleId: req.body.interestedVehicleId ? Number(req.body.interestedVehicleId) : null,
      interestedCarLabel: String(req.body.interestedCarLabel || ''),
      budget: Number(req.body.budget || 0),
      enquiryDate: String(req.body.enquiryDate || new Date().toISOString().slice(0, 10)),
      followUpDate: String(req.body.followUpDate || new Date().toISOString().slice(0, 10)),
      assignedEmployeeId: req.body.assignedEmployeeId ? Number(req.body.assignedEmployeeId) : null,
      status: req.body.status || 'New',
      followUpNotes: String(req.body.followUpNotes || ''),
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create enquiry' });
  }
});

app.put('/api/enquiries/:id', requireAuth, requirePermission('enquiries:write'), (req, res) => {
  try {
    const updated = db.updateEnquiry(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update enquiry' });
  }
});

app.delete('/api/enquiries/:id', requireAuth, requirePermission('enquiries:write'), (req, res) => {
  try {
    db.deleteEnquiry(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete enquiry' });
  }
});

// ---- Test Drives ----
app.get('/api/test-drives', requireAuth, requirePermission('test_drives:read'), (_req, res) => {
  res.json(db.getTestDrives());
});

app.post('/api/test-drives', requireAuth, requirePermission('test_drives:write'), (req, res) => {
  try {
    const created = db.createTestDrive({
      customerId: Number(req.body.customerId),
      vehicleId: Number(req.body.vehicleId),
      scheduledDate: String(req.body.scheduledDate),
      scheduledTime: String(req.body.scheduledTime || '11:00'),
      assignedEmployeeId: req.body.assignedEmployeeId ? Number(req.body.assignedEmployeeId) : null,
      status: req.body.status || 'Scheduled',
      feedbackNotes: String(req.body.feedbackNotes || ''),
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to schedule test drive' });
  }
});

app.put('/api/test-drives/:id', requireAuth, requirePermission('test_drives:write'), (req, res) => {
  try {
    const updated = db.updateTestDrive(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update test drive' });
  }
});

app.delete('/api/test-drives/:id', requireAuth, requirePermission('test_drives:write'), (req, res) => {
  try {
    db.deleteTestDrive(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete test drive' });
  }
});

// ---- Employees, Users & Roles ----
app.get('/api/roles', requireAuth, (_req, res) => {
  res.json(db.getRoles());
});

app.get('/api/employees', requireAuth, (_req, res) => {
  res.json(db.getEmployees());
});

app.post('/api/employees', requireAuth, requirePermission('employees:write'), (req, res) => {
  try {
    const emp = db.createEmployee(req.body);
    res.status(201).json(emp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add employee' });
  }
});

app.put('/api/employees/:id', requireAuth, requirePermission('employees:write'), (req, res) => {
  try {
    const emp = db.updateEmployee(Number(req.params.id), req.body);
    res.json(emp);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', requireAuth, requirePermission('employees:write'), (req, res) => {
  try {
    db.deleteEmployee(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete employee' });
  }
});

app.get('/api/users', requireAuth, requirePermission('settings:write', 'employees:read'), (_req, res) => {
  res.json(db.getUsers());
});

app.put('/api/users/:id', requireAuth, requirePermission('settings:write'), (req, res) => {
  try {
    const updated = db.updateUserRoleAndStatus(Number(req.params.id), req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update user' });
  }
});

// ---- Expenses & Reports ----
app.get('/api/expenses', requireAuth, requirePermission('reports:read', 'expenses:read'), (_req, res) => {
  res.json(db.getExpenses());
});

app.post('/api/expenses', requireAuth, requirePermission('expenses:write'), (req: AuthRequest, res) => {
  try {
    const created = db.createExpense({
      category: String(req.body.category || 'Operations'),
      description: String(req.body.description || ''),
      amount: Number(req.body.amount || 0),
      expenseDate: String(req.body.expenseDate || new Date().toISOString().slice(0, 10)),
      recordedByUserId: req.authUser!.id,
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to record expense' });
  }
});

app.delete('/api/expenses/:id', requireAuth, requirePermission('expenses:write'), (req, res) => {
  try {
    db.deleteExpense(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete expense' });
  }
});

// ---- Settings & Backup ----
app.get('/api/settings', (_req, res) => {
  res.json(db.getSettings());
});

app.put('/api/settings', requireAuth, requirePermission('settings:write'), (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save settings' });
  }
});

app.get('/api/backup', requireAuth, requirePermission('settings:write'), (_req, res) => {
  const snapshot = db.exportBackup();
  res.setHeader('Content-Disposition', 'attachment; filename="apex-motors-backup.json"');
  res.json(snapshot);
});

// ---- Vite / Static Serving ----
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Prestige Motors DMS listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
