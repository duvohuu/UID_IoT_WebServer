import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { 
    getWorkShifts, 
    getWorkShiftById, 
    getWorkShiftStats, 
    getActiveWorkShifts 
} from "../controllers/saltMachineController.js";

const router = express.Router();


router.get("/", authenticateToken, getWorkShifts);
router.get("/stats/summary", authenticateToken, getWorkShiftStats);
router.get("/active/current", authenticateToken, getActiveWorkShifts);
router.get("/:shiftId", authenticateToken, getWorkShiftById);

export default router;