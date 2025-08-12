import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getMechanics: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMechanicById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createMechanic: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMechanic: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMechanic: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getBranches: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMechanicsStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=mechanics.d.ts.map