import express from "express";
import { 
    getWorkShifts, 
    getWorkShiftById, 
    getWorkShiftStats, 
    getActiveWorkShifts 
} from "../controllers/internalPowderMachineController.js";

const router = express.Router();

router.get('/', getWorkShifts);
router.get('/stats', getWorkShiftStats); 
router.get('/stats/summary', getWorkShiftStats);
router.get('/active/current', getActiveWorkShifts);
router.get('/:shiftId', getWorkShiftById);

export default router;