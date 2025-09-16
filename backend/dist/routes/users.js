"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get('/', userController_1.getAllUsers);
router.get('/:id', userController_1.getUserProfile);
router.put('/profile', auth_1.authenticateToken, userController_1.updateProfile);
router.get('/search/:query', auth_1.authenticateToken, userController_1.searchUsers);
router.post('/:id/follow', auth_1.authenticateToken, userController_1.followUser);
router.delete('/:id/unfollow', auth_1.authenticateToken, userController_1.unfollowUser);
router.get('/:id/followers', userController_1.getFollowers);
router.get('/:id/following', userController_1.getFollowing);
router.post('/complete-onboarding', auth_1.authenticateToken, userController_1.completeOnboarding);
exports.default = router;
//# sourceMappingURL=users.js.map