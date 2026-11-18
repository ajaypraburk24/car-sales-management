import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  Role,
  User,
  Employee,
  Vehicle,
  VehicleImage,
  Customer,
  Enquiry,
  TestDrive,
  Sale,
  SaleItem,
  Payment,
  Invoice,
  Expense,
  DealershipSettings,
} from '../src/types.ts';

function hashInitialPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export interface DatabaseSchema {
  sequences: Record<string, number>;
  roles: Role[];
  users: User[];
  employees: Employee[];
  vehicles: Vehicle[];
  vehicle_images: VehicleImage[];
  customers: Customer[];
  enquiries: Enquiry[];
  test_drives: TestDrive[];
  sales: Sale[];
  sale_items: SaleItem[];
  payments: Payment[];
  invoices: Invoice[];
  expenses: Expense[];
  settings: DealershipSettings[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'dealership.json');

const HERO_IMG = '/src/assets/images/hero_showroom_vehicle_1794978283269.jpg';
const SEDAN_IMG = '/src/assets/images/car_sedan_obsidian_1794978283395.jpg';
const SUV_IMG = '/src/assets/images/car_suv_glacier_1794978283684.jpg';
const COUPE_IMG = '/src/assets/images/car_coupe_cobalt_1794978283899.jpg';
const EV_IMG = '/src/assets/images/car_ev_titanium_1794978284216.jpg';

function createSeedData(): DatabaseSchema {
  const now = new Date().toISOString();

  const roles: Role[] = [
    {
      id: 1,
      name: 'admin',
      label: 'Administrator',
      permissions: ['*'],
    },
    {
      id: 2,
      name: 'manager',
      label: 'Showroom Manager',
      permissions: [
        'dashboard:read',
        'vehicles:read',
        'vehicles:write',
        'customers:read',
        'customers:write',
        'sales:read',
        'sales:write',
        'payments:read',
        'payments:write',
        'invoices:read',
        'enquiries:read',
        'enquiries:write',
        'test_drives:read',
        'test_drives:write',
        'employees:read',
        'employees:write',
        'reports:read',
        'expenses:read',
        'expenses:write',
        'settings:read',
      ],
    },
    {
      id: 3,
      name: 'sales_executive',
      label: 'Sales Executive',
      permissions: [
        'dashboard:read',
        'vehicles:read',
        'customers:read',
        'customers:write',
        'sales:read',
        'sales:write',
        'payments:read',
        'payments:write',
        'invoices:read',
        'enquiries:read',
        'enquiries:write',
        'test_drives:read',
        'test_drives:write',
      ],
    },
  ];

  const users: User[] = [
    {
      id: 1,
      email: 'admin@apexmotors.in',
      passwordHash: hashInitialPassword('Admin@123'),
      fullName: 'Vikramaditya Rao',
      roleId: 1,
      isActive: true,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: '2026-01-10T09:00:00.000Z',
    },
    {
      id: 2,
      email: 'manager@apexmotors.in',
      passwordHash: hashInitialPassword('Manager@123'),
      fullName: 'Ananya Deshmukh',
      roleId: 2,
      isActive: true,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 3,
      email: 'sales@apexmotors.in',
      passwordHash: hashInitialPassword('Sales@123'),
      fullName: 'Rohan Kulkarni',
      roleId: 3,
      isActive: true,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: '2026-02-01T09:00:00.000Z',
    },
    {
      id: 4,
      email: 'meera.nair@apexmotors.in',
      passwordHash: hashInitialPassword('Sales@123'),
      fullName: 'Meera Nair',
      roleId: 3,
      isActive: true,
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: '2026-02-12T09:00:00.000Z',
    },
  ];

  const employees: Employee[] = [
    {
      id: 1,
      userId: 1,
      employeeCode: 'EMP-1001',
      fullName: 'Vikramaditya Rao',
      email: 'admin@apexmotors.in',
      phone: '+91 98201 44010',
      roleId: 1,
      department: 'Executive Leadership',
      monthlyTarget: 15000000,
      commissionRate: 1.0,
      joiningDate: '2024-03-01',
      status: 'Active',
    },
    {
      id: 2,
      userId: 2,
      employeeCode: 'EMP-1002',
      fullName: 'Ananya Deshmukh',
      email: 'manager@apexmotors.in',
      phone: '+91 98201 44022',
      roleId: 2,
      department: 'Showroom Operations',
      monthlyTarget: 22000000,
      commissionRate: 1.5,
      joiningDate: '2024-06-15',
      status: 'Active',
    },
    {
      id: 3,
      userId: 3,
      employeeCode: 'EMP-1003',
      fullName: 'Rohan Kulkarni',
      email: 'sales@apexmotors.in',
      phone: '+91 98201 44035',
      roleId: 3,
      department: 'Luxury Passenger Sales',
      monthlyTarget: 18000000,
      commissionRate: 2.25,
      joiningDate: '2025-01-10',
      status: 'Active',
    },
    {
      id: 4,
      userId: 4,
      employeeCode: 'EMP-1004',
      fullName: 'Meera Nair',
      email: 'meera.nair@apexmotors.in',
      phone: '+91 98201 44048',
      roleId: 3,
      department: 'EV & Performance Division',
      monthlyTarget: 16000000,
      commissionRate: 2.5,
      joiningDate: '2025-04-04',
      status: 'Active',
    },
  ];

  const vehicles: Vehicle[] = [
    {
      id: 1,
      carCode: 'VEH-2026-01',
      brand: 'Mercedes-Benz',
      model: 'E-Class AMG Line',
      variant: 'E 450 4MATIC Exclusive',
      manufacturingYear: 2026,
      registrationNumber: 'MH-01-EX-9001',
      fuelType: 'Hybrid',
      transmission: 'Automatic',
      mileage: '14.2 km/l',
      engineCapacity: '2999 cc',
      colour: 'Graphite Metallic',
      kilometresDriven: 12,
      exShowroomPrice: 8950000,
      sellingPrice: 9250000,
      stockQuantity: 2,
      description: 'Mild-hybrid inline-6 executive sedan with AIRMATIC suspension, Burmester 4D surround sound, and panoramic glass roof.',
      status: 'Available',
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 2,
      carCode: 'VEH-2026-02',
      brand: 'Audi',
      model: 'RS e-tron GT',
      variant: 'Quattro Performance',
      manufacturingYear: 2026,
      registrationNumber: 'MH-01-EV-4420',
      fuelType: 'Electric',
      transmission: 'Automatic',
      mileage: '480 km / charge',
      engineCapacity: '93.4 kWh Dual Motor',
      colour: 'Obsidian Mythos Black',
      kilometresDriven: 18,
      exShowroomPrice: 17900000,
      sellingPrice: 18450000,
      stockQuantity: 1,
      description: 'All-electric flagship grand tourer featuring carbon ceramic brakes, matrix laser LED headlamps, and 800V fast charging.',
      status: 'Available',
      createdAt: '2026-09-12T11:30:00.000Z',
    },
    {
      id: 3,
      carCode: 'VEH-2026-03',
      brand: 'Mercedes-Benz',
      model: 'GLS 450',
      variant: '4MATIC Luxury SUV',
      manufacturingYear: 2026,
      registrationNumber: 'MH-02-GL-7711',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: '11.4 km/l',
      engineCapacity: '2999 cc',
      colour: 'Glacier Diamond White',
      kilometresDriven: 25,
      exShowroomPrice: 13200000,
      sellingPrice: 13650000,
      stockQuantity: 2,
      description: 'Seven-seat flagship luxury SUV with acoustic comfort package, executive rear seating, and MBUX rear entertainment.',
      status: 'Available',
      createdAt: '2026-09-20T09:15:00.000Z',
    },
    {
      id: 4,
      carCode: 'VEH-2026-04',
      brand: 'Aston Martin',
      model: 'DBS Superleggera',
      variant: 'V12 Twin-Turbo Coupe',
      manufacturingYear: 2025,
      registrationNumber: 'MH-01-AM-0007',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: '8.1 km/l',
      engineCapacity: '5204 cc',
      colour: 'Cobalt Blue Metallic',
      kilometresDriven: 420,
      exShowroomPrice: 42500000,
      sellingPrice: 43200000,
      stockQuantity: 1,
      description: 'Hand-built carbon-fiber grand tourer with 715 bhp V12, Bang & Olufsen BeoSound audio, and bespoke Alcantara cabin.',
      status: 'Reserved',
      createdAt: '2026-09-28T14:20:00.000Z',
    },
    {
      id: 5,
      carCode: 'VEH-2026-05',
      brand: 'Mercedes-EQ',
      model: 'EQS 580 SUV',
      variant: '4MATIC AMG Styling',
      manufacturingYear: 2026,
      registrationNumber: 'MH-01-EQ-5800',
      fuelType: 'Electric',
      transmission: 'Automatic',
      mileage: '605 km / charge',
      engineCapacity: '108.4 kWh Battery',
      colour: 'Satin Titanium Silver',
      kilometresDriven: 10,
      exShowroomPrice: 14100000,
      sellingPrice: 14500000,
      stockQuantity: 2,
      description: 'Ultra-quiet electric flagship crossover equipped with 56-inch MBUX Hyperscreen and rear-axle steering.',
      status: 'Available',
      createdAt: '2026-10-05T10:45:00.000Z',
    },
    {
      id: 6,
      carCode: 'VEH-2025-06',
      brand: 'BMW',
      model: '740i M Sport',
      variant: 'Excellence Edition',
      manufacturingYear: 2025,
      registrationNumber: 'MH-01-BM-7401',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      mileage: '12.6 km/l',
      engineCapacity: '2998 cc',
      colour: 'Black Sapphire',
      kilometresDriven: 45,
      exShowroomPrice: 18100000,
      sellingPrice: 18250000,
      stockQuantity: 0,
      description: 'Executive limousine featuring 31.3-inch 8K Theatre Screen, automatic doors, and cashmere wool upholstery.',
      status: 'Sold',
      createdAt: '2026-07-14T12:00:00.000Z',
    },
    {
      id: 7,
      carCode: 'VEH-2025-07',
      brand: 'Porsche',
      model: 'Cayenne Turbo GT',
      variant: 'Performance Coupe',
      manufacturingYear: 2025,
      registrationNumber: 'MH-03-PC-9118',
      fuelType: 'Petrol',
      transmission: 'DCT',
      mileage: '9.4 km/l',
      engineCapacity: '3996 cc',
      colour: 'Carrara White',
      kilometresDriven: 1120,
      exShowroomPrice: 25600000,
      sellingPrice: 25900000,
      stockQuantity: 1,
      description: 'Track-calibrated performance SUV currently undergoing pre-delivery ceramic detailing and 111-point inspection.',
      status: 'Under Maintenance',
      createdAt: '2026-10-18T16:10:00.000Z',
    },
    {
      id: 8,
      carCode: 'VEH-2026-08',
      brand: 'Audi',
      model: 'Q8 e-tron Sportback',
      variant: '55 Quattro S-Line',
      manufacturingYear: 2026,
      registrationNumber: 'MH-01-EV-8812',
      fuelType: 'Electric',
      transmission: 'Automatic',
      mileage: '582 km / charge',
      engineCapacity: '114 kWh Battery',
      colour: 'Chronos Titanium',
      kilometresDriven: 14,
      exShowroomPrice: 13100000,
      sellingPrice: 13400000,
      stockQuantity: 0,
      description: 'Aerodynamic electric coupe-SUV with virtual exterior mirrors and adaptive air suspension.',
      status: 'Sold',
      createdAt: '2026-08-03T11:20:00.000Z',
    },
  ];

  const vehicle_images: VehicleImage[] = [
    { id: 1, vehicleId: 1, imageUrl: HERO_IMG, isPrimary: true, caption: 'Showroom Front Three-Quarter', createdAt: now },
    { id: 2, vehicleId: 1, imageUrl: SEDAN_IMG, isPrimary: false, caption: 'Studio Profile Angle', createdAt: now },
    { id: 3, vehicleId: 2, imageUrl: SEDAN_IMG, isPrimary: true, caption: 'Obsidian Studio Finish', createdAt: now },
    { id: 4, vehicleId: 3, imageUrl: SUV_IMG, isPrimary: true, caption: 'Glacier White Gallery View', createdAt: now },
    { id: 5, vehicleId: 4, imageUrl: COUPE_IMG, isPrimary: true, caption: 'Cobalt Metallic Bay View', createdAt: now },
    { id: 6, vehicleId: 5, imageUrl: EV_IMG, isPrimary: true, caption: 'Titanium Satin EV Showcase', createdAt: now },
    { id: 7, vehicleId: 6, imageUrl: SEDAN_IMG, isPrimary: true, caption: 'Executive Limousine Studio', createdAt: now },
    { id: 8, vehicleId: 7, imageUrl: SUV_IMG, isPrimary: true, caption: 'Performance SUV Bay', createdAt: now },
    { id: 9, vehicleId: 8, imageUrl: EV_IMG, isPrimary: true, caption: 'Sportback EV Showcase', createdAt: now },
  ];

  const customers: Customer[] = [
    {
      id: 1,
      customerCode: 'CUST-401',
      fullName: 'Siddharth Malhotra',
      mobile: '+91 98190 55101',
      email: 'siddharth.m@auroracapital.in',
      address: '1402 Sea Breeze Towers, Worli Sea Face',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400018',
      idProofType: 'PAN',
      idProofNumber: 'ABCPM4812K',
      createdAt: '2026-06-12T10:15:00.000Z',
    },
    {
      id: 2,
      customerCode: 'CUST-402',
      fullName: 'Kavita Singhania',
      mobile: '+91 98204 71209',
      email: 'kavita@singhaniaholdings.com',
      address: '88 Koregaon Park Lane 4',
      city: 'Pune',
      state: 'Maharashtra',
      pinCode: '411001',
      idProofType: 'PAN',
      idProofNumber: 'BGHPS9021D',
      createdAt: '2026-07-19T14:40:00.000Z',
    },
    {
      id: 3,
      customerCode: 'CUST-403',
      fullName: 'Arjun Rajagopal',
      mobile: '+91 99001 33418',
      email: 'arjun.r@novatech.io',
      address: '21 Lavelle Road, Shanthala Nagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560001',
      idProofType: 'Aadhaar',
      idProofNumber: 'XXXX-XXXX-8842',
      createdAt: '2026-08-05T11:05:00.000Z',
    },
    {
      id: 4,
      customerCode: 'CUST-404',
      fullName: 'Nandini Oberoi',
      mobile: '+91 98111 66230',
      email: 'nandini@oberoistudio.in',
      address: '45 Golf Links',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110003',
      idProofType: 'PAN',
      idProofNumber: 'AAAPO7712L',
      createdAt: '2026-09-14T16:20:00.000Z',
    },
    {
      id: 5,
      customerCode: 'CUST-405',
      fullName: 'Devansh Parekh',
      mobile: '+91 98250 11902',
      email: 'devansh@parekhexports.in',
      address: '12 Sindhu Bhavan Road, Bodakdev',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pinCode: '380054',
      idProofType: 'PAN',
      idProofNumber: 'CCDPP3190M',
      createdAt: '2026-10-08T09:50:00.000Z',
    },
    {
      id: 6,
      customerCode: 'CUST-406',
      fullName: 'Zoya Merchant',
      mobile: '+91 98212 88410',
      email: 'zoya@merchantdesign.co',
      address: '9 Pali Hill, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400050',
      idProofType: 'Passport',
      idProofNumber: 'Z4910824',
      createdAt: '2026-11-02T13:10:00.000Z',
    },
  ];

  const enquiries: Enquiry[] = [
    {
      id: 1,
      enquiryCode: 'ENQ-801',
      customerName: 'Harshvardhan Goenka',
      contactNumber: '+91 98200 77412',
      email: 'harsh.g@rpgventures.in',
      interestedVehicleId: 2,
      interestedCarLabel: 'Audi RS e-tron GT',
      budget: 19000000,
      enquiryDate: '2026-11-12',
      followUpDate: '2026-11-18',
      assignedEmployeeId: 4,
      status: 'Test Drive Scheduled',
      followUpNotes: 'Requested home charging assessment alongside private track demo.',
      createdAt: '2026-11-12T10:30:00.000Z',
    },
    {
      id: 2,
      enquiryCode: 'ENQ-802',
      customerName: 'Rhea Kapoor',
      contactNumber: '+91 98203 19044',
      email: 'rhea@kapooratelier.com',
      interestedVehicleId: 3,
      interestedCarLabel: 'Mercedes-Benz GLS 450',
      budget: 14000000,
      enquiryDate: '2026-11-14',
      followUpDate: '2026-11-19',
      assignedEmployeeId: 3,
      status: 'Interested',
      followUpNotes: 'Comparing Glacier White vs Obsidian Black interior trim options.',
      createdAt: '2026-11-14T15:10:00.000Z',
    },
    {
      id: 3,
      enquiryCode: 'ENQ-803',
      customerName: 'Pranav Mehta',
      contactNumber: '+91 98215 62011',
      email: 'pranav@mehtalogistics.in',
      interestedVehicleId: 1,
      interestedCarLabel: 'Mercedes-Benz E-Class AMG Line',
      budget: 9500000,
      enquiryDate: '2026-11-15',
      followUpDate: '2026-11-18',
      assignedEmployeeId: 3,
      status: 'Contacted',
      followUpNotes: 'Shared corporate leasing and EMI brochure.',
      createdAt: '2026-11-15T11:45:00.000Z',
    },
    {
      id: 4,
      enquiryCode: 'ENQ-804',
      customerName: 'Tara Krishnan',
      contactNumber: '+91 98450 22908',
      email: 'tara@krishnanhospitality.com',
      interestedVehicleId: 5,
      interestedCarLabel: 'Mercedes-EQ EQS 580 SUV',
      budget: 15000000,
      enquiryDate: '2026-11-16',
      followUpDate: '2026-11-20',
      assignedEmployeeId: 4,
      status: 'New',
      followUpNotes: 'Inbound website request for fleet electrification.',
      createdAt: '2026-11-16T09:20:00.000Z',
    },
    {
      id: 5,
      enquiryCode: 'ENQ-805',
      customerName: 'Siddharth Malhotra',
      contactNumber: '+91 98190 55101',
      email: 'siddharth.m@auroracapital.in',
      interestedVehicleId: 4,
      interestedCarLabel: 'Aston Martin DBS Superleggera',
      budget: 44000000,
      enquiryDate: '2026-11-01',
      followUpDate: '2026-11-10',
      assignedEmployeeId: 2,
      status: 'Converted',
      followUpNotes: 'Booking advance received and vehicle reserved.',
      createdAt: '2026-11-01T14:00:00.000Z',
    },
    {
      id: 6,
      enquiryCode: 'ENQ-806',
      customerName: 'Karanbir Gill',
      contactNumber: '+91 98140 77812',
      email: 'karan.gill@gillestates.in',
      interestedVehicleId: 7,
      interestedCarLabel: 'Porsche Cayenne Turbo GT',
      budget: 24000000,
      enquiryDate: '2026-10-22',
      followUpDate: '2026-11-01',
      assignedEmployeeId: 3,
      status: 'Lost',
      followUpNotes: 'Client opted for immediate delivery elsewhere due to budget cap.',
      createdAt: '2026-10-22T17:00:00.000Z',
    },
  ];

  const test_drives: TestDrive[] = [
    {
      id: 1,
      bookingCode: 'TD-301',
      customerId: 5,
      vehicleId: 2,
      scheduledDate: '2026-11-18',
      scheduledTime: '11:00',
      assignedEmployeeId: 4,
      status: 'Scheduled',
      feedbackNotes: 'Customer requested coastal highway route for acceleration demo.',
      createdAt: '2026-11-14T10:00:00.000Z',
    },
    {
      id: 2,
      bookingCode: 'TD-302',
      customerId: 6,
      vehicleId: 3,
      scheduledDate: '2026-11-19',
      scheduledTime: '15:30',
      assignedEmployeeId: 3,
      status: 'Scheduled',
      feedbackNotes: 'Family test drive; prepare rear-seat comfort walkthrough.',
      createdAt: '2026-11-15T12:15:00.000Z',
    },
    {
      id: 3,
      bookingCode: 'TD-303',
      customerId: 1,
      vehicleId: 4,
      scheduledDate: '2026-11-08',
      scheduledTime: '16:00',
      assignedEmployeeId: 2,
      status: 'Completed',
      feedbackNotes: 'Client loved exhaust note and carbon trim; proceeded to reservation.',
      createdAt: '2026-11-05T09:40:00.000Z',
    },
    {
      id: 4,
      bookingCode: 'TD-304',
      customerId: 3,
      vehicleId: 5,
      scheduledDate: '2026-11-10',
      scheduledTime: '12:00',
      assignedEmployeeId: 4,
      status: 'Completed',
      feedbackNotes: 'Impressed by cabin silence and Hyperscreen navigation.',
      createdAt: '2026-11-07T14:25:00.000Z',
    },
    {
      id: 5,
      bookingCode: 'TD-305',
      customerId: 4,
      vehicleId: 1,
      scheduledDate: '2026-11-03',
      scheduledTime: '10:30',
      assignedEmployeeId: 3,
      status: 'Cancelled',
      feedbackNotes: 'Rescheduling for next week due to client travel.',
      createdAt: '2026-10-30T11:10:00.000Z',
    },
  ];

  // Historical + current month sales for rich charts and reporting
  const sales: Sale[] = [
    {
      id: 1,
      saleCode: 'SAL-2026-001',
      customerId: 2,
      employeeId: 3,
      saleDate: '2026-07-22',
      subtotal: 18250000,
      discountAmount: 250000,
      gstRate: 28,
      gstAmount: 5040000,
      finalAmount: 23040000,
      advancePaid: 23040000,
      remainingBalance: 0,
      paymentMethod: 'Bank Transfer',
      status: 'Completed',
      notes: 'Full RTGS settlement with extended 5-year warranty.',
      createdAt: '2026-07-22T15:30:00.000Z',
    },
    {
      id: 2,
      saleCode: 'SAL-2026-002',
      customerId: 3,
      employeeId: 4,
      saleDate: '2026-08-18',
      subtotal: 13400000,
      discountAmount: 150000,
      gstRate: 5,
      gstAmount: 662500,
      finalAmount: 13912500,
      advancePaid: 13912500,
      remainingBalance: 0,
      paymentMethod: 'EMI',
      status: 'Completed',
      notes: 'EV 5% GST slab applied; HDFC Wealth Auto Loan disbursed.',
      createdAt: '2026-08-18T13:15:00.000Z',
    },
    {
      id: 3,
      saleCode: 'SAL-2026-003',
      customerId: 4,
      employeeId: 3,
      saleDate: '2026-09-25',
      subtotal: 9250000,
      discountAmount: 150000,
      gstRate: 28,
      gstAmount: 2548000,
      finalAmount: 11648000,
      advancePaid: 11648000,
      remainingBalance: 0,
      paymentMethod: 'Bank Transfer',
      status: 'Completed',
      notes: 'Delivered with complimentary ceramic coating package.',
      createdAt: '2026-09-25T16:45:00.000Z',
    },
    {
      id: 4,
      saleCode: 'SAL-2026-004',
      customerId: 5,
      employeeId: 4,
      saleDate: '2026-10-16',
      subtotal: 14500000,
      discountAmount: 200000,
      gstRate: 5,
      gstAmount: 715000,
      finalAmount: 15015000,
      advancePaid: 10000000,
      remainingBalance: 5015000,
      paymentMethod: 'EMI',
      status: 'Confirmed',
      notes: 'Awaiting final bank disbursement tranche.',
      createdAt: '2026-10-16T11:20:00.000Z',
    },
    {
      id: 5,
      saleCode: 'SAL-2026-005',
      customerId: 1,
      employeeId: 2,
      saleDate: '2026-11-11',
      subtotal: 43200000,
      discountAmount: 700000,
      gstRate: 28,
      gstAmount: 11900000,
      finalAmount: 54400000,
      advancePaid: 15000000,
      remainingBalance: 39400000,
      paymentMethod: 'Bank Transfer',
      status: 'Confirmed',
      notes: 'Aston Martin DBS Superleggera reserved; delivery scheduled Nov 24.',
      createdAt: '2026-11-11T17:00:00.000Z',
    },
    {
      id: 6,
      saleCode: 'SAL-2026-006',
      customerId: 6,
      employeeId: 3,
      saleDate: '2026-11-15',
      subtotal: 13650000,
      discountAmount: 150000,
      gstRate: 28,
      gstAmount: 3780000,
      finalAmount: 17280000,
      advancePaid: 3500000,
      remainingBalance: 13780000,
      paymentMethod: 'UPI',
      status: 'Pending',
      notes: 'Booking token received; awaiting loan sanction letter.',
      createdAt: '2026-11-15T14:10:00.000Z',
    },
  ];

  const sale_items: SaleItem[] = [
    { id: 1, saleId: 1, vehicleId: 6, unitPrice: 18250000, quantity: 1, lineTotal: 18250000 },
    { id: 2, saleId: 2, vehicleId: 8, unitPrice: 13400000, quantity: 1, lineTotal: 13400000 },
    { id: 3, saleId: 3, vehicleId: 1, unitPrice: 9250000, quantity: 1, lineTotal: 9250000 },
    { id: 4, saleId: 4, vehicleId: 5, unitPrice: 14500000, quantity: 1, lineTotal: 14500000 },
    { id: 5, saleId: 5, vehicleId: 4, unitPrice: 43200000, quantity: 1, lineTotal: 43200000 },
    { id: 6, saleId: 6, vehicleId: 3, unitPrice: 13650000, quantity: 1, lineTotal: 13650000 },
  ];

  const payments: Payment[] = [
    {
      id: 1,
      receiptNumber: 'RCP-2026-101',
      saleId: 1,
      customerId: 2,
      amount: 23040000,
      paymentMethod: 'Bank Transfer',
      paymentType: 'Final Settlement',
      referenceNumber: 'UTR-HDFC-99104218',
      paymentDate: '2026-07-22',
      notes: 'Full RTGS wire transfer cleared',
      createdAt: '2026-07-22T15:35:00.000Z',
    },
    {
      id: 2,
      receiptNumber: 'RCP-2026-102',
      saleId: 2,
      customerId: 3,
      amount: 4912500,
      paymentMethod: 'UPI',
      paymentType: 'Advance',
      referenceNumber: 'UPI-42198810234',
      paymentDate: '2026-08-14',
      notes: 'Down payment via corporate UPI',
      createdAt: '2026-08-14T11:20:00.000Z',
    },
    {
      id: 3,
      receiptNumber: 'RCP-2026-103',
      saleId: 2,
      customerId: 3,
      amount: 9000000,
      paymentMethod: 'EMI',
      paymentType: 'Final Settlement',
      referenceNumber: 'LOAN-HDFC-78120',
      emiBank: 'HDFC Private Banking',
      emiTenureMonths: 60,
      emiMonthlyAmount: 186400,
      paymentDate: '2026-08-18',
      notes: 'Auto loan disbursement',
      createdAt: '2026-08-18T13:20:00.000Z',
    },
    {
      id: 4,
      receiptNumber: 'RCP-2026-104',
      saleId: 3,
      customerId: 4,
      amount: 11648000,
      paymentMethod: 'Bank Transfer',
      paymentType: 'Final Settlement',
      referenceNumber: 'UTR-ICICI-33109482',
      paymentDate: '2026-09-25',
      notes: 'Settled prior to delivery',
      createdAt: '2026-09-25T16:50:00.000Z',
    },
    {
      id: 5,
      receiptNumber: 'RCP-2026-105',
      saleId: 4,
      customerId: 5,
      amount: 10000000,
      paymentMethod: 'EMI',
      paymentType: 'Advance',
      referenceNumber: 'LOAN-AXIS-55210',
      emiBank: 'Axis Burgundy Finance',
      emiTenureMonths: 48,
      emiMonthlyAmount: 248000,
      paymentDate: '2026-10-16',
      notes: 'Initial tranche credited',
      createdAt: '2026-10-16T11:30:00.000Z',
    },
    {
      id: 6,
      receiptNumber: 'RCP-2026-106',
      saleId: 5,
      customerId: 1,
      amount: 15000000,
      paymentMethod: 'Bank Transfer',
      paymentType: 'Advance',
      referenceNumber: 'UTR-KOTAK-7102941',
      paymentDate: '2026-11-11',
      notes: 'Reservation deposit for Aston Martin DBS',
      createdAt: '2026-11-11T17:10:00.000Z',
    },
    {
      id: 7,
      receiptNumber: 'RCP-2026-107',
      saleId: 6,
      customerId: 6,
      amount: 3500000,
      paymentMethod: 'Credit/Debit Card',
      paymentType: 'Booking',
      referenceNumber: 'POS-AMEX-90412',
      paymentDate: '2026-11-15',
      notes: 'Booking advance via showroom POS terminal',
      createdAt: '2026-11-15T14:20:00.000Z',
    },
  ];

  const defaultTerms =
    '1. Vehicle delivery is subject to full realization of payment and RTO registration clearance.\n2. Standard manufacturer warranty applies as per service booklet.\n3. Goods once sold and registered cannot be returned or exchanged.\n4. All disputes are subject to Mumbai jurisdiction.';

  const invoices: Invoice[] = [
    { id: 1, invoiceNumber: 'INV-2026-0001', saleId: 1, invoiceDate: '2026-07-22', dueAmount: 0, status: 'Paid', termsAndConditions: defaultTerms, createdAt: '2026-07-22T15:35:00.000Z' },
    { id: 2, invoiceNumber: 'INV-2026-0002', saleId: 2, invoiceDate: '2026-08-18', dueAmount: 0, status: 'Paid', termsAndConditions: defaultTerms, createdAt: '2026-08-18T13:20:00.000Z' },
    { id: 3, invoiceNumber: 'INV-2026-0003', saleId: 3, invoiceDate: '2026-09-25', dueAmount: 0, status: 'Paid', termsAndConditions: defaultTerms, createdAt: '2026-09-25T16:50:00.000Z' },
    { id: 4, invoiceNumber: 'INV-2026-0004', saleId: 4, invoiceDate: '2026-10-16', dueAmount: 5015000, status: 'Partially Paid', termsAndConditions: defaultTerms, createdAt: '2026-10-16T11:30:00.000Z' },
    { id: 5, invoiceNumber: 'INV-2026-0005', saleId: 5, invoiceDate: '2026-11-11', dueAmount: 39400000, status: 'Partially Paid', termsAndConditions: defaultTerms, createdAt: '2026-11-11T17:10:00.000Z' },
    { id: 6, invoiceNumber: 'INV-2026-0006', saleId: 6, invoiceDate: '2026-11-15', dueAmount: 13780000, status: 'Partially Paid', termsAndConditions: defaultTerms, createdAt: '2026-11-15T14:20:00.000Z' },
  ];

  const expenses: Expense[] = [
    { id: 1, category: 'Showroom Lease', description: 'Worli Flagship Showroom Monthly Lease', amount: 1850000, expenseDate: '2026-07-05', recordedByUserId: 1 },
    { id: 2, category: 'Showroom Lease', description: 'Worli Flagship Showroom Monthly Lease', amount: 1850000, expenseDate: '2026-08-05', recordedByUserId: 1 },
    { id: 3, category: 'Vehicle Detailing & Logistics', description: 'Enclosed Flatbed Carrier & Ceramic Bay', amount: 940000, expenseDate: '2026-09-12', recordedByUserId: 2 },
    { id: 4, category: 'Showroom Lease & Staff Payroll', description: 'October Operations & Sales Commissions', amount: 3150000, expenseDate: '2026-10-28', recordedByUserId: 1 },
    { id: 5, category: 'Marketing & Private Events', description: 'Autumn Grand Tourer Preview Evening', amount: 1250000, expenseDate: '2026-11-06', recordedByUserId: 2 },
  ];

  const settings: DealershipSettings[] = [
    {
      id: 1,
      dealershipName: 'Apex Prestige Motors',
      tagline: 'Luxury & Performance Automotive Dealership',
      logoUrl: HERO_IMG,
      address: 'Plot 42, Dr. Annie Besant Road, Worli',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '+91 22 6890 4400',
      email: 'concierge@apexmotors.in',
      website: 'https://apexmotors.in',
      gstNumber: '27AABCA9012K1Z5',
      defaultGstRate: 28,
      currencySymbol: '₹',
      invoiceTerms: defaultTerms,
      notifyLowStock: true,
      notifyPendingPayments: true,
      notifyTestDrives: true,
      lastBackupAt: now,
    },
  ];

  return {
    sequences: {
      roles: 3,
      users: 4,
      employees: 4,
      vehicles: 8,
      vehicle_images: 9,
      customers: 6,
      enquiries: 6,
      test_drives: 5,
      sales: 6,
      sale_items: 6,
      payments: 7,
      invoices: 6,
      expenses: 5,
      settings: 1,
    },
    roles,
    users,
    employees,
    vehicles,
    vehicle_images,
    customers,
    enquiries,
    test_drives,
    sales,
    sale_items,
    payments,
    invoices,
    expenses,
    settings,
  };
}

class RelationalStore {
  private data: DatabaseSchema;
  // Relational in-memory indexes for fast primary & foreign key lookups
  private userEmailIndex = new Map<string, User>();
  private roleIndex = new Map<number, Role>();
  private vehicleIndex = new Map<number, Vehicle>();
  private customerIndex = new Map<number, Customer>();
  private employeeIndex = new Map<number, Employee>();
  private saleIndex = new Map<number, Sale>();

  constructor() {
    this.data = this.loadFromDisk();
    this.rebuildIndexes();
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw) as DatabaseSchema;
      }
    } catch (err) {
      console.error('Failed to read persisted store, creating fresh seed:', err);
    }
    const seed = createSeedData();
    this.writeToDisk(seed);
    return seed;
  }

  private writeToDisk(snapshot: DatabaseSchema = this.data) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  private rebuildIndexes() {
    this.userEmailIndex.clear();
    this.roleIndex.clear();
    this.vehicleIndex.clear();
    this.customerIndex.clear();
    this.employeeIndex.clear();
    this.saleIndex.clear();

    for (const r of this.data.roles) this.roleIndex.set(r.id, r);
    for (const u of this.data.users) this.userEmailIndex.set(u.email.toLowerCase(), u);
    for (const v of this.data.vehicles) this.vehicleIndex.set(v.id, v);
    for (const c of this.data.customers) this.customerIndex.set(c.id, c);
    for (const e of this.data.employees) this.employeeIndex.set(e.id, e);
    for (const s of this.data.sales) this.saleIndex.set(s.id, s);
  }

  private commit() {
    this.rebuildIndexes();
    this.writeToDisk();
  }

  private nextId(table: keyof DatabaseSchema['sequences']): number {
    this.data.sequences[table] = (this.data.sequences[table] || 0) + 1;
    return this.data.sequences[table];
  }

  // ---- Roles & Users ----
  getRoles(): Role[] {
    return this.data.roles;
  }

  getRoleById(id: number): Role | undefined {
    return this.roleIndex.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.userEmailIndex.get(email.toLowerCase());
  }

  getUserById(id: number): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUsers(): User[] {
    return this.data.users.map((u) => {
      const role = this.roleIndex.get(u.roleId);
      const { passwordHash: _ph, resetToken: _rt, resetTokenExpiry: _rte, ...safe } = u;
      return {
        ...safe,
        roleName: role?.name,
        roleLabel: role?.label,
        permissions: role?.permissions || [],
      };
    });
  }

  setResetToken(userId: number, token: string, expiryIso: string) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.resetToken = token;
    user.resetTokenExpiry = expiryIso;
    this.commit();
  }

  updateUserPassword(userId: number, passwordHash: string) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    this.commit();
  }

  updateUserRoleAndStatus(userId: number, updates: { roleId?: number; isActive?: boolean; fullName?: string }) {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    if (updates.roleId !== undefined) {
      if (!this.roleIndex.has(updates.roleId)) throw new Error('Invalid role foreign key');
      user.roleId = updates.roleId;
      const emp = this.data.employees.find((e) => e.userId === userId);
      if (emp) emp.roleId = updates.roleId;
    }
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    this.commit();
    return this.getUsers().find((u) => u.id === userId)!;
  }

  // ---- Vehicles & Images ----
  getVehicles(): Vehicle[] {
    return this.data.vehicles.map((v) => ({
      ...v,
      images: this.data.vehicle_images.filter((img) => img.vehicleId === v.id),
    }));
  }

  getVehicleById(id: number): Vehicle | undefined {
    const v = this.vehicleIndex.get(id);
    if (!v) return undefined;
    return {
      ...v,
      images: this.data.vehicle_images.filter((img) => img.vehicleId === v.id),
    };
  }

  createVehicle(
    payload: Omit<Vehicle, 'id' | 'carCode' | 'createdAt' | 'images'>,
    imageUrls: string[]
  ): Vehicle {
    const id = this.nextId('vehicles');
    const year = payload.manufacturingYear || new Date().getFullYear();
    const carCode = `VEH-${year}-${String(id).padStart(2, '0')}`;
    const newVehicle: Vehicle = {
      ...payload,
      id,
      carCode,
      createdAt: new Date().toISOString(),
    };
    this.data.vehicles.unshift(newVehicle);

    const imgs = imageUrls.length > 0 ? imageUrls : [SEDAN_IMG];
    imgs.forEach((url, idx) => {
      const imgId = this.nextId('vehicle_images');
      this.data.vehicle_images.push({
        id: imgId,
        vehicleId: id,
        imageUrl: url,
        isPrimary: idx === 0,
        caption: `${payload.brand} ${payload.model} View ${idx + 1}`,
        createdAt: new Date().toISOString(),
      });
    });

    this.commit();
    return this.getVehicleById(id)!;
  }

  updateVehicle(
    id: number,
    payload: Partial<Omit<Vehicle, 'id' | 'carCode' | 'createdAt' | 'images'>>,
    imageUrls?: string[]
  ): Vehicle {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Vehicle not found');
    this.data.vehicles[idx] = { ...this.data.vehicles[idx], ...payload };

    if (imageUrls && imageUrls.length > 0) {
      this.data.vehicle_images = this.data.vehicle_images.filter((img) => img.vehicleId !== id);
      imageUrls.forEach((url, i) => {
        const imgId = this.nextId('vehicle_images');
        this.data.vehicle_images.push({
          id: imgId,
          vehicleId: id,
          imageUrl: url,
          isPrimary: i === 0,
          caption: `${this.data.vehicles[idx].brand} ${this.data.vehicles[idx].model} View ${i + 1}`,
          createdAt: new Date().toISOString(),
        });
      });
    }

    this.commit();
    return this.getVehicleById(id)!;
  }

  deleteVehicle(id: number) {
    const hasSale = this.data.sale_items.some((item) => item.vehicleId === id);
    if (hasSale) {
      throw new Error('Cannot delete a vehicle linked to existing sales records. Mark it as Sold or Under Maintenance instead.');
    }
    this.data.vehicles = this.data.vehicles.filter((v) => v.id !== id);
    this.data.vehicle_images = this.data.vehicle_images.filter((img) => img.vehicleId !== id);
    this.data.enquiries = this.data.enquiries.map((e) =>
      e.interestedVehicleId === id ? { ...e, interestedVehicleId: null } : e
    );
    this.data.test_drives = this.data.test_drives.filter((td) => td.vehicleId !== id);
    this.commit();
  }

  // ---- Customers ----
  getCustomers(): Customer[] {
    return this.data.customers.map((c) => {
      const custSales = this.data.sales.filter((s) => s.customerId === c.id && s.status !== 'Cancelled');
      const totalSpent = custSales.reduce((acc, s) => acc + s.finalAmount, 0);
      return {
        ...c,
        totalPurchases: custSales.length,
        totalSpent,
      };
    });
  }

  getCustomerById(id: number): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  }

  createCustomer(payload: Omit<Customer, 'id' | 'customerCode' | 'createdAt'>): Customer {
    const id = this.nextId('customers');
    const customerCode = `CUST-${400 + id}`;
    const newCustomer: Customer = {
      ...payload,
      id,
      customerCode,
      createdAt: new Date().toISOString(),
    };
    this.data.customers.unshift(newCustomer);
    this.commit();
    return this.getCustomerById(id)!;
  }

  updateCustomer(id: number, payload: Partial<Omit<Customer, 'id' | 'customerCode' | 'createdAt'>>): Customer {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    this.data.customers[idx] = { ...this.data.customers[idx], ...payload };
    this.commit();
    return this.getCustomerById(id)!;
  }

  deleteCustomer(id: number) {
    const hasSales = this.data.sales.some((s) => s.customerId === id);
    if (hasSales) {
      throw new Error('Cannot delete customer with existing sales or invoice history.');
    }
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    this.data.test_drives = this.data.test_drives.filter((td) => td.customerId !== id);
    this.commit();
  }

  // ---- Employees ----
  getEmployees(): Employee[] {
    return this.data.employees.map((emp) => {
      const role = this.roleIndex.get(emp.roleId);
      const empSales = this.data.sales.filter((s) => s.employeeId === emp.id && s.status !== 'Cancelled');
      const totalRevenue = empSales.reduce((sum, s) => sum + s.finalAmount, 0);
      const earnedCommission = Math.round((totalRevenue * emp.commissionRate) / 100);
      return {
        ...emp,
        roleName: role?.name,
        roleLabel: role?.label,
        totalSalesCount: empSales.length,
        totalRevenue,
        earnedCommission,
      };
    });
  }

  createEmployee(
    payload: Omit<Employee, 'id' | 'employeeCode' | 'userId'> & { password?: string }
  ): Employee {
    if (!this.roleIndex.has(payload.roleId)) {
      throw new Error('Invalid role specified');
    }
    if (this.userEmailIndex.has(payload.email.toLowerCase())) {
      throw new Error('An account with this email already exists');
    }

    const userId = this.nextId('users');
    const newUser: User = {
      id: userId,
      email: payload.email.toLowerCase(),
      passwordHash: hashInitialPassword(payload.password || 'Welcome@123'),
      fullName: payload.fullName,
      roleId: payload.roleId,
      isActive: payload.status === 'Active',
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);

    const id = this.nextId('employees');
    const employeeCode = `EMP-${1000 + id}`;
    const { password: _pwd, ...empFields } = payload;
    const newEmp: Employee = {
      ...empFields,
      id,
      userId,
      employeeCode,
    };
    this.data.employees.push(newEmp);
    this.commit();
    return this.getEmployees().find((e) => e.id === id)!;
  }

  updateEmployee(id: number, payload: Partial<Omit<Employee, 'id' | 'employeeCode'>>): Employee {
    const idx = this.data.employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Employee not found');
    const current = this.data.employees[idx];
    if (payload.roleId !== undefined && !this.roleIndex.has(payload.roleId)) {
      throw new Error('Invalid role foreign key');
    }
    this.data.employees[idx] = { ...current, ...payload };

    if (current.userId) {
      const u = this.data.users.find((usr) => usr.id === current.userId);
      if (u) {
        if (payload.fullName) u.fullName = payload.fullName;
        if (payload.roleId) u.roleId = payload.roleId;
        if (payload.status) u.isActive = payload.status === 'Active';
      }
    }
    this.commit();
    return this.getEmployees().find((e) => e.id === id)!;
  }

  deleteEmployee(id: number) {
    const hasSales = this.data.sales.some((s) => s.employeeId === id);
    if (hasSales) {
      throw new Error('Cannot delete employee assigned to historical sales. Mark status as Inactive instead.');
    }
    const emp = this.data.employees.find((e) => e.id === id);
    this.data.employees = this.data.employees.filter((e) => e.id !== id);
    if (emp?.userId) {
      this.data.users = this.data.users.filter((u) => u.id !== emp.userId);
    }
    this.commit();
  }

  // ---- Enquiries ----
  getEnquiries(): Enquiry[] {
    return this.data.enquiries.map((e) => {
      const emp = e.assignedEmployeeId ? this.employeeIndex.get(e.assignedEmployeeId) : undefined;
      return {
        ...e,
        assignedEmployeeName: emp?.fullName || 'Unassigned',
      };
    });
  }

  createEnquiry(payload: Omit<Enquiry, 'id' | 'enquiryCode' | 'createdAt'>): Enquiry {
    const id = this.nextId('enquiries');
    const enquiryCode = `ENQ-${800 + id}`;
    let interestedCarLabel = payload.interestedCarLabel;
    if (payload.interestedVehicleId) {
      const v = this.vehicleIndex.get(payload.interestedVehicleId);
      if (v) interestedCarLabel = `${v.brand} ${v.model}`;
    }
    const newEnquiry: Enquiry = {
      ...payload,
      interestedCarLabel,
      id,
      enquiryCode,
      createdAt: new Date().toISOString(),
    };
    this.data.enquiries.unshift(newEnquiry);
    this.commit();
    return this.getEnquiries().find((e) => e.id === id)!;
  }

  updateEnquiry(id: number, payload: Partial<Omit<Enquiry, 'id' | 'enquiryCode' | 'createdAt'>>): Enquiry {
    const idx = this.data.enquiries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Enquiry not found');
    const updated = { ...this.data.enquiries[idx], ...payload };
    if (payload.interestedVehicleId) {
      const v = this.vehicleIndex.get(payload.interestedVehicleId);
      if (v) updated.interestedCarLabel = `${v.brand} ${v.model}`;
    }
    this.data.enquiries[idx] = updated;
    this.commit();
    return this.getEnquiries().find((e) => e.id === id)!;
  }

  deleteEnquiry(id: number) {
    this.data.enquiries = this.data.enquiries.filter((e) => e.id !== id);
    this.commit();
  }

  // ---- Test Drives ----
  getTestDrives(): TestDrive[] {
    return this.data.test_drives.map((td) => {
      const cust = this.customerIndex.get(td.customerId);
      const veh = this.vehicleIndex.get(td.vehicleId);
      const emp = td.assignedEmployeeId ? this.employeeIndex.get(td.assignedEmployeeId) : undefined;
      return {
        ...td,
        customerName: cust?.fullName || 'Unknown Customer',
        customerMobile: cust?.mobile || '',
        vehicleLabel: veh ? `${veh.brand} ${veh.model} (${veh.carCode})` : 'Unknown Vehicle',
        assignedEmployeeName: emp?.fullName || 'Unassigned',
      };
    });
  }

  createTestDrive(payload: Omit<TestDrive, 'id' | 'bookingCode' | 'createdAt'>): TestDrive {
    if (!this.customerIndex.has(payload.customerId)) throw new Error('Customer does not exist');
    if (!this.vehicleIndex.has(payload.vehicleId)) throw new Error('Vehicle does not exist');
    const id = this.nextId('test_drives');
    const bookingCode = `TD-${300 + id}`;
    const newTd: TestDrive = {
      ...payload,
      id,
      bookingCode,
      createdAt: new Date().toISOString(),
    };
    this.data.test_drives.unshift(newTd);
    this.commit();
    return this.getTestDrives().find((t) => t.id === id)!;
  }

  updateTestDrive(id: number, payload: Partial<Omit<TestDrive, 'id' | 'bookingCode' | 'createdAt'>>): TestDrive {
    const idx = this.data.test_drives.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Test drive booking not found');
    this.data.test_drives[idx] = { ...this.data.test_drives[idx], ...payload };
    this.commit();
    return this.getTestDrives().find((t) => t.id === id)!;
  }

  deleteTestDrive(id: number) {
    this.data.test_drives = this.data.test_drives.filter((t) => t.id !== id);
    this.commit();
  }

  // ---- Sales, Sale Items, Payments & Invoices ----
  getSales(): Sale[] {
    return this.data.sales.map((s) => {
      const cust = this.customerIndex.get(s.customerId);
      const emp = this.employeeIndex.get(s.employeeId);
      const items = this.data.sale_items
        .filter((item) => item.saleId === s.id)
        .map((item) => {
          const v = this.vehicleIndex.get(item.vehicleId);
          return {
            ...item,
            vehicleLabel: v ? `${v.brand} ${v.model} ${v.variant}` : 'Vehicle',
            carCode: v?.carCode || '',
          };
        });
      const inv = this.data.invoices.find((i) => i.saleId === s.id);
      return {
        ...s,
        customerName: cust?.fullName || 'Unknown',
        customerMobile: cust?.mobile || '',
        customerEmail: cust?.email || '',
        employeeName: emp?.fullName || 'Unassigned',
        items,
        invoiceNumber: inv?.invoiceNumber,
        invoiceId: inv?.id,
      };
    });
  }

  createSale(input: {
    customerId: number;
    vehicleId: number;
    employeeId: number;
    saleDate: string;
    sellingPrice: number;
    discountAmount: number;
    gstRate: number;
    advancePaid: number;
    paymentMethod: Sale['paymentMethod'];
    status?: Sale['status'];
    notes?: string;
    referenceNumber?: string;
    emiBank?: string;
    emiTenureMonths?: number;
    emiMonthlyAmount?: number;
  }): Sale {
    const customer = this.customerIndex.get(input.customerId);
    if (!customer) throw new Error('Selected customer not found');
    const vehicle = this.vehicleIndex.get(input.vehicleId);
    if (!vehicle) throw new Error('Selected vehicle not found');
    if (vehicle.status === 'Sold') {
      throw new Error('Selected vehicle is already marked as Sold');
    }
    const employee = this.employeeIndex.get(input.employeeId);
    if (!employee) throw new Error('Selected sales executive not found');

    const subtotal = Math.max(0, Number(input.sellingPrice));
    const discountAmount = Math.max(0, Math.min(subtotal, Number(input.discountAmount || 0)));
    const taxableValue = subtotal - discountAmount;
    const gstRate = Number(input.gstRate ?? this.data.settings[0]?.defaultGstRate ?? 28);
    const gstAmount = Math.round((taxableValue * gstRate) / 100);
    const finalAmount = taxableValue + gstAmount;
    const advancePaid = Math.max(0, Math.min(finalAmount, Number(input.advancePaid || 0)));
    const remainingBalance = Math.max(0, finalAmount - advancePaid);

    const status: Sale['status'] =
      input.status || (remainingBalance === 0 ? 'Completed' : advancePaid > 0 ? 'Confirmed' : 'Pending');

    const saleId = this.nextId('sales');
    const saleCode = `SAL-2026-${String(saleId).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const newSale: Sale = {
      id: saleId,
      saleCode,
      customerId: input.customerId,
      employeeId: input.employeeId,
      saleDate: input.saleDate || nowIso.slice(0, 10),
      subtotal,
      discountAmount,
      gstRate,
      gstAmount,
      finalAmount,
      advancePaid,
      remainingBalance,
      paymentMethod: input.paymentMethod,
      status,
      notes: input.notes || '',
      createdAt: nowIso,
    };
    this.data.sales.unshift(newSale);

    // Sale Item
    const itemId = this.nextId('sale_items');
    this.data.sale_items.push({
      id: itemId,
      saleId,
      vehicleId: input.vehicleId,
      unitPrice: subtotal,
      quantity: 1,
      lineTotal: subtotal,
    });

    // Update vehicle inventory status automatically
    const vehObj = this.data.vehicles.find((v) => v.id === input.vehicleId)!;
    if (status === 'Completed' || remainingBalance === 0) {
      const remainingStock = Math.max(0, vehObj.stockQuantity - 1);
      vehObj.stockQuantity = remainingStock;
      if (remainingStock === 0) vehObj.status = 'Sold';
    } else if (status === 'Confirmed' || status === 'Pending') {
      vehObj.status = 'Reserved';
    }

    // Record initial advance payment if > 0
    if (advancePaid > 0) {
      const payId = this.nextId('payments');
      this.data.payments.unshift({
        id: payId,
        receiptNumber: `RCP-2026-${100 + payId}`,
        saleId,
        customerId: input.customerId,
        amount: advancePaid,
        paymentMethod: input.paymentMethod,
        paymentType: remainingBalance === 0 ? 'Final Settlement' : 'Advance',
        referenceNumber: input.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
        emiBank: input.emiBank,
        emiTenureMonths: input.emiTenureMonths,
        emiMonthlyAmount: input.emiMonthlyAmount,
        paymentDate: newSale.saleDate,
        notes: 'Recorded at sale creation',
        createdAt: nowIso,
      });
    }

    // Automatically generate Sales Invoice
    const invId = this.nextId('invoices');
    const settings = this.data.settings[0];
    this.data.invoices.unshift({
      id: invId,
      invoiceNumber: `INV-2026-${String(invId).padStart(4, '0')}`,
      saleId,
      invoiceDate: newSale.saleDate,
      dueAmount: remainingBalance,
      status: remainingBalance === 0 ? 'Paid' : advancePaid > 0 ? 'Partially Paid' : 'Unpaid',
      termsAndConditions: settings?.invoiceTerms || '',
      createdAt: nowIso,
    });

    this.commit();
    return this.getSales().find((s) => s.id === saleId)!;
  }

  updateSaleStatus(saleId: number, status: Sale['status']): Sale {
    const sale = this.data.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Sale not found');
    sale.status = status;

    const inv = this.data.invoices.find((i) => i.saleId === saleId);
    const item = this.data.sale_items.find((si) => si.saleId === saleId);
    const veh = item ? this.data.vehicles.find((v) => v.id === item.vehicleId) : undefined;

    if (status === 'Cancelled') {
      if (inv) inv.status = 'Cancelled';
      if (veh) {
        veh.status = 'Available';
        if (veh.stockQuantity === 0) veh.stockQuantity = 1;
      }
    } else if (status === 'Completed') {
      if (veh) {
        veh.stockQuantity = Math.max(0, veh.stockQuantity - 1);
        if (veh.stockQuantity === 0) veh.status = 'Sold';
      }
    } else if (status === 'Confirmed' && veh && veh.status === 'Available') {
      veh.status = 'Reserved';
    }

    this.commit();
    return this.getSales().find((s) => s.id === saleId)!;
  }

  // ---- Payments ----
  getPayments(): Payment[] {
    return this.data.payments.map((p) => {
      const sale = this.saleIndex.get(p.saleId);
      const cust = this.customerIndex.get(p.customerId);
      return {
        ...p,
        saleCode: sale?.saleCode || '',
        customerName: cust?.fullName || 'Unknown',
      };
    });
  }

  recordPayment(input: {
    saleId: number;
    amount: number;
    paymentMethod: Payment['paymentMethod'];
    paymentType: Payment['paymentType'];
    referenceNumber: string;
    paymentDate: string;
    notes?: string;
    emiBank?: string;
    emiTenureMonths?: number;
    emiMonthlyAmount?: number;
  }): Payment {
    const sale = this.data.sales.find((s) => s.id === input.saleId);
    if (!sale) throw new Error('Referenced sale not found');
    if (sale.status === 'Cancelled') throw new Error('Cannot record payment for a cancelled sale');
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Payment amount must be greater than zero');
    if (amount > sale.remainingBalance) {
      throw new Error(`Payment exceeds remaining balance (${sale.remainingBalance})`);
    }

    const payId = this.nextId('payments');
    const newPay: Payment = {
      id: payId,
      receiptNumber: `RCP-2026-${100 + payId}`,
      saleId: sale.id,
      customerId: sale.customerId,
      amount,
      paymentMethod: input.paymentMethod,
      paymentType: input.paymentType,
      referenceNumber: input.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      emiBank: input.emiBank,
      emiTenureMonths: input.emiTenureMonths,
      emiMonthlyAmount: input.emiMonthlyAmount,
      paymentDate: input.paymentDate || new Date().toISOString().slice(0, 10),
      notes: input.notes || '',
      createdAt: new Date().toISOString(),
    };
    this.data.payments.unshift(newPay);

    sale.advancePaid += amount;
    sale.remainingBalance = Math.max(0, sale.finalAmount - sale.advancePaid);
    if (sale.remainingBalance === 0) {
      sale.status = 'Completed';
      const item = this.data.sale_items.find((si) => si.saleId === sale.id);
      const veh = item ? this.data.vehicles.find((v) => v.id === item.vehicleId) : undefined;
      if (veh) {
        veh.stockQuantity = Math.max(0, veh.stockQuantity - 1);
        if (veh.stockQuantity === 0) veh.status = 'Sold';
      }
    }

    const inv = this.data.invoices.find((i) => i.saleId === sale.id);
    if (inv) {
      inv.dueAmount = sale.remainingBalance;
      inv.status = sale.remainingBalance === 0 ? 'Paid' : 'Partially Paid';
    }

    this.commit();
    return this.getPayments().find((p) => p.id === payId)!;
  }

  // ---- Invoices ----
  getInvoices(): Invoice[] {
    const allSales = this.getSales();
    return this.data.invoices.map((inv) => {
      const sale = allSales.find((s) => s.id === inv.saleId);
      const customer = sale ? this.customerIndex.get(sale.customerId) : undefined;
      const firstItem = sale?.items?.[0];
      const vehicle = firstItem ? this.vehicleIndex.get(firstItem.vehicleId) : undefined;
      const payments = this.data.payments.filter((p) => p.saleId === inv.saleId);
      return {
        ...inv,
        sale,
        customer,
        vehicle,
        payments,
      };
    });
  }

  // ---- Expenses ----
  getExpenses(): Expense[] {
    return this.data.expenses;
  }

  createExpense(payload: Omit<Expense, 'id'>): Expense {
    const id = this.nextId('expenses');
    const exp: Expense = { ...payload, id };
    this.data.expenses.unshift(exp);
    this.commit();
    return exp;
  }

  deleteExpense(id: number) {
    this.data.expenses = this.data.expenses.filter((e) => e.id !== id);
    this.commit();
  }

  // ---- Settings & Backup ----
  getSettings(): DealershipSettings {
    return this.data.settings[0];
  }

  updateSettings(payload: Partial<DealershipSettings>): DealershipSettings {
    this.data.settings[0] = { ...this.data.settings[0], ...payload };
    this.commit();
    return this.data.settings[0];
  }

  exportBackup(): DatabaseSchema {
    this.data.settings[0].lastBackupAt = new Date().toISOString();
    this.commit();
    return this.data;
  }
}

export const db = new RelationalStore();
