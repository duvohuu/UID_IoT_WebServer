import express from "express";
import { getMachines, getMachineByIp } from "../controllers/machineController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getMachines);
router.get("/ip/:ip", getMachineByIp);

export default router;