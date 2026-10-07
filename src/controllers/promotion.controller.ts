import { Request, Response } from 'express';
import { PromotionService } from '../services/promotion.service';
import { CreatePromotionDto, UpdatePromotionDto, PromotionFilterQuery, EvaluatePromotionDto } from '../types/promotion.types';
import { AuditService } from '../services/audit.service';

export class PromotionController {
  /**
   * POST /api/promotions
   * Create a new promotion (Admin only)
   */
  static async createPromotion(req: Request, res: Response): Promise<void> {
    try {
      const {
        promotionId,
        promotionName,
        promotionType,
        vehicleCategory,
        discountPercentage,
        startDate,
        endDate,
        minimumRentalDays,
        status,
        promotionImage,
        bannerImage,
        description,
      } = req.body;

      if (!promotionName || !promotionType || !vehicleCategory || discountPercentage === undefined || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Required fields: promotionName, promotionType, vehicleCategory, discountPercentage, startDate, endDate',
        });
        return;
      }

      const dto: CreatePromotionDto = {
        promotionId,
        promotionName,
        promotionType,
        vehicleCategory,
        discountPercentage: Number(discountPercentage),
        startDate,
        endDate,
        minimumRentalDays: minimumRentalDays !== undefined ? Number(minimumRentalDays) : 1,
        status,
        promotionImage,
        bannerImage,
        description,
      };

      const promotion = await PromotionService.createPromotion(dto);

      const ipAddress = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
      AuditService.record({
        userId: (req as any).user?.id || 'admin',
        userName: (req as any).user?.name || 'Administrator',
        userRole: (req as any).user?.role || 'ADMIN',
        actionType: 'CREATE',
        moduleName: 'PROMOTION',
        description: `Created promotion offer "${promotion.promotionName}" (${promotion.discountPercentage}%)`,
        newValue: { promotionId: promotion.promotionId, discountPercentage: promotion.discountPercentage },
        ipAddress,
      });

      res.status(201).json({
        success: true,
        message: `Promotion "${promotion.promotionName}" created successfully!`,
        promotion,
        data: promotion,
      });
    } catch (err: any) {
      console.error('Error in createPromotion:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to create promotion',
      });
    }
  }

  /**
   * GET /api/promotions
   * Retrieve all promotions with optional filtering
   */
  static async getAllPromotions(req: Request, res: Response): Promise<void> {
    try {
      const { status, promotionType, vehicleCategory, search } = req.query;
      const query: PromotionFilterQuery = {
        status: status ? String(status) : undefined,
        promotionType: promotionType ? String(promotionType) : undefined,
        vehicleCategory: vehicleCategory ? String(vehicleCategory) : undefined,
        search: search ? String(search) : undefined,
      };

      const promotions = await PromotionService.getAllPromotions(query);

      res.status(200).json({
        success: true,
        count: promotions.length,
        promotions,
        data: promotions,
      });
    } catch (err: any) {
      console.error('Error in getAllPromotions:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve promotions',
      });
    }
  }

  /**
   * GET /api/promotions/analytics
   * Retrieve promotion usage, discount impact, and revenue effect
   */
  static async getPromotionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const analytics = await PromotionService.getPromotionAnalytics();
      res.status(200).json({
        success: true,
        analytics,
        data: analytics,
      });
    } catch (err: any) {
      console.error('Error in getPromotionAnalytics:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve promotion analytics',
      });
    }
  }

  /**
   * POST /api/promotions/evaluate
   * Evaluate active promotions for a vehicle and rental period (highest valid discount)
   */
  static async evaluatePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { vehicleId, pickupDate, returnDate, rentalDays } = req.body;

      if (!vehicleId || !pickupDate || !returnDate) {
        res.status(400).json({
          success: false,
          message: 'vehicleId, pickupDate, and returnDate are required for promotion evaluation',
        });
        return;
      }

      const dto: EvaluatePromotionDto = {
        vehicleId,
        pickupDate,
        returnDate,
        rentalDays: rentalDays ? Number(rentalDays) : undefined,
      };

      const result = await PromotionService.evaluatePromotionForBooking(dto);

      res.status(200).json({
        success: true,
        evaluation: result,
        data: result,
      });
    } catch (err: any) {
      console.error('Error in evaluatePromotion:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to evaluate promotion',
      });
    }
  }

  /**
   * GET /api/promotions/:id
   * Retrieve single promotion by ID or promotion code
   */
  static async getPromotionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const promotion = await PromotionService.getPromotionById(id);

      if (!promotion) {
        res.status(404).json({
          success: false,
          message: `Promotion "${id}" not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        promotion,
        data: promotion,
      });
    } catch (err: any) {
      console.error('Error in getPromotionById:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to retrieve promotion',
      });
    }
  }

  /**
   * PUT /api/promotions/:id
   * Update promotion details (Admin only)
   */
  static async updatePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdatePromotionDto = req.body;

      const updated = await PromotionService.updatePromotion(id, dto);

      const ipAddress = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
      AuditService.record({
        userId: (req as any).user?.id || 'admin',
        userName: (req as any).user?.name || 'Administrator',
        userRole: (req as any).user?.role || 'ADMIN',
        actionType: 'UPDATE',
        moduleName: 'PROMOTION',
        description: `Updated promotion offer "${updated.promotionName}" (${id})`,
        newValue: dto,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        message: `Promotion "${updated.promotionName}" updated successfully!`,
        promotion: updated,
        data: updated,
      });
    } catch (err: any) {
      console.error('Error in updatePromotion:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update promotion',
      });
    }
  }

  /**
   * DELETE /api/promotions/:id
   * Delete promotion record (Admin only)
   */
  static async deletePromotion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await PromotionService.deletePromotion(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: `Promotion "${id}" not found for deletion`,
        });
        return;
      }

      const ipAddress = (req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
      AuditService.record({
        userId: (req as any).user?.id || 'admin',
        userName: (req as any).user?.name || 'Administrator',
        userRole: (req as any).user?.role || 'ADMIN',
        actionType: 'DELETE',
        moduleName: 'PROMOTION',
        description: `Deleted promotion offer record #${id}`,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Promotion successfully deleted.',
      });
    } catch (err: any) {
      console.error('Error in deletePromotion:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to delete promotion',
      });
    }
  }
}
