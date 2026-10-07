import mongoose from 'mongoose';
import { DiscountRule } from '../models/Discount.model';
import {
  IDiscountRule,
  CreateDiscountRuleDto,
  UpdateDiscountRuleDto,
  DiscountFilterQuery,
  CalculateDiscountRequest,
  CalculateDiscountResponse,
} from '../types/discount.types';
import { getBrandDefaultDiscount } from '../utils/discountEngine';

// Pre-seeded in-memory fallback discount rules
let inMemoryDiscountRules: IDiscountRule[] = [
  {
    id: 'disc_bmw_20',
    _id: 'disc_bmw_20',
    ruleName: 'BMW Marque Standard Privilege',
    ruleType: 'BRAND_DEFAULT',
    targetIdentifier: 'BMW',
    discountPercentage: 20,
    isActive: true,
    description: 'Automatic 20% privilege concession on all BMW fleet models.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'disc_benz_30',
    _id: 'disc_benz_30',
    ruleName: 'Mercedes-Benz Prestige Privilege',
    ruleType: 'BRAND_DEFAULT',
    targetIdentifier: 'Mercedes-Benz',
    discountPercentage: 30,
    isActive: true,
    description: 'Automatic 30% VIP concession on all Mercedes-Benz models.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'disc_toyota_15',
    _id: 'disc_toyota_15',
    ruleName: 'Toyota Expedition Privilege',
    ruleType: 'BRAND_DEFAULT',
    targetIdentifier: 'Toyota',
    discountPercentage: 15,
    isActive: true,
    description: 'Automatic 15% promotional concession on Land Cruiser Prado and Fortuner.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'disc_silver_5',
    _id: 'disc_silver_5',
    ruleName: 'Silver Loyalty Tier Discount',
    ruleType: 'MEMBERSHIP_TIER',
    targetIdentifier: 'SILVER',
    discountPercentage: 5,
    isActive: true,
    description: '5% complimentary loyalty tier discount for Silver patrons.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'disc_gold_10',
    _id: 'disc_gold_10',
    ruleName: 'Gold Loyalty Tier Discount',
    ruleType: 'MEMBERSHIP_TIER',
    targetIdentifier: 'GOLD',
    discountPercentage: 10,
    isActive: true,
    description: '10% complimentary loyalty tier discount for Gold patrons.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'disc_plat_15',
    _id: 'disc_plat_15',
    ruleName: 'Platinum Loyalty Tier Discount',
    ruleType: 'MEMBERSHIP_TIER',
    targetIdentifier: 'PLATINUM',
    discountPercentage: 15,
    isActive: true,
    description: '15% complimentary loyalty tier discount for Platinum patrons.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'disc_longterm_10',
    _id: 'disc_longterm_10',
    ruleName: '7+ Days Duration Tier',
    ruleType: 'DURATION_TIER',
    targetIdentifier: 'LONG_TERM',
    discountPercentage: 10,
    isActive: true,
    description: '10% duration bonus on rentals spanning 7 days or more.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class DiscountService {
  private static isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Create a new discount rule
   */
  static async createDiscountRule(dto: CreateDiscountRuleDto): Promise<IDiscountRule> {
    const percentage = Number(dto.discountPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      const err: any = new Error('Discount percentage must be between 0% and 100%.');
      err.statusCode = 400;
      throw err;
    }

    if (this.isConnected()) {
      const existing = await DiscountRule.findOne({
        ruleType: dto.ruleType,
        targetIdentifier: dto.targetIdentifier.trim(),
      });
      if (existing) {
        const err: any = new Error(
          `Discount rule for type "${dto.ruleType}" and target "${dto.targetIdentifier}" already exists.`
        );
        err.statusCode = 409;
        throw err;
      }

      const rule = new DiscountRule({
        ruleName: dto.ruleName.trim(),
        ruleType: dto.ruleType,
        targetIdentifier: dto.targetIdentifier.trim(),
        discountPercentage: percentage,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        description: dto.description || '',
      });

      const saved = await rule.save();
      return saved.toJSON() as unknown as IDiscountRule;
    } else {
      const duplicate = inMemoryDiscountRules.find(
        (r) =>
          r.ruleType === dto.ruleType &&
          r.targetIdentifier.toLowerCase() === dto.targetIdentifier.trim().toLowerCase()
      );
      if (duplicate) {
        const err: any = new Error(
          `Discount rule for type "${dto.ruleType}" and target "${dto.targetIdentifier}" already exists.`
        );
        err.statusCode = 409;
        throw err;
      }

      const newRule: IDiscountRule = {
        id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        _id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        ruleName: dto.ruleName.trim(),
        ruleType: dto.ruleType,
        targetIdentifier: dto.targetIdentifier.trim(),
        discountPercentage: percentage,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        description: dto.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      inMemoryDiscountRules.unshift(newRule);
      return newRule;
    }
  }

  /**
   * Retrieve all discount rules with optional filter
   */
  static async getAllDiscountRules(query: DiscountFilterQuery = {}): Promise<IDiscountRule[]> {
    const { ruleType, isActive, search } = query;

    if (this.isConnected()) {
      const filter: any = {};
      if (ruleType && ruleType !== 'ALL') {
        filter.ruleType = ruleType;
      }
      if (isActive !== undefined && isActive !== 'ALL') {
        filter.isActive = String(isActive) === 'true';
      }
      if (search) {
        filter.$or = [
          { ruleName: { $regex: search, $options: 'i' } },
          { targetIdentifier: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const docs = await DiscountRule.find(filter).sort({ discountPercentage: -1 });
      return docs.map((d) => d.toJSON() as unknown as IDiscountRule);
    } else {
      let list = [...inMemoryDiscountRules];

      if (ruleType && ruleType !== 'ALL') {
        list = list.filter((r) => r.ruleType === ruleType);
      }
      if (isActive !== undefined && isActive !== 'ALL') {
        list = list.filter((r) => String(r.isActive) === String(isActive));
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (r) =>
            r.ruleName.toLowerCase().includes(q) ||
            r.targetIdentifier.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q)
        );
      }

      return list.sort((a, b) => b.discountPercentage - a.discountPercentage);
    }
  }

  /**
   * Get single discount rule by ID
   */
  static async getDiscountRuleById(id: string): Promise<IDiscountRule | null> {
    if (this.isConnected()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const doc = await DiscountRule.findById(id);
        if (doc) return doc.toJSON() as unknown as IDiscountRule;
      }
      const doc = await DiscountRule.findOne({ id });
      return doc ? (doc.toJSON() as unknown as IDiscountRule) : null;
    } else {
      const match = inMemoryDiscountRules.find((r) => r.id === id || r._id === id);
      return match || null;
    }
  }

  /**
   * Update existing discount rule
   */
  static async updateDiscountRule(
    id: string,
    dto: UpdateDiscountRuleDto
  ): Promise<IDiscountRule> {
    const existing = await this.getDiscountRuleById(id);
    if (!existing) {
      const err: any = new Error(`Discount rule "${id}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (dto.discountPercentage !== undefined) {
      const p = Number(dto.discountPercentage);
      if (isNaN(p) || p < 0 || p > 100) {
        const err: any = new Error('Discount percentage must be between 0% and 100%.');
        err.statusCode = 400;
        throw err;
      }
    }

    if (this.isConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      const updated = await DiscountRule.findOneAndUpdate(
        query,
        { ...dto, updatedAt: new Date() },
        { new: true }
      );
      if (!updated) {
        const err: any = new Error('Discount rule not found for update.');
        err.statusCode = 404;
        throw err;
      }
      return updated.toJSON() as unknown as IDiscountRule;
    } else {
      const idx = inMemoryDiscountRules.findIndex((r) => r.id === id || r._id === id);
      if (idx === -1) {
        const err: any = new Error('Discount rule not found in memory.');
        err.statusCode = 404;
        throw err;
      }
      const updatedItem: IDiscountRule = {
        ...inMemoryDiscountRules[idx],
        ...dto,
        discountPercentage:
          dto.discountPercentage !== undefined
            ? Number(dto.discountPercentage)
            : inMemoryDiscountRules[idx].discountPercentage,
        updatedAt: new Date().toISOString(),
      };
      inMemoryDiscountRules[idx] = updatedItem;
      return updatedItem;
    }
  }

  /**
   * Delete discount rule
   */
  static async deleteDiscountRule(id: string): Promise<boolean> {
    if (this.isConnected()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      const res = await DiscountRule.findOneAndDelete(query);
      return !!res;
    } else {
      const lenBefore = inMemoryDiscountRules.length;
      inMemoryDiscountRules = inMemoryDiscountRules.filter(
        (r) => r.id !== id && r._id !== id
      );
      return inMemoryDiscountRules.length < lenBefore;
    }
  }

  /**
   * Evaluates comprehensive discount based on Brand, Membership Tier, and Duration rules
   * Highest valid discount logic is strictly applied.
   */
  static async calculateComprehensiveDiscount(
    req: CalculateDiscountRequest
  ): Promise<CalculateDiscountResponse> {
    const dailyPrice = Math.max(0, Number(req.dailyPrice) || 0);
    const rentalDays = Math.max(1, Number(req.rentalDays) || 1);
    const originalAmount = dailyPrice * rentalDays;

    const appliedRules: { ruleName: string; discountPercentage: number }[] = [];

    // 1. Brand default rule
    let brandDiscount = 0;
    if (req.brand) {
      brandDiscount = getBrandDefaultDiscount(req.brand);
      if (brandDiscount > 0) {
        appliedRules.push({
          ruleName: `${req.brand} Marque Standard Discount`,
          discountPercentage: brandDiscount,
        });
      }
    }

    // 2. Membership tier rule
    let membershipDiscount = 0;
    if (req.membershipTier) {
      const tierNorm = req.membershipTier.trim().toUpperCase();
      if (tierNorm === 'PLATINUM') membershipDiscount = 15;
      else if (tierNorm === 'GOLD') membershipDiscount = 10;
      else if (tierNorm === 'SILVER') membershipDiscount = 5;

      if (membershipDiscount > 0) {
        appliedRules.push({
          ruleName: `${tierNorm} Membership Privilege`,
          discountPercentage: membershipDiscount,
        });
      }
    }

    // 3. Duration bonus rule (e.g., 7+ days gets 10%)
    let durationDiscount = 0;
    if (rentalDays >= 7) {
      durationDiscount = 10;
      appliedRules.push({
        ruleName: 'Long-Term 7+ Day Rental Concession',
        discountPercentage: durationDiscount,
      });
    }

    // 4. Manual override discount if provided
    let manualDiscount = 0;
    if (req.manualDiscountPercentage !== undefined && req.manualDiscountPercentage !== null) {
      manualDiscount = Math.max(0, Math.min(100, Number(req.manualDiscountPercentage) || 0));
      if (manualDiscount > 0) {
        appliedRules.push({
          ruleName: 'Special Override Concession',
          discountPercentage: manualDiscount,
        });
      }
    }

    // Authoritative rule: Highest applicable discount applies
    const effectiveDiscountPercentage = Math.max(
      brandDiscount,
      membershipDiscount,
      durationDiscount,
      manualDiscount,
      0
    );

    const discountAmount = Math.round((originalAmount * effectiveDiscountPercentage) / 100);
    const finalAmount = Math.max(0, originalAmount - discountAmount);

    return {
      dailyPrice,
      rentalDays,
      originalAmount,
      effectiveDiscountPercentage,
      discountAmount,
      finalAmount,
      appliedRules,
    };
  }
}
