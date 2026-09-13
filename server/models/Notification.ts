import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'inspection_expiry' | 'insurance_expiry' | 'trip_status' | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface INotification {
  _id?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  relatedEntity: 'Vehicle' | 'Trip' | 'Driver' | 'General';
  relatedEntityId?: mongoose.Types.ObjectId | any;
  read: boolean;
  targetRole: 'all' | 'admin' | 'dispatcher' | 'driver';
  targetUser?: mongoose.Types.ObjectId | any;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    type: {
      type: String,
      enum: ['inspection_expiry', 'insurance_expiry', 'trip_status', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    relatedEntity: {
      type: String,
      enum: ['Vehicle', 'Trip', 'Driver', 'General'],
      default: 'General',
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    targetRole: {
      type: String,
      enum: ['all', 'admin', 'dispatcher', 'driver'],
      default: 'all',
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification: mongoose.Model<INotification> =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);
