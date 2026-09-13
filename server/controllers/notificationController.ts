import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.js';
import { checkAndGenerateExpirationNotifications } from '../services/notificationService.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { unreadOnly } = req.query;
    const filter: any = {};
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ read: false });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: true, message: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const generated = await checkAndGenerateExpirationNotifications();
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ read: false });

    res.json({
      success: true,
      message: `Checked document expirations. ${generated} new notification(s) generated.`,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};
