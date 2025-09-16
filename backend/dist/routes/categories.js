"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const categoryController_1 = require("../controllers/categoryController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, categoryController_1.getAllCategories);
router.post('/', auth_1.authenticateToken, categoryController_1.createCategory);
router.put('/:id', auth_1.authenticateToken, categoryController_1.updateCategory);
router.delete('/:id', auth_1.authenticateToken, categoryController_1.deleteCategory);
router.get('/:id', auth_1.authenticateToken, categoryController_1.getCategoryById);
exports.default = router;
//# sourceMappingURL=categories.js.map