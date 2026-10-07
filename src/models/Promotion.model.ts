import mongoose, { Schema, Document, Model } from 'mongoose';
import { PromotionType, PromotionStatus } from '../types/promotion.types';

export interface IPromotionDoc extends Document {
  promotionId: string;
  promotionName: string;
  promotionType: PromotionType;
  vehicleCategory: string;
  discountPercentage: number;
  startDate: Date;
  endDate: Date;
  minimumRentalDays: number;
  status: PromotionStatus;
  promotionImage?: string;
  bannerImage?: string;
  description?: string;
  usageCount: number;
  totalDiscountGranted: number;
  createdAt: Date;
  updatedAt: Date;
}

const promotionSchema = new Schema<IPromotionDoc>(
  {
    promotionId: {
      type: String,
      required: [true, 'Promotion ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    promotionName: {
      type: String,
      required: [true, 'Promotion name is required'],
      trim: true,
    },
    promotionType: {
      type: String,
      enum: [
        'CATEGORY_DISCOUNT',
        'SEASONAL_OFFER',
        'FESTIVAL_OFFER',
        'FLASH_SALE',
        'WEEKEND_OFFER',
        'LONG_TERM_RENTAL',
      ],
      required: [true, 'Promotion type is required'],
      index: true,
    },
    vehicleCategory: {
      type: String,
      required: [true, 'Vehicle category or brand target is required'],
      trim: true,
      index: true,
    },
    discountPercentage: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: [1, 'Discount percentage must be at least 1%'],
      max: [100, 'Discount percentage cannot exceed 100%'],
    },
    startDate: {
      type: Date,
      required: [true, 'Promotion start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'Promotion end date is required'],
      index: true,
    },
    minimumRentalDays: {
      type: Number,
      default: 1,
      min: [1, 'Minimum rental days must be at least 1'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    promotionImage: {
      type: String,
      default: '',
      trim: true,
    },
    bannerImage: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDiscountGranted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for active promotions lookup within dates
promotionSchema.index({ status: 1, startDate: 1, endDate: 1, vehicleCategory: 1 });

export const Promotion: Model<IPromotionDoc> = mongoose.model<IPromotionDoc>(
  'Promotion',
  promotionSchema
);

export default Promotion;
