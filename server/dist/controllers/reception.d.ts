import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * RECEPCIÓN DE CLIENTES WALK-IN
 * Maneja clientes que llegan al taller sin cita previa
 */
export declare const processWalkInClient: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * CONVERTIR OPPORTUNITY EN CITA
 * Para cuando el seguimiento contacta un cliente y acepta agendar
 */
export declare const convertOpportunityToCita: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * RECEPCIONAR CITA (cuando cliente llega)
 * Convierte una cita en un servicio real
 */
export declare const receptionarCita: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * LISTAR CITAS DEL DÍA PARA RECEPCIÓN
 */
export declare const getCitasParaRecepcion: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=reception.d.ts.map