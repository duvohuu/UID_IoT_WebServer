import express from 'express';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Public API routes (cho frontend)
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

export default router;