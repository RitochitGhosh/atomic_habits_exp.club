import { Request, Response } from 'express';
export declare const getNotifications: (req: Request, res: Response) => Promise<void>;
export declare const markNotificationAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markMultipleAsRead: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteNotification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNotificationSettings: (req: Request, res: Response) => Promise<void>;
export declare const updateNotificationSettings: (req: Request, res: Response) => Promise<void>;
export declare const createNotification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=notificationController.d.ts.map