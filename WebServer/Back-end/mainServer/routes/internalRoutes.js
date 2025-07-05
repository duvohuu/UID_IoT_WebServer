import express from "express";
import { 
    handleMachineUpdate,
    handleShiftCompleted,
    handleShiftStarted,
    handleShiftChanged
} from "../controllers/internalController.js";

const router = express.Router();

// Internal routes for server-to-server communication
router.post("/machine-update", handleMachineUpdate);
router.post("/shift-completed", handleShiftCompleted);
router.post("/shift-started", handleShiftStarted);
router.post("/shift-changed", handleShiftChanged);

export default router;