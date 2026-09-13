import mongoose, { Document, Schema } from 'mongoose';

export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'inactive';
export type FuelType = 'diesel' | 'gasoline' | 'electric' | 'hybrid' | 'cng';

export interface IVehicle {
  _id?: mongoose.Types.ObjectId;
  make: string;
  model: string;
  registrationNumber: string;
  year: number;
  status: VehicleStatus;
  technicalInspection: {
    validUntil: Date;
  };
  insurance: {
    validUntil: Date;
    provider: string;
    policyNumber: string;
  };
  fuelType: FuelType;
  fuelConsumption: number; // L/100km or kWh/100km
  currentMileage: number; // in km
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleSchema: Schema<IVehicle> = new Schema(
  {
    make: {
      type: String,
      required: [true, 'Make is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    year: {
      type: Number,
      required: [true, 'Manufacturing year is required'],
      min: [1990, 'Year must be 1990 or later'],
    },
    status: {
      type: String,
      enum: ['available', 'in_use', 'maintenance', 'inactive'],
      default: 'available',
    },
    technicalInspection: {
      validUntil: {
        type: Date,
        required: [true, 'Technical inspection expiration date is required'],
      },
    },
    insurance: {
      validUntil: {
        type: Date,
        required: [true, 'Insurance expiration date is required'],
      },
      provider: {
        type: String,
        trim: true,
        default: 'Allianz Commercial Fleet',
      },
      policyNumber: {
        type: String,
        trim: true,
        default: '',
      },
    },
    fuelType: {
      type: String,
      enum: ['diesel', 'gasoline', 'electric', 'hybrid', 'cng'],
      default: 'diesel',
    },
    fuelConsumption: {
      type: Number,
      default: 28.5,
      min: [0, 'Fuel consumption cannot be negative'],
    },
    currentMileage: {
      type: Number,
      default: 0,
      min: [0, 'Mileage cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const Vehicle: mongoose.Model<IVehicle> =
  (mongoose.models.Vehicle as mongoose.Model<IVehicle>) ||
  mongoose.model<IVehicle>('Vehicle', VehicleSchema);
