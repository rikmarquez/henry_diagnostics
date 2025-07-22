import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth';
import { 
  UserManagementView, 
  CreateUserRequest, 
  UpdateUserRequest, 
  ResetPasswordResponse,
  UserFilters 
} from '../types';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  rol: z.enum(['administrador', 'mecanico', 'seguimiento'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  telefono: z.string().optional(),
});

const updateUserSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  rol: z.enum(['administrador', 'mecanico', 'seguimiento'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }).optional(),
  telefono: z.string().optional(),
  activo: z.boolean().optional(),
});

const userFiltersSchema = z.object({
  search: z.string().optional(),
  rol: z.string().optional(),
  activo: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// Helper function to log user activity
const logActivity = async (
  userId: number,
  action: string,
  details: any = null,
  performedBy?: number,
  req?: Request
) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress;
    const userAgent = req?.get('User-Agent');

    await query(
      'INSERT INTO user_activity_log (user_id, accion, detalles, ip_address, user_agent, realizado_por) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, action, JSON.stringify(details), ipAddress, userAgent, performedBy]
    );
  } catch (error) {
    console.error('Error logging user activity:', error);
  }
};

// Generate temporary password
const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get user statistics
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(*) FILTER (WHERE activo = true) as usuarios_activos,
        COUNT(*) FILTER (WHERE activo = false) as usuarios_inactivos,
        COUNT(*) FILTER (WHERE rol = 'administrador') as administradores,
        COUNT(*) FILTER (WHERE rol = 'mecanico') as mecanicos,
        COUNT(*) FILTER (WHERE rol = 'seguimiento') as seguimiento,
        COUNT(*) FILTER (WHERE password_temporal = true) as passwords_temporales,
        COUNT(*) FILTER (WHERE ultimo_acceso > CURRENT_DATE - INTERVAL '30 days') as activos_mes
      FROM users
    `;

    const result = await query(statsQuery);
    const stats = result.rows[0];

    // Convert to numbers
    Object.keys(stats).forEach(key => {
      stats[key] = parseInt(stats[key]);
    });

    res.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Get users with filtering and pagination
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const filters = userFiltersSchema.parse(req.query);
    
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '10');
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams: any[] = [];
    let paramCounter = 1;

    // Build WHERE conditions
    if (filters.search) {
      whereConditions.push(`(
        nombre ILIKE $${paramCounter} OR 
        email ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${filters.search}%`);
      paramCounter++;
    }

    if (filters.rol) {
      whereConditions.push(`rol = $${paramCounter}`);
      queryParams.push(filters.rol);
      paramCounter++;
    }

    if (filters.activo !== undefined) {
      whereConditions.push(`activo = $${paramCounter}`);
      queryParams.push(filters.activo === 'true');
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const usersQuery = `
      SELECT * FROM user_management_view
      ${whereClause}
      ORDER BY fecha_creacion DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM user_management_view
      ${whereClause}
    `;

    queryParams.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      query(usersQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const users = usersResult.rows.map(user => {
      // Remove password_hash from response
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Parámetros inválidos',
        errors: error.errors.map(e => e.message),
      });
    }
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const result = await query(
      'SELECT * FROM user_management_view WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Create new user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const userData = createUserSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [userData.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, nombre, rol, telefono, activo, password_temp, fecha_password_temp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, email, nombre, rol, telefono, activo, fecha_creacion`,
      [
        userData.email.toLowerCase(),
        passwordHash,
        userData.nombre,
        userData.rol,
        userData.telefono,
        true,
        true,
        new Date()
      ]
    );

    const newUser = result.rows[0];

    // Log activity
    await logActivity(
      newUser.user_id,
      'user_created',
      { 
        created_user: {
          email: newUser.email,
          nombre: newUser.nombre,
          rol: newUser.rol
        }
      },
      req.user?.user_id,
      req
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: newUser,
      temporary_password: tempPassword
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors.map(e => e.message),
      });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const updateData = updateUserSchema.parse(req.body);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT * FROM users WHERE user_id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const currentUser = existingUser.rows[0];

    // Security validations
    if (req.user?.user_id === userId && updateData.activo === false) {
      return res.status(400).json({ 
        message: 'No puedes desactivar tu propia cuenta' 
      });
    }

    // Prevent deactivating the last administrator
    if (currentUser.rol === 'administrador' && updateData.activo === false) {
      const adminCount = await query(
        'SELECT COUNT(*) as count FROM users WHERE rol = $1 AND activo = true AND user_id != $2',
        ['administrador', userId]
      );

      if (parseInt(adminCount.rows[0].count) === 0) {
        return res.status(400).json({ 
          message: 'No se puede desactivar el último administrador del sistema' 
        });
      }
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== currentUser.email) {
      const emailExists = await query(
        'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
        [updateData.email.toLowerCase(), userId]
      );

      if (emailExists.rows.length > 0) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
    }

    // Build update query
    const updateFields = [];
    const queryParams = [];
    let paramCounter = 1;

    if (updateData.nombre) {
      updateFields.push(`nombre = $${paramCounter}`);
      queryParams.push(updateData.nombre);
      paramCounter++;
    }

    if (updateData.email) {
      updateFields.push(`email = $${paramCounter}`);
      queryParams.push(updateData.email.toLowerCase());
      paramCounter++;
    }

    if (updateData.rol) {
      updateFields.push(`rol = $${paramCounter}`);
      queryParams.push(updateData.rol);
      paramCounter++;
    }

    if (updateData.telefono !== undefined) {
      updateFields.push(`telefono = $${paramCounter}`);
      queryParams.push(updateData.telefono);
      paramCounter++;
    }

    if (updateData.activo !== undefined) {
      updateFields.push(`activo = $${paramCounter}`);
      queryParams.push(updateData.activo);
      paramCounter++;
    }

    updateFields.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
    queryParams.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCounter}
      RETURNING user_id, email, nombre, rol, telefono, activo, fecha_actualizacion
    `;

    const result = await query(updateQuery, queryParams);
    const updatedUser = result.rows[0];

    // Log activity
    await logActivity(
      userId,
      'user_updated',
      { 
        changes: updateData,
        previous: {
          email: currentUser.email,
          nombre: currentUser.nombre,
          rol: currentUser.rol,
          telefono: currentUser.telefono,
          activo: currentUser.activo
        }
      },
      req.user?.user_id,
      req
    );

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: error.errors.map(e => e.message),
      });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Reset user password
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT email, nombre FROM users WHERE user_id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Update user password
    await query(
      `UPDATE users 
       SET password_hash = $1, password_temp = true, fecha_password_temp = CURRENT_TIMESTAMP, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [passwordHash, userId]
    );

    // Log activity
    await logActivity(
      userId,
      'password_reset',
      { 
        reset_by: req.user?.nombre,
        user_email: existingUser.rows[0].email
      },
      req.user?.user_id,
      req
    );

    res.json({
      message: 'Contraseña restablecida exitosamente',
      temporary_password: tempPassword
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Get user activity log
export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const activityQuery = `
      SELECT 
        ual.*,
        u.nombre as performed_by_name
      FROM user_activity_log ual
      LEFT JOIN users u ON ual.realizado_por = u.user_id
      WHERE ual.user_id = $1
      ORDER BY ual.fecha DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM user_activity_log 
      WHERE user_id = $1
    `;

    const [activityResult, countResult] = await Promise.all([
      query(activityQuery, [userId, limit, offset]),
      query(countQuery, [userId])
    ]);

    const activities = activityResult.rows;
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};