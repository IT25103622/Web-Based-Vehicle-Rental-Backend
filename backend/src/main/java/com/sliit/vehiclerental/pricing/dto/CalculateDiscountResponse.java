package com.sliit.vehiclerental.pricing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateDiscountResponse {
    private double dailyPrice;
    private int rentalDays;
    private double originalAmount;
    private double effectiveDiscountPercentage;
    private double discountAmount;
    private double finalAmount;
    private List<AppliedRule> appliedRules;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppliedRule {
        private String ruleName;
        private double discountPercentage;
    }
}
