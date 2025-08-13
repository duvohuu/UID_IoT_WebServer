import express from "express";
import { 
    handleMachineUpdate, 
    handleShiftChanged, 
    receiveNotificationFromDB 
} from "../controllers/internalController.js";

const router = express.Router();

// Existing routes
router.post("/machine-update", handleMachineUpdate);
router.post("/shift-changed", handleShiftChanged);
router.post('/notifications', receiveNotificationFromDB);

export default router;