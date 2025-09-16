import { Request, Response } from 'express';
export declare const getUserProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const searchUsers: (req: Request, res: Response) => Promise<void>;
export declare const followUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const unfollowUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getFollowers: (req: Request, res: Response) => Promise<void>;
export declare const getFollowing: (req: Request, res: Response) => Promise<void>;
export declare const completeOnboarding: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map