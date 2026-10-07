import mongoose from 'mongoose';
import { Promotion, IPromotionDoc } from '../models/Promotion.model';
import { VehicleService } from './vehicle.service';
import {
  IPromotion,
  CreatePromotionDto,
  UpdatePromotionDto,
  PromotionFilterQuery,
  EvaluatePromotionDto,
  PromotionEvaluationResult,
  PromotionAnalyticsSummary,
  PromotionType,
} from '../types/promotion.types';

// Pre-seeded fallback promotions
let inMemoryPromotions: IPromotion[] = [
  {
    id: 'promo_bmw_20',
    _id: 'promo_bmw_20',
    promotionId: 'PROMO-BMW-20',
    promotionName: 'BMW Executive Privilege',
    promotionType: 'CATEGORY_DISCOUNT',
    vehicleCategory: 'BMW',
    discountPercentage: 20,
    startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 180).toISOString(),
    minimumRentalDays: 1,
    status: 'ACTIVE',
    promotionImage: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    description: 'Experience sheer driving pleasure with an exclusive 20% privilege savings across the entire BMW fleet.',
    usageCount: 14,
    totalDiscountGranted: 340000,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'promo_benz_30',
    _id: 'promo_benz_30',
    promotionId: 'PROMO-BENZ-30',
    promotionName: 'Mercedes-Benz AMG Rush',
    promotionType: 'CATEGORY_DISCOUNT',
    vehicleCategory: 'Mercedes-Benz',
    discountPercentage: 30,
    startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 180).toISOString(),
    minimumRentalDays: 1,
    status: 'ACTIVE',
    promotionImage: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1600&q=80',
    description: 'Command the pinnacle of German craftsmanship with 30% VIP savings on all Mercedes-Benz models.',
    usageCount: 18,
    totalDiscountGranted: 520000,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'promo_toyota_15',
    _id: 'promo_toyota_15',
    promotionId: 'PROMO-TOYOTA-15',
    promotionName: 'Toyota Royal Escort',
    promotionType: 'CATEGORY_DISCOUNT',
    vehicleCategory: 'Toyota',
    discountPercentage: 15,
    startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 180).toISOString(),
    minimumRentalDays: 1,
    status: 'ACTIVE',
    promotionImage: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80',
    description: 'Unrivaled dependability meets expedition comfort. 15% promotional concession on Land Cruiser Prado.',
    usageCount: 8,
    totalDiscountGranted: 144000,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'promo_avurudu_25',
    _id: 'promo_avurudu_25',
    promotionId: 'PROMO-AVURUDU-25',
    promotionName: 'Avurudu Festive Luxury Gala',
    promotionType: 'FESTIVAL_OFFER',
    vehicleCategory: 'All',
    discountPercentage: 25,
    startDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    minimumRentalDays: 1,
    status: 'ACTIVE',
    promotionImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80',
    description: 'Celebrate the Sri Lankan New Year season in royal style with a 25% fleet-wide festival discount on all luxury categories.',
    usageCount: 22,
    totalDiscountGranted: 680000,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'promo_weekend_35',
    _id: 'promo_weekend_35',
    promotionId: 'PROMO-WEEKEND-35',
    promotionName: 'Weekend Supercar Escape',
    promotionType: 'WEEKEND_OFFER',
    vehicleCategory: 'Supercar / Exotic',
    discountPercentage: 35,
    startDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 90).toISOString(),
    minimumRentalDays: 2,
    status: 'ACTIVE',
    promotionImage: 'https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1600&q=80',
    description: 'Indulge in visceral power with 35% savings on exotic supercars for 2+ day weekend escapes.',
    usageCount: 6,
    totalDiscountGranted: 315000,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'promo_longterm_40',
    _id: 'promo_longterm_40',
    promotionId: 'PROMO-LONGTERM-40',
    promotionName: 'Diplomatic Long-Term Privilege',
    promotionType: 'LONG_TERM_RENTAL',
    vehicleCategory: 'Luxury Sedan',
    discountPercentage: 40,
    startDate: new Date(Date.now() - 86400000 * 20).toISOString(),
    endDate: new Date(Date.now() + 86400000 * 120).toISOString(),
    minimumRentalDays: 7,
    status: 'ACTIVE',
    promotionImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80',
    description: 'Comprehensive executive chauffeur and fleet access with 40% long-term rental privilege for 7+ day corporate tours.',
    usageCount: 4,
    totalDiscountGranted: 240000,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

export class PromotionService {
  private static isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Generates a unique promotion ID code if not provided
   */
  private static generatePromoCode(name: string, discount: number): string {
    const slug = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    return `PROMO-${slug || 'OFFER'}-${discount}`;
  }

  /**
   * Create a new promotion record
   */
  static async createPromotion(dto: CreatePromotionDto): Promise<IPromotion> {
    const promotionId = (
      dto.promotionId || this.generatePromoCode(dto.promotionName, dto.discountPercentage)
    )
      .trim()
      .toUpperCase();

    // Check duplicate promotionId
    const existing = await this.getPromotionByPromoId(promotionId);
    if (existing) {
      const err: any = new Error(`Promotion code "${promotionId}" already exists. Please choose a unique code.`);
      err.statusCode = 409;
      throw err;
    }

    const discount = Number(dto.discountPercentage);
    if (isNaN(discount) || discount < 1 || discount > 99) {
      const err: any = new Error('Discount percentage must be between 1% and 99%.');
      err.statusCode = 400;
      throw err;
    }

    if (dto.minimumRentalDays !== undefined && (isNaN(Number(dto.minimumRentalDays)) || Number(dto.minimumRentalDays) < 1)) {
      const err: any = new Error('Minimum rental days must be a positive integer (at least 1 day).');
      err.statusCode = 400;
      throw err;
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      const err: any = new Error('Promotion End Date must be after Start Date.');
      err.statusCode = 400;
      throw err;
    }

    if (this.isConnected()) {
      const promo = new Promotion({
        promotionId,
        promotionName: dto.promotionName.trim(),
        promotionType: dto.promotionType,
        vehicleCategory: dto.vehicleCategory.trim(),
        discountPercentage: Number(dto.discountPercentage),
        startDate,
        endDate,
        minimumRentalDays: dto.minimumRentalDays ? Number(dto.minimumRentalDays) : 1,
        status: dto.status || 'ACTIVE',
        promotionImage: dto.promotionImage || '',
        bannerImage: dto.bannerImage || '',
        description: dto.description || '',
        usageCount: 0,
        totalDiscountGranted: 0,
      });

      const saved = await promo.save();
      return saved.toJSON() as unknown as IPromotion;
    } else {
      const newPromo: IPromotion = {
        id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        _id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        promotionId,
        promotionName: dto.promotionName.trim(),
        promotionType: dto.promotionType,
        vehicleCategory: dto.vehicleCategory.trim(),
        discountPercentage: Number(dto.discountPercentage),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        minimumRentalDays: dto.minimumRentalDays ? Number(dto.minimumRentalDays) : 1,
        status: dto.status || 'ACTIVE',
        promotionImage: dto.promotionImage || '',
        bannerImage: dto.bannerImage || '',
        description: dto.description || '',
        usageCount: 0,
        totalDiscountGranted: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryPromotions.unshift(newPromo);
      return newPromo;
    }
  }

  /**
   * Retrieve all promotions with optional filtering
   */
  static async getAllPromotions(query: PromotionFilterQuery = {}): Promise<IPromotion[]> {
    const { status, promotionType, vehicleCategory, search } = query;

    if (this.isConnected()) {
      const filter: any = {};
      if (status && status !== 'ALL') {
        filter.status = status;
      }
      if (promotionType && promotionType !== 'ALL') {
        filter.promotionType = promotionType;
      }
      if (vehicleCategory && vehicleCategory !== 'ALL' && vehicleCategory !== 'All') {
        filter.vehicleCategory = { $regex: new RegExp(`^${vehicleCategory}$`, 'i') };
      }
      if (search) {
        filter.$or = [
          { promotionId: { $regex: search, $options: 'i' } },
          { promotionName: { $regex: search, $options: 'i' } },
          { vehicleCategory: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const docs = await Promotion.find(filter).sort({ discountPercentage: -1, createdAt: -1 });
      return docs.map((d) => d.toJSON() as unknown as IPromotion);
    } else {
      let list = [...inMemoryPromotions];

      if (status && status !== 'ALL') {
        list = list.filter((p) => p.status === status);
      }
      if (promotionType && promotionType !== 'ALL') {
        list = list.filter((p) => p.promotionType === promotionType);
      }
      if (vehicleCategory && vehicleCategory !== 'ALL' && vehicleCategory !== 'All') {
        list = list.filter(
          (p) => p.vehicleCategory.toLowerCase() === vehicleCategory.toLowerCase()
        );
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (p) =>
            p.promotionId.toLowerCase().includes(q) ||
            p.promotionName.toLowerCase().includes(q) ||
            p.vehicleCategory.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        );
      }

      return list.sort((a, b) => b.discountPercentage - a.discountPercentage);
    }
  }

  /**
   * Retrieve single promotion by ID or promotionId code
   */
  static async getPromotionById(id: string): Promise<IPromotion | null> {
    if (this.isConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const doc = await Promotion.findById(id);
        if (doc) return doc.toJSON() as unknown as IPromotion;
      }
      const byCode = await Promotion.findOne({
        $or: [{ promotionId: id.toUpperCase() }, { id }],
      });
      return byCode ? (byCode.toJSON() as unknown as IPromotion) : null;
    } else {
      const match = inMemoryPromotions.find(
        (p) => p.id === id || p._id === id || p.promotionId === id.toUpperCase()
      );
      return match || null;
    }
  }

  /**
   * Lookup promotion strictly by unique promotionId
   */
  static async getPromotionByPromoId(promotionId: string): Promise<IPromotion | null> {
    const clean = promotionId.trim().toUpperCase();
    if (this.isConnected()) {
      const doc = await Promotion.findOne({ promotionId: clean });
      return doc ? (doc.toJSON() as unknown as IPromotion) : null;
    } else {
      const match = inMemoryPromotions.find((p) => p.promotionId.toUpperCase() === clean);
      return match || null;
    }
  }

  /**
   * Update an existing promotion
   */
  static async updatePromotion(id: string, dto: UpdatePromotionDto): Promise<IPromotion> {
    const existing = await this.getPromotionById(id);
    if (!existing) {
      const err: any = new Error('Promotion not found.');
      err.statusCode = 404;
      throw err;
    }

    if (dto.startDate && dto.endDate) {
      if (new Date(dto.endDate) <= new Date(dto.startDate)) {
        const err: any = new Error('Promotion End Date must be after Start Date.');
        err.statusCode = 400;
        throw err;
      }
    }

    if (this.isConnected()) {
      const updateData: any = { ...dto, updatedAt: new Date() };
      if (dto.startDate) updateData.startDate = new Date(dto.startDate);
      if (dto.endDate) updateData.endDate = new Date(dto.endDate);
      if (dto.discountPercentage !== undefined) updateData.discountPercentage = Number(dto.discountPercentage);
      if (dto.minimumRentalDays !== undefined) updateData.minimumRentalDays = Number(dto.minimumRentalDays);

      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { $or: [{ _id: id }, { promotionId: id.toUpperCase() }] };

      const updated = await Promotion.findOneAndUpdate(query, updateData, { new: true });
      if (!updated) {
        const err: any = new Error('Promotion not found for update.');
        err.statusCode = 404;
        throw err;
      }
      return updated.toJSON() as unknown as IPromotion;
    } else {
      const index = inMemoryPromotions.findIndex(
        (p) => p.id === id || p._id === id || p.promotionId === id.toUpperCase()
      );
      if (index === -1) {
        const err: any = new Error('Promotion not found in memory.');
        err.statusCode = 404;
        throw err;
      }

      const current = inMemoryPromotions[index];
      const updatedRecord: IPromotion = {
        ...current,
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate).toISOString() : current.startDate,
        endDate: dto.endDate ? new Date(dto.endDate).toISOString() : current.endDate,
        discountPercentage:
          dto.discountPercentage !== undefined ? Number(dto.discountPercentage) : current.discountPercentage,
        minimumRentalDays:
          dto.minimumRentalDays !== undefined ? Number(dto.minimumRentalDays) : current.minimumRentalDays,
        updatedAt: new Date().toISOString(),
      };

      inMemoryPromotions[index] = updatedRecord;
      return updatedRecord;
    }
  }

  /**
   * Delete a promotion
   */
  static async deletePromotion(id: string): Promise<boolean> {
    if (this.isConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { $or: [{ _id: id }, { promotionId: id.toUpperCase() }] };
      const res = await Promotion.findOneAndDelete(query);
      return !!res;
    } else {
      const prevLen = inMemoryPromotions.length;
      inMemoryPromotions = inMemoryPromotions.filter(
        (p) => p.id !== id && p._id !== id && p.promotionId !== id.toUpperCase()
      );
      return inMemoryPromotions.length < prevLen;
    }
  }

  /**
   * Evaluates active promotions for a vehicle and rental period.
   * HIGHEST VALID DISCOUNT RULE:
   * If multiple active promotions match, applies the highest valid discount.
   */
  static async evaluatePromotionForBooking(dto: EvaluatePromotionDto): Promise<PromotionEvaluationResult> {
    const { vehicleId, pickupDate, returnDate } = dto;

    const vehicle = await VehicleService.getVehicleById(vehicleId);
    if (!vehicle) {
      const err: any = new Error('Vehicle not found.');
      err.statusCode = 404;
      throw err;
    }

    const pTime = new Date(pickupDate).getTime();
    const rTime = new Date(returnDate).getTime();
    const calculatedDays = Math.max(1, Math.ceil((rTime - pTime) / (1000 * 60 * 60 * 24)));
    const rentalDays = dto.rentalDays && dto.rentalDays > 0 ? dto.rentalDays : calculatedDays;

    const allPromotions = await this.getAllPromotions({ status: 'ACTIVE' });

    // Filter promotions valid for this rental
    const validPromotions = allPromotions.filter((promo) => {
      // Check date boundaries
      const promoStart = new Date(promo.startDate).getTime();
      const promoEnd = new Date(promo.endDate).getTime();

      // Offer must cover or overlap pickupDate
      if (pTime < promoStart || pTime > promoEnd) {
        return false;
      }

      // Check minimum rental duration
      if (rentalDays < (promo.minimumRentalDays || 1)) {
        return false;
      }

      // Check vehicle category or brand target
      const target = promo.vehicleCategory.trim().toLowerCase();
      const vBrand = vehicle.brand.trim().toLowerCase();
      const vCategory = vehicle.category.trim().toLowerCase();

      if (target === 'all' || target === 'all categories') {
        return true;
      }

      if (target === vBrand || target === vCategory) {
        return true;
      }

      if (vBrand.includes(target) || target.includes(vBrand)) {
        return true;
      }

      if (vCategory.includes(target) || target.includes(vCategory)) {
        return true;
      }

      return false;
    });

    // Select the highest discount among all matching promotions
    let bestPromo: IPromotion | null = null;
    if (validPromotions.length > 0) {
      validPromotions.sort((a, b) => b.discountPercentage - a.discountPercentage);
      bestPromo = validPromotions[0];
    }

    // Determine effective discount percentage
    // If a promotion is applied, use it; otherwise fall back to vehicle base discount if any
    const promoDiscount = bestPromo ? bestPromo.discountPercentage : 0;
    const baseVehicleDiscount = vehicle.discountPercentage || 0;
    const effectiveDiscount = Math.max(promoDiscount, baseVehicleDiscount);

    const dailyPrice = vehicle.dailyPrice;
    const originalAmount = dailyPrice * rentalDays;
    const discountAmount = Math.round((originalAmount * effectiveDiscount) / 100);
    const finalAmount = Math.max(0, originalAmount - discountAmount);

    let savingsMessage = '';
    if (bestPromo) {
      savingsMessage = `✨ ${bestPromo.promotionName}: ${bestPromo.discountPercentage}% OFF applied! You save Rs. ${discountAmount.toLocaleString()}.`;
    } else if (effectiveDiscount > 0) {
      savingsMessage = `Standard VIP Concession: ${effectiveDiscount}% OFF applied.`;
    }

    return {
      appliedPromotion: bestPromo,
      discountPercentage: effectiveDiscount,
      dailyPrice,
      rentalDays,
      originalAmount,
      discountAmount,
      finalAmount,
      savingsMessage,
    };
  }

  /**
   * Telemetry: Record usage and discount granted when a reservation is confirmed
   */
  static async recordUsage(promotionId: string, discountAmount: number): Promise<void> {
    if (!promotionId) return;

    if (this.isConnected()) {
      const query = mongoose.Types.ObjectId.isValid(promotionId)
        ? { _id: promotionId }
        : { $or: [{ _id: promotionId }, { promotionId: promotionId.toUpperCase() }] };

      await Promotion.findOneAndUpdate(query, {
        $inc: { usageCount: 1, totalDiscountGranted: discountAmount },
      });
    } else {
      const p = inMemoryPromotions.find(
        (item) =>
          item.id === promotionId ||
          item._id === promotionId ||
          item.promotionId === promotionId.toUpperCase()
      );
      if (p) {
        p.usageCount = (p.usageCount || 0) + 1;
        p.totalDiscountGranted = (p.totalDiscountGranted || 0) + discountAmount;
      }
    }
  }

  /**
   * Analytics: Calculate promotion usage, discount impact, and revenue effect
   */
  static async getPromotionAnalytics(): Promise<PromotionAnalyticsSummary> {
    const allPromos = await this.getAllPromotions();

    const totalPromotions = allPromos.length;
    const activePromotions = allPromos.filter((p) => p.status === 'ACTIVE').length;
    let totalUsageCount = 0;
    let totalDiscountGranted = 0;

    const typeMap = new Map<PromotionType, { count: number; usage: number; savings: number }>();

    allPromos.forEach((p) => {
      totalUsageCount += p.usageCount || 0;
      totalDiscountGranted += p.totalDiscountGranted || 0;

      const t = p.promotionType;
      const existing = typeMap.get(t) || { count: 0, usage: 0, savings: 0 };
      existing.count += 1;
      existing.usage += p.usageCount || 0;
      existing.savings += p.totalDiscountGranted || 0;
      typeMap.set(t, existing);
    });

    const byType = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      count: stats.count,
      usageCount: stats.usage,
      totalSavings: stats.savings,
    }));

    const topPromotions = [...allPromos]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);

    return {
      totalPromotions,
      activePromotions,
      totalUsageCount,
      totalDiscountGranted,
      byType,
      topPromotions,
    };
  }
}
