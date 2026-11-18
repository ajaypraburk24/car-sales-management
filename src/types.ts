export type RoleName = 'admin' | 'manager' | 'sales_executive';

export interface Role {
  id: number;
  name: RoleName;
  label: string;
  permissions: string[];
}

export interface User {
  id: number;
  email: string;
  passwordHash?: string;
  fullName: string;
  roleId: number;
  roleName?: RoleName;
  roleLabel?: string;
  permissions?: string[];
  isActive: boolean;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
  createdAt: string;
}

export interface Employee {
  id: number;
  userId: number | null;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: number;
  roleName?: RoleName;
  roleLabel?: string;
  department: string;
  monthlyTarget: number;
  commissionRate: number;
  joiningDate: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  totalSalesCount?: number;
  totalRevenue?: number;
  earnedCommission?: number;
}

export type VehicleStatus = 'Available' | 'Reserved' | 'Sold' | 'Under Maintenance';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG';
export type TransmissionType = 'Automatic' | 'Manual' | 'DCT' | 'CVT';

export interface VehicleImage {
  id: number;
  vehicleId: number;
  imageUrl: string;
  isPrimary: boolean;
  caption: string;
  createdAt: string;
}

export interface Vehicle {
  id: number;
  carCode: string;
  brand: string;
  model: string;
  variant: string;
  manufacturingYear: number;
  registrationNumber: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  mileage: string;
  engineCapacity: string;
  colour: string;
  kilometresDriven: number;
  exShowroomPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  description: string;
  status: VehicleStatus;
  createdAt: string;
  images?: VehicleImage[];
}

export interface Customer {
  id: number;
  customerCode: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  idProofType: 'PAN' | 'Aadhaar' | 'Passport' | 'None';
  idProofNumber: string;
  createdAt: string;
  totalPurchases?: number;
  totalSpent?: number;
}

export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Test Drive Scheduled'
  | 'Converted'
  | 'Lost';

export interface Enquiry {
  id: number;
  enquiryCode: string;
  customerName: string;
  contactNumber: string;
  email: string;
  interestedVehicleId: number | null;
  interestedCarLabel: string;
  budget: number;
  enquiryDate: string;
  followUpDate: string;
  assignedEmployeeId: number | null;
  assignedEmployeeName?: string;
  status: EnquiryStatus;
  followUpNotes: string;
  createdAt: string;
}

export type TestDriveStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-Show';

export interface TestDrive {
  id: number;
  bookingCode: string;
  customerId: number;
  customerName?: string;
  customerMobile?: string;
  vehicleId: number;
  vehicleLabel?: string;
  scheduledDate: string;
  scheduledTime: string;
  assignedEmployeeId: number | null;
  assignedEmployeeName?: string;
  status: TestDriveStatus;
  feedbackNotes: string;
  createdAt: string;
}

export type SaleStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'UPI' | 'Credit/Debit Card' | 'Bank Transfer' | 'EMI';

export interface SaleItem {
  id: number;
  saleId: number;
  vehicleId: number;
  vehicleLabel?: string;
  carCode?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Sale {
  id: number;
  saleCode: string;
  customerId: number;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  employeeId: number;
  employeeName?: string;
  saleDate: string;
  subtotal: number;
  discountAmount: number;
  gstRate: number;
  gstAmount: number;
  finalAmount: number;
  advancePaid: number;
  remainingBalance: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
  createdAt: string;
  items?: SaleItem[];
  invoiceNumber?: string;
  invoiceId?: number;
}

export interface Payment {
  id: number;
  receiptNumber: string;
  saleId: number;
  saleCode?: string;
  customerId: number;
  customerName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: 'Advance' | 'Installment' | 'Final Settlement' | 'Booking';
  referenceNumber: string;
  emiBank?: string;
  emiTenureMonths?: number;
  emiMonthlyAmount?: number;
  paymentDate: string;
  notes: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  saleId: number;
  invoiceDate: string;
  dueAmount: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Cancelled';
  termsAndConditions: string;
  createdAt: string;
  sale?: Sale;
  customer?: Customer;
  vehicle?: Vehicle;
  payments?: Payment[];
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  recordedByUserId: number;
}

export interface DealershipSettings {
  id: number;
  dealershipName: string;
  tagline: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  defaultGstRate: number;
  currencySymbol: string;
  invoiceTerms: string;
  notifyLowStock: boolean;
  notifyPendingPayments: boolean;
  notifyTestDrives: boolean;
  lastBackupAt: string;
}

export interface DashboardSummary {
  kpis: {
    totalCars: number;
    availableCars: number;
    soldCars: number;
    reservedCars: number;
    totalCustomers: number;
    totalSalesCount: number;
    totalRevenue: number;
    pendingPayments: number;
    totalExpenses: number;
    netProfit: number;
  };
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    salesCount: number;
    expenses: number;
  }>;
  recentSales: Sale[];
  recentCustomers: Customer[];
  bestSellingCars: Array<{
    brand: string;
    model: string;
    unitsSold: number;
    revenue: number;
  }>;
  salesPerformance: Array<{
    employeeId: number;
    name: string;
    salesCount: number;
    revenue: number;
    target: number;
    achievementPct: number;
  }>;
}
