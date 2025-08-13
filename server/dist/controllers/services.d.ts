import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * CONTROLADOR DE SERVICIOS
 * Maneja todas las operaciones relacionadas con servicios de mantenimiento
 */
export declare const getServiceStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getServiceCountThisMonth: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getServices: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getServiceById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRecentServices: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateServiceStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateService: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getServicesByCustomer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=services.d.ts.map