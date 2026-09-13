import mongoose, { Document, Schema } from 'mongoose';

export type DriverStatus = 'available' | 'assigned' | 'inactive';

export interface IDriver {
  _id?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone: string;
  email: string;
  licenseCategory: string;
  experienceYears: number;
  status: DriverStatus;
  assignedVehicle?: mongoose.Types.ObjectId | null;
  user?: mongoose.Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const DriverSchema: Schema<IDriver> = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    licenseCategory: {
      type: String,
      required: [true, 'License category is required'],
      enum: ['B', 'C', 'C+E', 'D', 'D+E'],
      default: 'C+E',
    },
    experienceYears: {
      type: Number,
      required: [true, 'Experience in years is required'],
      min: [0, 'Experience cannot be negative'],
      default: 3,
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'inactive'],
      default: 'available',
    },
    assignedVehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
DriverSchema.virtual('fullName').get(function (this: IDriver) {
  return `${this.firstName} ${this.lastName}`;
});

DriverSchema.set('toJSON', { virtuals: true });
DriverSchema.set('toObject', { virtuals: true });

export const Driver: mongoose.Model<IDriver> =
  (mongoose.models.Driver as mongoose.Model<IDriver>) || mongoose.model<IDriver>('Driver', DriverSchema);
