/**
 * DriveX Automatic Discount Calculation Engine
 * 
 * Rules:
 * - BMW: 20% discount
 * - Mercedes Benz / Mercedes: 30% discount
 * - Toyota: 15% discount
 * 
 * Formula:
 * discountAmount = dailyPrice * discountPercentage / 100
 * finalPrice = dailyPrice - discountAmount
 */

export const BRAND_DEFAULT_DISCOUNTS: Record<string, number> = {
  'bmw': 20,
  'mercedes benz': 30,
  'mercedes-benz': 30,
  'mercedes': 30,
  'toyota': 15,
};

/**
 * Returns the default promotional discount percentage for a brand
 */
export const getBrandDefaultDiscount = (brand: string): number => {
  if (!brand) return 0;
  const normalized = brand.trim().toLowerCase();
  return BRAND_DEFAULT_DISCOUNTS[normalized] ?? 0;
};

/**
 * Calculates discount amount and final daily price
 */
export const calculatePricing = (
  dailyPrice: number,
  discountPercentage?: number | null,
  brand?: string
): { discountPercentage: number; discountAmount: number; finalPrice: number } => {
  // If discount percentage is not explicitly provided, look up automatic brand default
  let effectiveDiscount = discountPercentage;
  if (effectiveDiscount === undefined || effectiveDiscount === null) {
    effectiveDiscount = brand ? getBrandDefaultDiscount(brand) : 0;
  }

  // Ensure discount is clamped between 0 and 100
  effectiveDiscount = Math.max(0, Math.min(100, Number(effectiveDiscount) || 0));

  const safePrice = Math.max(0, Number(dailyPrice) || 0);
  const discountAmount = Math.round((safePrice * effectiveDiscount) / 100);
  const finalPrice = Math.max(0, safePrice - discountAmount);

  return {
    discountPercentage: effectiveDiscount,
    discountAmount,
    finalPrice,
  };
};
