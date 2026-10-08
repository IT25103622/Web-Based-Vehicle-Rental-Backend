package com.sliit.vehiclerental.pricing.dto;

import com.sliit.vehiclerental.pricing.entity.DiscountRuleType;
import jakarta.validation.constraints.*;

public class DiscountRuleRequest {
    @NotBlank(message = "Rule name is required")
    private String ruleName;

    @NotNull(message = "Rule type is required")
    private DiscountRuleType ruleType;

    @NotBlank(message = "Target identifier is required (e.g. BMW, GOLD)")
    private String targetIdentifier;

    @NotNull(message = "Discount percentage is required")
    @DecimalMin(value = "0.0", message = "Discount percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Discount percentage cannot exceed 100%")
    private Double discountPercentage;

    private Boolean isActive;
    private String description;

    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }
    public DiscountRuleType getRuleType() { return ruleType; }
    public void setRuleType(DiscountRuleType ruleType) { this.ruleType = ruleType; }
    public String getTargetIdentifier() { return targetIdentifier; }
    public void setTargetIdentifier(String targetIdentifier) { this.targetIdentifier = targetIdentifier; }
    public Double getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(Double discountPercentage) { this.discountPercentage = discountPercentage; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
