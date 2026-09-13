import mongoose, { Document, Schema } from 'mongoose';

export interface IRepair {
  _id?: mongoose.Types.ObjectId;
  vehicle: mongoose.Types.ObjectId | any;
  description: string;
  repairDate: Date;
  cost: number;
  serviceProvider: string;
  mileage: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const RepairSchema: Schema<IRepair> = new Schema(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    description: {
      type: String,
      required: [true, 'Repair description is required'],
      trim: true,
    },
    repairDate: {
      type: Date,
      required: [true, 'Repair date is required'],
      default: Date.now,
    },
    cost: {
      type: Number,
      required: [true, 'Repair cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    serviceProvider: {
      type: String,
      required: [true, 'Service provider or garage is required'],
      trim: true,
    },
    mileage: {
      type: Number,
      default: 0,
      min: [0, 'Mileage cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Repair: mongoose.Model<IRepair> =
  (mongoose.models.Repair as mongoose.Model<IRepair>) ||
  mongoose.model<IRepair>('Repair', RepairSchema);
