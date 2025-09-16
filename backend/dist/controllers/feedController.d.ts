import { Request, Response } from 'express';
export declare const getFeed: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAtomById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const voteOnAtom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeVote: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTrendingAtoms: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=feedController.d.ts.map