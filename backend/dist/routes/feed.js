"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const feedController_1 = require("../controllers/feedController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, auth_1.requireOnboarding, feedController_1.getFeed);
router.get('/:id', auth_1.authenticateToken, auth_1.requireOnboarding, feedController_1.getAtomById);
router.post('/:id/vote', auth_1.authenticateToken, auth_1.requireOnboarding, feedController_1.voteOnAtom);
router.delete('/:id/vote', auth_1.authenticateToken, auth_1.requireOnboarding, feedController_1.removeVote);
router.get('/trending', auth_1.authenticateToken, auth_1.requireOnboarding, feedController_1.getTrendingAtoms);
exports.default = router;
//# sourceMappingURL=feed.js.map