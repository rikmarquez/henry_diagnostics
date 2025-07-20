"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.changePassword = exports.getProfile = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const connection_1 = require("../database/connection");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'Contraseña requerida'),
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
    nombre: zod_1.z.string().min(1, 'Nombre requerido'),
    rol: zod_1.z.enum(['administrador', 'mecanico', 'seguimiento'], {
        errorMap: () => ({ message: 'Rol inválido' })
    }),
    telefono: zod_1.z.string().optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Contraseña actual requerida'),
    newPassword: zod_1.z.string().min(8, 'Nueva contraseña debe tener al menos 8 caracteres'),
});
const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const result = await (0, connection_1.query)('SELECT user_id, email, password_hash, nombre, rol, telefono, activo FROM users WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const user = result.rows[0];
        if (!user.activo) {
            return res.status(401).json({ message: 'Usuario inactivo' });
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        // No enviar el hash de la contraseña
        const { password_hash, ...userWithoutPassword } = user;
        res.json({
            message: 'Inicio de sesión exitoso',
            user: userWithoutPassword,
            token,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => e.message),
            });
        }
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { email, password, nombre, rol, telefono } = registerSchema.parse(req.body);
        // Verificar si el email ya existe
        const existingUser = await (0, connection_1.query)('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        // Hashear la contraseña
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // Insertar el nuevo usuario
        const result = await (0, connection_1.query)(`INSERT INTO users (email, password_hash, nombre, rol, telefono, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, email, nombre, rol, telefono, activo, fecha_creacion`, [email.toLowerCase(), passwordHash, nombre, rol, telefono, true]);
        const newUser = result.rows[0];
        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: newUser,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => e.message),
            });
        }
        console.error('Error en register:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.register = register;
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        res.json({
            user: req.user,
        });
    }
    catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getProfile = getProfile;
const changePassword = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
        // Obtener la contraseña actual del usuario
        const result = await (0, connection_1.query)('SELECT password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // Verificar la contraseña actual
        const isValidCurrentPassword = await bcryptjs_1.default.compare(currentPassword, result.rows[0].password_hash);
        if (!isValidCurrentPassword) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta' });
        }
        // Hashear la nueva contraseña
        const newPasswordHash = await bcryptjs_1.default.hash(newPassword, 12);
        // Actualizar la contraseña en la base de datos
        await (0, connection_1.query)('UPDATE users SET password_hash = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE user_id = $2', [newPasswordHash, req.user.user_id]);
        res.json({ message: 'Contraseña cambiada exitosamente' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: error.errors.map(e => e.message),
            });
        }
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.changePassword = changePassword;
const logout = async (req, res) => {
    // Con JWT, el logout es manejado en el frontend removiendo el token
    res.json({ message: 'Sesión cerrada exitosamente' });
};
exports.logout = logout;
//# sourceMappingURL=auth.js.map