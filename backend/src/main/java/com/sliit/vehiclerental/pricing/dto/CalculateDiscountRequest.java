package com.sliit.vehiclerental.pricing.dto;

import jakarta.validation.constraints.NotNull;

public class CalculateDiscountRequest {
    @NotNull(message = "dailyPrice is required for discount calculation")
    private Double dailyPrice;
    private Integer rentalDays;
    private String brand;
    private String membershipTier;
    private Double manualDiscountPercentage;

    public Double getDailyPrice() { return dailyPrice; }
    public void setDailyPrice(Double dailyPrice) { this.dailyPrice = dailyPrice; }
    public Integer getRentalDays() { return rentalDays; }
    public void setRentalDays(Integer rentalDays) { this.rentalDays = rentalDays; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getMembershipTier() { return membershipTier; }
    public void setMembershipTier(String membershipTier) { this.membershipTier = membershipTier; }
    public Double getManualDiscountPercentage() { return manualDiscountPercentage; }
    public void setManualDiscountPercentage(Double manualDiscountPercentage) { this.manualDiscountPercentage = manualDiscountPercentage; }
}
