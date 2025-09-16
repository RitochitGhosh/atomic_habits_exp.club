"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getCurrentUser = exports.refreshToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const register = async (req, res) => {
    try {
        const { email, username, password } = registerSchema.parse(req.body);
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            res.status(400).json({
                error: 'User already exists',
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                username,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                username: true,
                hasCompletedOnboarding: true,
                createdAt: true,
            }
        });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'User created successfully',
            user,
            accessToken,
            refreshToken
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
            return;
        }
        throw error;
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                passwordHash: true,
                hasCompletedOnboarding: true,
                createdAt: true,
            }
        });
        if (!user) {
            res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
            return;
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        const { passwordHash, ...userWithoutPassword } = user;
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
        res.json({
            message: 'Login successful',
            user: userWithoutPassword,
            accessToken,
            refreshToken
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
            return;
        }
        throw error;
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(401).json({
                error: 'Refresh token required'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                hasCompletedOnboarding: true,
            }
        });
        if (!user) {
            res.status(401).json({
                error: 'Invalid refresh token'
            });
            return;
        }
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({
            accessToken,
            user
        });
    }
    catch (error) {
        res.status(401).json({
            error: 'Invalid refresh token'
        });
        return;
    }
};
exports.refreshToken = refreshToken;
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                profileImage: true,
                bio: true,
                totalKarma: true,
                hasCompletedOnboarding: true,
                createdAt: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        habits: true,
                        atoms: true
                    }
                }
            }
        });
        if (!user) {
            res.status(404).json({
                error: 'User not found'
            });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        throw error;
    }
};
exports.getCurrentUser = getCurrentUser;
const logout = (req, res) => {
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map