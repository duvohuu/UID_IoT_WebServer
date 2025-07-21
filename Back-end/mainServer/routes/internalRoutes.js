import express from "express";
import { 
    handleMachineUpdate,
    handleShiftChanged
} from "../controllers/internalController.js";

const router = express.Router();

router.post("/machine-update", handleMachineUpdate);
router.post("/shift-changed", handleShiftChanged);

export default router;