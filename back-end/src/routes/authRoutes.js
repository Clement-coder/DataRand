import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', authController.loginOrRegister);
router.get('/profile', authMiddleware, authController.getProfile);

export default router;
