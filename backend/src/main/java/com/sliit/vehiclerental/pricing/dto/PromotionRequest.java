package com.sliit.vehiclerental.pricing.dto;

import com.sliit.vehiclerental.pricing.entity.PromotionStatus;
import com.sliit.vehiclerental.pricing.entity.PromotionType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public class PromotionRequest {
    private String promotionCode;

    @NotBlank(message = "Promotion name is required")
    private String promotionName;

    @NotNull(message = "Promotion type is required")
    private PromotionType promotionType;

    @NotBlank(message = "Vehicle category or brand target is required")
    private String vehicleCategory;

    @NotNull(message = "Discount percentage is required")
    @DecimalMin(value = "0.0") @DecimalMax(value = "100.0")
    private Double discountPercentage;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    private Integer minimumRentalDays;
    private PromotionStatus status;
    private String promotionImage;
    private String bannerImage;
    private String description;

    public String getPromotionCode() { return promotionCode; }
    public void setPromotionCode(String promotionCode) { this.promotionCode = promotionCode; }
    public String getPromotionName() { return promotionName; }
    public void setPromotionName(String promotionName) { this.promotionName = promotionName; }
    public PromotionType getPromotionType() { return promotionType; }
    public void setPromotionType(PromotionType promotionType) { this.promotionType = promotionType; }
    public String getVehicleCategory() { return vehicleCategory; }
    public void setVehicleCategory(String vehicleCategory) { this.vehicleCategory = vehicleCategory; }
    public Double getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(Double discountPercentage) { this.discountPercentage = discountPercentage; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Integer getMinimumRentalDays() { return minimumRentalDays; }
    public void setMinimumRentalDays(Integer minimumRentalDays) { this.minimumRentalDays = minimumRentalDays; }
    public PromotionStatus getStatus() { return status; }
    public void setStatus(PromotionStatus status) { this.status = status; }
    public String getPromotionImage() { return promotionImage; }
    public void setPromotionImage(String promotionImage) { this.promotionImage = promotionImage; }
    public String getBannerImage() { return bannerImage; }
    public void setBannerImage(String bannerImage) { this.bannerImage = bannerImage; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
