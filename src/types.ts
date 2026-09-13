export type UserRole = 'admin' | 'dispatcher' | 'driver';

export interface User {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  driverProfile?: Driver | null;
  createdAt?: string;
  updatedAt?: string;
}

export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'inactive';
export type FuelType = 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'cng';

export interface DocStatus {
  status: 'valid' | 'expiring_soon' | 'expired' | 'unknown';
  daysRemaining: number;
}

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  registrationNumber: string;
  year: number;
  status: VehicleStatus;
  technicalInspection: {
    validUntil: string;
  };
  insurance: {
    validUntil: string;
    provider: string;
    policyNumber: string;
  };
  fuelType: FuelType;
  fuelConsumption: number;
  currentMileage: number;
  assignedDriver?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  inspectionStatus?: DocStatus;
  insuranceStatus?: DocStatus;
  repairs?: Repair[];
  totalRepairCost?: number;
  recentTrips?: Trip[];
  createdAt?: string;
  updatedAt?: string;
}

export type DriverStatus = 'available' | 'assigned' | 'inactive';

export interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone: string;
  email: string;
  licenseCategory: string;
  experienceYears: number;
  status: DriverStatus;
  assignedVehicle?: Vehicle | null;
  user?: {
    _id: string;
    username: string;
    email: string;
    role: UserRole;
  } | null;
  trips?: Trip[];
  createdAt?: string;
  updatedAt?: string;
}

export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  _id: string;
  origin: string;
  destination: string;
  cargo: string;
  deadline: string;
  status: TripStatus;
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    licenseCategory?: string;
  };
  vehicle: {
    _id: string;
    make: string;
    model: string;
    registrationNumber: string;
    status?: VehicleStatus;
    fuelType?: FuelType;
  };
  distance: number;
  fuelUsed: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Repair {
  _id: string;
  vehicle: string | Vehicle;
  description: string;
  repairDate: string;
  cost: number;
  serviceProvider: string;
  mileage: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface NotificationItem {
  _id: string;
  type: 'inspection_expiry' | 'insurance_expiry' | 'trip_status' | 'system';
  title: string;
  message: string;
  severity: NotificationSeverity;
  relatedEntity: 'Vehicle' | 'Trip' | 'Driver' | 'General';
  relatedEntityId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface DashboardStats {
  vehicles: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
    inactive: number;
  };
  drivers: {
    total: number;
    available: number;
    assigned: number;
    inactive: number;
  };
  trips: {
    active: number;
    planned: number;
    completed: number;
    cancelled: number;
    totalDistance: number;
    totalFuel: number;
    avgConsumption: number;
  };
  repairs: {
    totalCost: number;
    recent: Repair[];
  };
  expirations: {
    count: number;
    list: Array<{
      vehicle: {
        _id: string;
        make: string;
        model: string;
        registrationNumber: string;
      };
      expirations: Array<{
        type: string;
        date: string;
        daysRemaining: number;
        isExpired: boolean;
        provider?: string;
      }>;
    }>;
  };
  recentTrips: Trip[];
  charts: {
    monthlyRepairData: Array<{ month: string; cost: number }>;
    fleetStatusChart: Array<{ name: string; value: number; color: string }>;
  };
  unreadNotifications: number;
}
