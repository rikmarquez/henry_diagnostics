"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSeguimientoOrAdmin = exports.requireMecanicoOrAdmin = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token de acceso requerido' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const result = await (0, connection_1.query)('SELECT user_id, email, nombre, rol, telefono, activo FROM users WHERE user_id = $1 AND activo = true', [decoded.userId]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado o inactivo' });
        }
        req.user = result.rows[0];
        next();
    }
    catch (error) {
        console.error('Error verificando token:', error);
        return res.status(403).json({ message: 'Token inválido' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'Permisos insuficientes' });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['administrador']);
exports.requireMecanicoOrAdmin = (0, exports.requireRole)(['mecanico', 'administrador']);
exports.requireSeguimientoOrAdmin = (0, exports.requireRole)(['seguimiento', 'administrador']);
//# sourceMappingURL=auth.js.map