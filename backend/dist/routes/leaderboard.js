"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const leaderboardController_1 = require("../controllers/leaderboardController");
const router = (0, express_1.Router)();
router.get('/daily', auth_1.authenticateToken, auth_1.requireOnboarding, leaderboardController_1.getDailyLeaderboard);
router.get('/total', auth_1.authenticateToken, auth_1.requireOnboarding, leaderboardController_1.getTotalLeaderboard);
router.get('/user/:id/history', auth_1.authenticateToken, auth_1.requireOnboarding, leaderboardController_1.getUserRankingHistory);
router.get('/category/:categoryId', auth_1.authenticateToken, auth_1.requireOnboarding, leaderboardController_1.getCategoryLeaderboard);
exports.default = router;
//# sourceMappingURL=leaderboard.js.map