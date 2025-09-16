"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const habitController_1 = require("../controllers/habitController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, auth_1.requireOnboarding, habitController_1.getAllHabits);
router.post('/', auth_1.authenticateToken, auth_1.requireOnboarding, habitController_1.createHabit);
router.get('/:id', auth_1.authenticateToken, auth_1.requireOnboarding, habitController_1.getHabitById);
router.put('/:id', auth_1.authenticateToken, auth_1.requireOnboarding, habitController_1.updateHabit);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireOnboarding, habitController_1.deleteHabit);
router.post('/:id/complete', auth_1.authenticateToken, auth_1.requireOnboarding, habitController_1.completeHabit);
exports.default = router;
//# sourceMappingURL=habits.js.map