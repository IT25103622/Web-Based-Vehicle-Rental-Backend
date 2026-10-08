package com.sliit.vehiclerental.pricing.service;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Automatic brand-default discount lookup, ported verbatim (same brands,
 * same percentages) from the original utils/discountEngine.ts.
 */
@Component
public class DiscountEngine {

    private static final Map<String, Double> BRAND_DEFAULT_DISCOUNTS = Map.of(
            "bmw", 20.0,
            "mercedes benz", 30.0,
            "mercedes-benz", 30.0,
            "mercedes", 30.0,
            "toyota", 15.0
    );

    public double getBrandDefaultDiscount(String brand) {
        if (brand == null || brand.isBlank()) return 0;
        return BRAND_DEFAULT_DISCOUNTS.getOrDefault(brand.trim().toLowerCase(), 0.0);
    }

    public record Pricing(double discountPercentage, double discountAmount, double finalPrice) {}

    public Pricing calculatePricing(double dailyPrice, Double discountPercentage, String brand) {
        double effective = discountPercentage != null ? discountPercentage : getBrandDefaultDiscount(brand);
        effective = Math.max(0, Math.min(100, effective));

        double safePrice = Math.max(0, dailyPrice);
        double discountAmount = Math.round(safePrice * effective / 100.0);
        double finalPrice = Math.max(0, safePrice - discountAmount);

        return new Pricing(effective, discountAmount, finalPrice);
    }
}
