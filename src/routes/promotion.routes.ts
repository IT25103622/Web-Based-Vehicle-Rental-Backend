import { Router } from 'express';
import { PromotionController } from '../controllers/promotion.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

// Public & Customer Routes: List active promotions & live discount evaluation
router.get('/', PromotionController.getAllPromotions);
router.post('/evaluate', PromotionController.evaluatePromotion);

// Promotional Analytics (Admin, Finance Officer)
// Promotional Analytics (Admin, Super Admin, Promotion Manager, Finance Officer)
router.get(
  '/analytics',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER, UserRole.FINANCE_OFFICER),
  PromotionController.getPromotionAnalytics
);

// Single promotion details
router.get('/:id', PromotionController.getPromotionById);

import { validateBody } from '../middleware/validation.middleware';
import { createPromotionSchema } from '../validation/validation.schemas';

// CRUD management (Admin, Super Admin, Promotion Manager)
router.post(
  '/',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER),
  validateBody(createPromotionSchema),
  PromotionController.createPromotion
);

router.put(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER),
  PromotionController.updatePromotion
);

router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER),
  PromotionController.updatePromotion
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROMOTION_MANAGER),
  PromotionController.deletePromotion
);

export default router;
