package com.sliit.vehiclerental.pricing.dto;

import com.sliit.vehiclerental.pricing.entity.Promotion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionEvaluationResult {
    private Promotion appliedPromotion;
    private double discountPercentage;
    private double dailyPrice;
    private int rentalDays;
    private double originalAmount;
    private double discountAmount;
    private double finalAmount;
    private String savingsMessage;
}
