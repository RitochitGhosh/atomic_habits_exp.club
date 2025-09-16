"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const trackerController_1 = require("../controllers/trackerController");
const router = (0, express_1.Router)();
router.get('/today', auth_1.authenticateToken, auth_1.requireOnboarding, trackerController_1.getTodayHabits);
router.get('/stats', auth_1.authenticateToken, auth_1.requireOnboarding, trackerController_1.getHabitStats);
router.get('/heatmap', auth_1.authenticateToken, auth_1.requireOnboarding, trackerController_1.getHeatmapData);
router.get('/karma', auth_1.authenticateToken, auth_1.requireOnboarding, trackerController_1.getKarmaPoints);
exports.default = router;
//# sourceMappingURL=tracker.js.map