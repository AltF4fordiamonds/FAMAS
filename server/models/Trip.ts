import mongoose, { Document, Schema } from 'mongoose';

export type TripStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface ITrip {
  _id?: mongoose.Types.ObjectId;
  origin: string;
  destination: string;
  cargo: string;
  deadline: Date;
  status: TripStatus;
  driver: mongoose.Types.ObjectId | any;
  vehicle: mongoose.Types.ObjectId | any;
  distance: number; // km
  fuelUsed: number; // liters
  createdAt?: Date;
  updatedAt?: Date;
}

const TripSchema: Schema<ITrip> = new Schema(
  {
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    cargo: {
      type: String,
      required: [true, 'Cargo description is required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Trip deadline date is required'],
    },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed', 'cancelled'],
      default: 'planned',
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Assigned driver is required'],
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Assigned vehicle is required'],
    },
    distance: {
      type: Number,
      default: 0,
      min: [0, 'Distance cannot be negative'],
    },
    fuelUsed: {
      type: Number,
      default: 0,
      min: [0, 'Fuel used cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const Trip: mongoose.Model<ITrip> =
  (mongoose.models.Trip as mongoose.Model<ITrip>) || mongoose.model<ITrip>('Trip', TripSchema);
