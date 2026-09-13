import { Vehicle } from '../models/Vehicle.js';
import { Notification } from '../models/Notification.js';

export async function checkAndGenerateExpirationNotifications(): Promise<number> {
  const now = new Date();
  const vehicles = await Vehicle.find();
  let createdCount = 0;

  for (const vehicle of vehicles) {
    // 1. Technical Inspection check
    if (vehicle.technicalInspection?.validUntil) {
      const inspectionDate = new Date(vehicle.technicalInspection.validUntil);
      const diffMs = inspectionDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let severity: 'warning' | 'critical' | null = null;
      let title = '';
      let message = '';

      if (daysRemaining <= 0) {
        severity = 'critical';
        title = `Technical Inspection Expired: ${vehicle.registrationNumber}`;
        message = `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) technical inspection expired ${Math.abs(daysRemaining)} day(s) ago! Action required immediately.`;
      } else if (daysRemaining <= 7) {
        severity = 'critical';
        title = `Inspection Expiring Soon (${daysRemaining}d): ${vehicle.registrationNumber}`;
        message = `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) technical inspection will expire in ${daysRemaining} day(s) on ${inspectionDate.toLocaleDateString()}.`;
      } else if (daysRemaining <= 30) {
        severity = 'warning';
        title = `Inspection Warning: ${vehicle.registrationNumber}`;
        message = `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) technical inspection expires in ${daysRemaining} days.`;
      }

      if (severity) {
        // Prevent duplicate unread notifications, or duplicate notifications generated in the last 3 days
        const existingUnread = await Notification.findOne({
          relatedEntityId: vehicle._id,
          type: 'inspection_expiry',
          severity,
          read: false,
        });

        const recentDuplicate = await Notification.findOne({
          relatedEntityId: vehicle._id,
          type: 'inspection_expiry',
          severity,
          createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        });

        if (!existingUnread && !recentDuplicate) {
          // If escalating to critical, mark older unread warnings as read
          if (severity === 'critical') {
            await Notification.updateMany(
              { relatedEntityId: vehicle._id, type: 'inspection_expiry', severity: 'warning', read: false },
              { $set: { read: true } }
            );
          }

          await Notification.create({
            type: 'inspection_expiry',
            title,
            message,
            severity,
            relatedEntity: 'Vehicle',
            relatedEntityId: vehicle._id,
            read: false,
            targetRole: 'all',
          });
          createdCount++;
        }
      }
    }

    // 2. Insurance Expiration check
    if (vehicle.insurance?.validUntil) {
      const insuranceDate = new Date(vehicle.insurance.validUntil);
      const diffMs = insuranceDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let severity: 'warning' | 'critical' | null = null;
      let title = '';
      let message = '';

      if (daysRemaining <= 0) {
        severity = 'critical';
        title = `Insurance Expired: ${vehicle.registrationNumber}`;
        message = `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) insurance expired ${Math.abs(daysRemaining)} day(s) ago! Cannot be operated.`;
      } else if (daysRemaining <= 7) {
        severity = 'critical';
        title = `Insurance Expiring Soon (${daysRemaining}d): ${vehicle.registrationNumber}`;
        message = `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) insurance policy with ${vehicle.insurance.provider || 'insurer'} expires in ${daysRemaining} day(s).`;
      } else if (daysRemaining <= 30) {
        severity = 'warning';
        title = `Insurance Expiration Warning: ${vehicle.registrationNumber}`;
        message = `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber}) insurance policy expires in ${daysRemaining} days.`;
      }

      if (severity) {
        const existingUnread = await Notification.findOne({
          relatedEntityId: vehicle._id,
          type: 'insurance_expiry',
          severity,
          read: false,
        });

        const recentDuplicate = await Notification.findOne({
          relatedEntityId: vehicle._id,
          type: 'insurance_expiry',
          severity,
          createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        });

        if (!existingUnread && !recentDuplicate) {
          if (severity === 'critical') {
            await Notification.updateMany(
              { relatedEntityId: vehicle._id, type: 'insurance_expiry', severity: 'warning', read: false },
              { $set: { read: true } }
            );
          }

          await Notification.create({
            type: 'insurance_expiry',
            title,
            message,
            severity,
            relatedEntity: 'Vehicle',
            relatedEntityId: vehicle._id,
            read: false,
            targetRole: 'all',
          });
          createdCount++;
        }
      }
    }
  }

  return createdCount;
}
