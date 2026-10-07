import { Request, Response } from 'express';
import { DiscountService } from '../services/discount.service';
import {
  CreateDiscountRuleDto,
  UpdateDiscountRuleDto,
  DiscountFilterQuery,
  CalculateDiscountRequest,
} from '../types/discount.types';
import { AuditService } from '../services/audit.service';

export class DiscountController {
  /**
   * POST /api/discounts
   * Create new discount rule (Admin / Promotion Manager)
   */
  static async createDiscountRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleName, ruleType, targetIdentifier, discountPercentage, isActive, description } =
        req.body;

      if (!ruleName || !ruleType || !targetIdentifier || discountPercentage === undefined) {
        res.status(400).json({
          success: false,
          message:
            'Required fields: ruleName, ruleType, targetIdentifier, discountPercentage',
        });
        return;
      }

      const dto: CreateDiscountRuleDto = {
        ruleName,
        ruleType,
        targetIdentifier,
        discountPercentage: Number(discountPercentage),
        isActive,
        description,
      };

      const rule = await DiscountService.createDiscountRule(dto);

      const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
      AuditService.record({
        userId: (req as any).user?.id || 'admin',
        userName: (req as any).user?.name || 'Administrator',
        userRole: (req as any).user?.role || 'ADMIN',
        actionType: 'CREATE',
        moduleName: 'DISCOUNT',
        description: `Created discount rule "${rule.ruleName}" (${rule.discountPercentage}%) for ${rule.targetIdentifier}`,
        newValue: rule,
        ipAddress,
      });

      res.status(201).json({
        success: true,
        message: `Discount rule "${rule.ruleName}" created successfully!`,
        rule,
        data: rule,
      });
    } catch (err: any) {
      console.error('Error in createDiscountRule:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create discount rule',
      });
    }
  }

  /**
   * GET /api/discounts
   * Retrieve all discount rules
   */
  static async getAllDiscountRules(req: Request, res: Response): Promise<void> {
    try {
      const { ruleType, isActive, search } = req.query;
      const query: DiscountFilterQuery = {
        ruleType: ruleType ? String(ruleType) : undefined,
        isActive: isActive !== undefined ? String(isActive) : undefined,
        search: search ? String(search) : undefined,
      };

      const rules = await DiscountService.getAllDiscountRules(query);

      res.status(200).json({
        success: true,
        count: rules.length,
        rules,
        data: rules,
      });
    } catch (err: any) {
      console.error('Error in getAllDiscountRules:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve discount rules',
      });
    }
  }

  /**
   * GET /api/discounts/:id
   * Retrieve discount rule by ID
   */
  static async getDiscountRuleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rule = await DiscountService.getDiscountRuleById(id);

      if (!rule) {
        res.status(404).json({
          success: false,
          message: `Discount rule "${id}" not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        rule,
        data: rule,
      });
    } catch (err: any) {
      console.error('Error in getDiscountRuleById:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve discount rule',
      });
    }
  }

  /**
   * PUT /api/discounts/:id
   * Update existing discount rule
   */
  static async updateDiscountRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateDiscountRuleDto = req.body;

      const updated = await DiscountService.updateDiscountRule(id, dto);

      const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
      AuditService.record({
        userId: (req as any).user?.id || 'admin',
        userName: (req as any).user?.name || 'Administrator',
        userRole: (req as any).user?.role || 'ADMIN',
        actionType: 'UPDATE',
        moduleName: 'DISCOUNT',
        description: `Updated discount rule "${updated.ruleName}" (${id})`,
        newValue: dto,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        message: `Discount rule "${updated.ruleName}" updated successfully!`,
        rule: updated,
        data: updated,
      });
    } catch (err: any) {
      console.error('Error in updateDiscountRule:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update discount rule',
      });
    }
  }

  /**
   * DELETE /api/discounts/:id
   * Delete discount rule
   */
  static async deleteDiscountRule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await DiscountService.deleteDiscountRule(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: `Discount rule "${id}" not found for deletion`,
        });
        return;
      }

      const ipAddress = (req.ip || req.headers['x-forwarded-for'] || '127.0.0.1') as string;
      AuditService.record({
        userId: (req as any).user?.id || 'admin',
        userName: (req as any).user?.name || 'Administrator',
        userRole: (req as any).user?.role || 'ADMIN',
        actionType: 'DELETE',
        moduleName: 'DISCOUNT',
        description: `Deleted discount rule #${id}`,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Discount rule successfully deleted.',
      });
    } catch (err: any) {
      console.error('Error in deleteDiscountRule:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to delete discount rule',
      });
    }
  }

  /**
   * POST /api/discounts/calculate
   * Public evaluation endpoint: Calculate effective discount for quote / booking
   */
  static async calculateDiscount(req: Request, res: Response): Promise<void> {
    try {
      const calcReq: CalculateDiscountRequest = req.body;
      if (!calcReq.dailyPrice) {
        res.status(400).json({
          success: false,
          message: 'dailyPrice is required for discount calculation',
        });
        return;
      }

      const calculation = await DiscountService.calculateComprehensiveDiscount(calcReq);

      res.status(200).json({
        success: true,
        calculation,
        data: calculation,
      });
    } catch (err: any) {
      console.error('Error in calculateDiscount:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to calculate discount',
      });
    }
  }
}
