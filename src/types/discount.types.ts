export type DiscountRuleType =
  | 'BRAND_DEFAULT'
  | 'MEMBERSHIP_TIER'
  | 'DURATION_TIER'
  | 'CUSTOM';

export interface IDiscountRule {
  id: string;
  _id?: string | any;
  ruleName: string;
  ruleType: DiscountRuleType;
  targetIdentifier: string; // e.g., 'BMW', 'Mercedes-Benz', 'Toyota', 'GOLD', 'PLATINUM', 'LONG_TERM'
  discountPercentage: number;
  isActive: boolean;
  description?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateDiscountRuleDto {
  ruleName: string;
  ruleType: DiscountRuleType;
  targetIdentifier: string;
  discountPercentage: number;
  isActive?: boolean;
  description?: string;
}

export interface UpdateDiscountRuleDto {
  ruleName?: string;
  ruleType?: DiscountRuleType;
  targetIdentifier?: string;
  discountPercentage?: number;
  isActive?: boolean;
  description?: string;
}

export interface DiscountFilterQuery {
  ruleType?: string;
  isActive?: string | boolean;
  search?: string;
}

export interface CalculateDiscountRequest {
  dailyPrice: number;
  rentalDays?: number;
  brand?: string;
  category?: string;
  membershipTier?: string;
  manualDiscountPercentage?: number;
}

export interface CalculateDiscountResponse {
  dailyPrice: number;
  rentalDays: number;
  originalAmount: number;
  effectiveDiscountPercentage: number;
  discountAmount: number;
  finalAmount: number;
  appliedRules: {
    ruleName: string;
    discountPercentage: number;
  }[];
}
