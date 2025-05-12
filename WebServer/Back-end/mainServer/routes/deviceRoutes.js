    import express from "express";
    import { getDevices } from "../controllers/deviceController.js";
    import { authenticateToken } from "../middleware/auth.js";

    const router = express.Router();

    router.get("/", authenticateToken, getDevices);

    export default router;