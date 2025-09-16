import { Request, Response } from 'express';
export declare const generateMotivationalQuote: (habitTitle: string, categoryName: string) => Promise<string>;
export declare const getAllHabits: (req: Request, res: Response) => Promise<void>;
export declare const createHabit: (req: Request, res: Response) => Promise<void>;
export declare const getHabitById: (req: Request, res: Response) => Promise<void>;
export declare const updateHabit: (req: Request, res: Response) => Promise<void>;
export declare const deleteHabit: (req: Request, res: Response) => Promise<void>;
export declare const completeHabit: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=habitController.d.ts.map