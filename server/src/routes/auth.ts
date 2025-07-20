import { Router } from 'express';
import { login, register, getProfile, changePassword, logout } from '../controllers/auth';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.post('/login', login);
router.post('/logout', logout);

// Rutas protegidas
router.get('/profile', authenticateToken, getProfile);
router.put('/change-password', authenticateToken, changePassword);

// Solo administradores pueden registrar nuevos usuarios
router.post('/register', authenticateToken, requireAdmin, register);

export default router;