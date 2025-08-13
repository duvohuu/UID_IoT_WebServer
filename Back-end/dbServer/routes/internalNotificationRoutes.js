import express from 'express';
import { 
    getNotifications, 
    deleteNotification,
    createMachineErrorNotification,
    createIncompleteShiftNotification
} from '../controllers/internalNotificationController.js';

const router = express.Router();

router.get('/', getNotifications);                           // GET /
router.delete('/:id', deleteNotification);                  // DELETE /:id
router.post('/machine-error', createMachineErrorNotification);      // POST /machine-error
router.post('/incomplete-shift', createIncompleteShiftNotification); // POST /incomplete-shift

export default router;