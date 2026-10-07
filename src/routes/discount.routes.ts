import { Router } from 'express';
import { DiscountController } from '../controllers/discount.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

// Public routes: List discount rules and calculate quote discount
router.get('/', DiscountController.getAllDiscountRules);
router.post('/calculate', DiscountController.calculateDiscount);
router.get('/:id', DiscountController.getDiscountRuleById);

import { validateBody } from '../middleware/validation.middleware';
import { createDiscountRuleSchema } from '../validation/validation.schemas';

// Protected routes (Admin, Super Admin, Promotion Manager)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER),
  validateBody(createDiscountRuleSchema),
  DiscountController.createDiscountRule
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER),
  DiscountController.updateDiscountRule
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER),
  DiscountController.deleteDiscountRule
);

export default router;
