"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, auth_1.requireOnboarding, notificationController_1.getNotifications);
router.put('/:id/read', auth_1.authenticateToken, auth_1.requireOnboarding, notificationController_1.markNotificationAsRead);
router.put('/mark-read', auth_1.authenticateToken, auth_1.requireOnboarding, notificationController_1.markMultipleAsRead);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireOnboarding, notificationController_1.deleteNotification);
router.get('/settings', auth_1.authenticateToken, auth_1.requireOnboarding, notificationController_1.getNotificationSettings);
router.put('/settings', auth_1.authenticateToken, auth_1.requireOnboarding, notificationController_1.updateNotificationSettings);
router.post('/', auth_1.authenticateToken, auth_1.requireOnboarding, notificationController_1.createNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map