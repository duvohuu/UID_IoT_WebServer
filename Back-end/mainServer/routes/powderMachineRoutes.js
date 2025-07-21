import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { 
    getWorkShifts, 
} from "../controllers/powderMachineController.js";

const router = express.Router();


router.get("/", authenticateToken, getWorkShifts);

export default router;