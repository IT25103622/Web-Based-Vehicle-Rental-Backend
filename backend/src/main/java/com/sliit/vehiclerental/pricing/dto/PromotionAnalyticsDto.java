package com.sliit.vehiclerental.pricing.dto;

import com.sliit.vehiclerental.pricing.entity.Promotion;
import com.sliit.vehiclerental.pricing.entity.PromotionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionAnalyticsDto {
    private long totalPromotions;
    private long activePromotions;
    private long totalUsageCount;
    private BigDecimal totalDiscountGranted;
    private List<ByType> byType;
    private List<Promotion> topPromotions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ByType {
        private PromotionType type;
        private long count;
        private long usageCount;
        private BigDecimal totalSavings;
    }
}
