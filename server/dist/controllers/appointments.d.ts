import { Request, Response } from 'express';
export declare const getTodayAppointments: (req: Request, res: Response) => Promise<void>;
export declare const getAppointmentsByDateRange: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const convertAppointmentToService: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=appointments.d.ts.map