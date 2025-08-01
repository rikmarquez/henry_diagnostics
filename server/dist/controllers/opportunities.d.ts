import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createOpportunity: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchOpportunities: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOpportunityById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateOpportunity: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addOpportunityNote: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOpportunitiesByVin: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRemindersToday: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=opportunities.d.ts.map