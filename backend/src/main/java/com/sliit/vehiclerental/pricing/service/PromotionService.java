package com.sliit.vehiclerental.pricing.service;

import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.service.AuditLogService;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.repository.VehicleRepository;
import com.sliit.vehiclerental.pricing.dto.EvaluatePromotionRequest;
import com.sliit.vehiclerental.pricing.dto.PromotionAnalyticsDto;
import com.sliit.vehiclerental.pricing.dto.PromotionEvaluationResult;
import com.sliit.vehiclerental.pricing.dto.PromotionRequest;
import com.sliit.vehiclerental.pricing.entity.Promotion;
import com.sliit.vehiclerental.pricing.entity.PromotionStatus;
import com.sliit.vehiclerental.pricing.entity.PromotionType;
import com.sliit.vehiclerental.pricing.repository.PromotionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Ported from the original Node/TypeScript PromotionService
 * (services/promotion.service.ts), rewritten against the shared MySQL
 * `vehicles` table (fleet.entity.Vehicle) instead of a standalone Mongo
 * vehicle collection.
 */
@Service
@Transactional
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final VehicleRepository vehicleRepository;
    private final AuditLogService auditLogService;

    public PromotionService(PromotionRepository promotionRepository, VehicleRepository vehicleRepository,
                            AuditLogService auditLogService) {
        this.promotionRepository = promotionRepository;
        this.vehicleRepository = vehicleRepository;
        this.auditLogService = auditLogService;
    }

    public Promotion createPromotion(PromotionRequest req) {
        String code = (req.getPromotionCode() != null && !req.getPromotionCode().isBlank())
                ? req.getPromotionCode().trim().toUpperCase()
                : "PROMO-" + System.currentTimeMillis();

        if (promotionRepository.existsByPromotionCodeIgnoreCase(code)) {
            throw new IllegalStateException("A promotion with code \"" + code + "\" already exists.");
        }
        if (!req.getEndDate().isAfter(req.getStartDate()) && !req.getEndDate().isEqual(req.getStartDate())) {
            throw new IllegalArgumentException("End date must be on or after the start date.");
        }

        Promotion promo = Promotion.builder()
                .promotionCode(code)
                .promotionName(req.getPromotionName().trim())
                .promotionType(req.getPromotionType())
                .vehicleCategory(req.getVehicleCategory().trim())
                .discountPercentage(req.getDiscountPercentage())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .minimumRentalDays(req.getMinimumRentalDays() != null ? req.getMinimumRentalDays() : 1)
                .status(req.getStatus() != null ? req.getStatus() : PromotionStatus.ACTIVE)
                .promotionImage(req.getPromotionImage())
                .bannerImage(req.getBannerImage())
                .description(req.getDescription())
                .usageCount(0L)
                .totalDiscountGranted(BigDecimal.ZERO)
                .build();

        Promotion saved = promotionRepository.save(promo);
        auditLogService.log("PROMOTION_CREATED", "PROMOTION", String.valueOf(saved.getId()),
                "Created promotion \"" + saved.getPromotionName() + "\" (" + saved.getDiscountPercentage() + "%)", null);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Promotion> getAllPromotions(PromotionStatus status) {
        return status != null ? promotionRepository.findByStatus(status) : promotionRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Promotion getPromotionById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Promotion \"" + id + "\" not found"));
    }

    public Promotion updatePromotion(Long id, PromotionRequest req) {
        Promotion promo = getPromotionById(id);
        promo.setPromotionName(req.getPromotionName().trim());
        promo.setPromotionType(req.getPromotionType());
        promo.setVehicleCategory(req.getVehicleCategory().trim());
        promo.setDiscountPercentage(req.getDiscountPercentage());
        promo.setStartDate(req.getStartDate());
        promo.setEndDate(req.getEndDate());
        if (req.getMinimumRentalDays() != null) promo.setMinimumRentalDays(req.getMinimumRentalDays());
        if (req.getStatus() != null) promo.setStatus(req.getStatus());
        promo.setPromotionImage(req.getPromotionImage());
        promo.setBannerImage(req.getBannerImage());
        promo.setDescription(req.getDescription());

        Promotion updated = promotionRepository.save(promo);
        auditLogService.log("PROMOTION_UPDATED", "PROMOTION", String.valueOf(id),
                "Updated promotion \"" + updated.getPromotionName() + "\"", null);
        return updated;
    }

    public void deletePromotion(Long id) {
        Promotion promo = getPromotionById(id);
        promotionRepository.delete(promo);
        auditLogService.log("PROMOTION_DELETED", "PROMOTION", String.valueOf(id),
                "Deleted promotion \"" + promo.getPromotionName() + "\"", null);
    }

    /**
     * Evaluate the best active promotion for a vehicle/date range (UC:
     * Discounts & Promotions). Same matching rules as the original:
     * date range must cover pickup, rental must meet the minimum days,
     * and the category/brand target must match (exact or substring, case
     * insensitive) the vehicle's brand or type. Highest discount wins.
     */
    @Transactional(readOnly = true)
    public PromotionEvaluationResult evaluatePromotionForBooking(EvaluatePromotionRequest req) {
        Vehicle vehicle = vehicleRepository.findById(req.getVehicleId())
                .orElseThrow(() -> new NotFoundException("Vehicle not found."));

        long calculatedDays = ChronoUnit.DAYS.between(req.getPickupDate(), req.getReturnDate());
        int rentalDays = req.getRentalDays() != null && req.getRentalDays() > 0
                ? req.getRentalDays()
                : (int) Math.max(1, calculatedDays);

        List<Promotion> active = promotionRepository.findByStatus(PromotionStatus.ACTIVE);

        String vBrand = vehicle.getBrand() == null ? "" : vehicle.getBrand().trim().toLowerCase();
        String vCategory = vehicle.getVehicleType() == null ? "" : vehicle.getVehicleType().name().toLowerCase();

        List<Promotion> valid = active.stream().filter(promo -> {
            LocalDate pickup = req.getPickupDate();
            if (pickup.isBefore(promo.getStartDate()) || pickup.isAfter(promo.getEndDate())) return false;
            if (rentalDays < (promo.getMinimumRentalDays() == null ? 1 : promo.getMinimumRentalDays())) return false;

            String target = promo.getVehicleCategory().trim().toLowerCase();
            if (target.equals("all") || target.equals("all categories")) return true;
            if (target.equals(vBrand) || target.equals(vCategory)) return true;
            if (!vBrand.isEmpty() && (vBrand.contains(target) || target.contains(vBrand))) return true;
            return !vCategory.isEmpty() && (vCategory.contains(target) || target.contains(vCategory));
        }).collect(Collectors.toList());

        Promotion best = valid.stream()
                .max(Comparator.comparingDouble(Promotion::getDiscountPercentage))
                .orElse(null);

        double promoDiscount = best != null ? best.getDiscountPercentage() : 0;
        double effectiveDiscount = promoDiscount; // no separate base-vehicle discount field in the merged Vehicle entity

        double dailyPrice = vehicle.getRentalRate() != null ? vehicle.getRentalRate().doubleValue() : 0;
        double originalAmount = dailyPrice * rentalDays;
        double discountAmount = Math.round(originalAmount * effectiveDiscount / 100.0);
        double finalAmount = Math.max(0, originalAmount - discountAmount);

        String savingsMessage = "";
        if (best != null) {
            savingsMessage = best.getPromotionName() + ": " + best.getDiscountPercentage() + "% OFF applied! You save " + discountAmount + ".";
        } else if (effectiveDiscount > 0) {
            savingsMessage = "Standard VIP Concession: " + effectiveDiscount + "% OFF applied.";
        }

        return PromotionEvaluationResult.builder()
                .appliedPromotion(best)
                .discountPercentage(effectiveDiscount)
                .dailyPrice(dailyPrice)
                .rentalDays(rentalDays)
                .originalAmount(originalAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .savingsMessage(savingsMessage)
                .build();
    }

    /** Telemetry: call when a booking confirms a promotion-discounted price. */
    public void recordUsage(Long promotionId, BigDecimal discountAmount) {
        if (promotionId == null) return;
        promotionRepository.findById(promotionId).ifPresent(p -> {
            p.setUsageCount(p.getUsageCount() + 1);
            p.setTotalDiscountGranted(p.getTotalDiscountGranted().add(discountAmount));
            promotionRepository.save(p);
        });
    }

    @Transactional(readOnly = true)
    public PromotionAnalyticsDto getPromotionAnalytics() {
        List<Promotion> all = promotionRepository.findAll();

        long total = all.size();
        long activeCount = all.stream().filter(p -> p.getStatus() == PromotionStatus.ACTIVE).count();
        long totalUsage = all.stream().mapToLong(Promotion::getUsageCount).sum();
        BigDecimal totalSavings = all.stream().map(Promotion::getTotalDiscountGranted)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<PromotionType, long[]> counts = new EnumMap<>(PromotionType.class);
        Map<PromotionType, BigDecimal> savings = new EnumMap<>(PromotionType.class);
        for (Promotion p : all) {
            counts.computeIfAbsent(p.getPromotionType(), t -> new long[2]);
            counts.get(p.getPromotionType())[0]++;
            counts.get(p.getPromotionType())[1] += p.getUsageCount();
            savings.merge(p.getPromotionType(), p.getTotalDiscountGranted(), BigDecimal::add);
        }

        List<PromotionAnalyticsDto.ByType> byType = counts.entrySet().stream()
                .map(e -> PromotionAnalyticsDto.ByType.builder()
                        .type(e.getKey())
                        .count(e.getValue()[0])
                        .usageCount(e.getValue()[1])
                        .totalSavings(savings.getOrDefault(e.getKey(), BigDecimal.ZERO))
                        .build())
                .collect(Collectors.toList());

        List<Promotion> top = all.stream()
                .sorted(Comparator.comparingLong(Promotion::getUsageCount).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return PromotionAnalyticsDto.builder()
                .totalPromotions(total)
                .activePromotions(activeCount)
                .totalUsageCount(totalUsage)
                .totalDiscountGranted(totalSavings)
                .byType(byType)
                .topPromotions(top)
                .build();
    }
}
