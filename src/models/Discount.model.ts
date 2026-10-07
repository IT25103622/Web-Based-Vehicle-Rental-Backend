import mongoose, { Schema, Document, Model } from 'mongoose';
import { DiscountRuleType } from '../types/discount.types';

export interface IDiscountRuleDoc extends Document {
  ruleName: string;
  ruleType: DiscountRuleType;
  targetIdentifier: string;
  discountPercentage: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const discountRuleSchema = new Schema<IDiscountRuleDoc>(
  {
    ruleName: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    ruleType: {
      type: String,
      enum: ['BRAND_DEFAULT', 'MEMBERSHIP_TIER', 'DURATION_TIER', 'CUSTOM'],
      required: [true, 'Rule type is required'],
      index: true,
    },
    targetIdentifier: {
      type: String,
      required: [true, 'Target identifier is required (e.g. BMW, Mercedes-Benz, GOLD)'],
      trim: true,
      index: true,
    },
    discountPercentage: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
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

discountRuleSchema.index({ ruleType: 1, targetIdentifier: 1 }, { unique: true });

export const DiscountRule: Model<IDiscountRuleDoc> = mongoose.model<IDiscountRuleDoc>(
  'DiscountRule',
  discountRuleSchema
);

export default DiscountRule;
