import express from "express";
import { registerUser, loginUser, logoutUser, updateAvatar, changePassword } from "../controllers/usersController.js";
import { authenticateToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/update-avatar", authenticateToken, upload.single("avatar"), updateAvatar);
router.post("/change-password", authenticateToken, changePassword); 

router.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ valid: true });
});

export default router;