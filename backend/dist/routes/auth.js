"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/refresh', authController_1.refreshToken);
router.get('/me', auth_1.authenticateToken, authController_1.getCurrentUser);
router.post('/logout', authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map