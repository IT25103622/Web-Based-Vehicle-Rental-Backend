export type PromotionType =
  | 'CATEGORY_DISCOUNT'
  | 'SEASONAL_OFFER'
  | 'FESTIVAL_OFFER'
  | 'FLASH_SALE'
  | 'WEEKEND_OFFER'
  | 'LONG_TERM_RENTAL';

export type PromotionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface IPromotion {
  id: string;
  _id?: string | any;
  promotionId: string;
  promotionName: string;
  promotionType: PromotionType;
  vehicleCategory: string; // Brand (e.g. BMW, Mercedes-Benz, Toyota), category (Luxury Sedan, SUV), or 'All'
  discountPercentage: number;
  startDate: string | Date;
  endDate: string | Date;
  minimumRentalDays: number;
  status: PromotionStatus;
  promotionImage?: string;
  bannerImage?: string;
  description?: string;
  usageCount: number;
  totalDiscountGranted: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreatePromotionDto {
  promotionId?: string;
  promotionName: string;
  promotionType: PromotionType;
  vehicleCategory: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  minimumRentalDays?: number;
  status?: PromotionStatus;
  promotionImage?: string;
  bannerImage?: string;
  description?: string;
}

export interface UpdatePromotionDto {
  promotionName?: string;
  promotionType?: PromotionType;
  vehicleCategory?: string;
  discountPercentage?: number;
  startDate?: string;
  endDate?: string;
  minimumRentalDays?: number;
  status?: PromotionStatus;
  promotionImage?: string;
  bannerImage?: string;
  description?: string;
}

export interface PromotionFilterQuery {
  status?: string;
  promotionType?: string;
  vehicleCategory?: string;
  search?: string;
}

export interface EvaluatePromotionDto {
  vehicleId: string;
  pickupDate: string;
  returnDate: string;
  rentalDays?: number;
}

export interface PromotionEvaluationResult {
  appliedPromotion: IPromotion | null;
  discountPercentage: number;
  dailyPrice: number;
  rentalDays: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  savingsMessage?: string;
}

export interface PromotionAnalyticsSummary {
  totalPromotions: number;
  activePromotions: number;
  totalUsageCount: number;
  totalDiscountGranted: number;
  byType: {
    type: PromotionType;
    count: number;
    usageCount: number;
    totalSavings: number;
  }[];
  topPromotions: IPromotion[];
}
