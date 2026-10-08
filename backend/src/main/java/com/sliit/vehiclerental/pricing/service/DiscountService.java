package com.sliit.vehiclerental.pricing.service;

import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.service.AuditLogService;
import com.sliit.vehiclerental.pricing.dto.CalculateDiscountRequest;
import com.sliit.vehiclerental.pricing.dto.CalculateDiscountResponse;
import com.sliit.vehiclerental.pricing.dto.DiscountRuleRequest;
import com.sliit.vehiclerental.pricing.entity.DiscountRule;
import com.sliit.vehiclerental.pricing.repository.DiscountRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Ported from the original Node/TypeScript DiscountService
 * (services/discount.service.ts). Same rule semantics: the highest
 * single applicable discount wins - brand, membership tier, duration
 * bonus (7+ days) and a manual override are NOT stacked.
 */
@Service
@Transactional
public class DiscountService {

    private final DiscountRuleRepository discountRuleRepository;
    private final DiscountEngine discountEngine;
    private final AuditLogService auditLogService;

    public DiscountService(DiscountRuleRepository discountRuleRepository, DiscountEngine discountEngine,
                           AuditLogService auditLogService) {
        this.discountRuleRepository = discountRuleRepository;
        this.discountEngine = discountEngine;
        this.auditLogService = auditLogService;
    }

    public DiscountRule createDiscountRule(DiscountRuleRequest req) {
        discountRuleRepository.findByRuleTypeAndTargetIdentifierIgnoreCase(req.getRuleType(), req.getTargetIdentifier().trim())
                .ifPresent(existing -> {
                    throw new IllegalStateException("Discount rule for type \"" + req.getRuleType() +
                            "\" and target \"" + req.getTargetIdentifier() + "\" already exists.");
                });

        DiscountRule rule = DiscountRule.builder()
                .ruleName(req.getRuleName().trim())
                .ruleType(req.getRuleType())
                .targetIdentifier(req.getTargetIdentifier().trim())
                .discountPercentage(req.getDiscountPercentage())
                .active(req.getIsActive() == null || req.getIsActive())
                .description(req.getDescription())
                .build();

        DiscountRule saved = discountRuleRepository.save(rule);
        auditLogService.log("DISCOUNT_RULE_CREATED", "DISCOUNT_RULE", String.valueOf(saved.getId()),
                "Created discount rule \"" + saved.getRuleName() + "\" (" + saved.getDiscountPercentage() + "%) for " + saved.getTargetIdentifier(), null);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<DiscountRule> getAllDiscountRules() {
        return discountRuleRepository.findAllByOrderByDiscountPercentageDesc();
    }

    @Transactional(readOnly = true)
    public DiscountRule getDiscountRuleById(Long id) {
        return discountRuleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Discount rule \"" + id + "\" not found"));
    }

    public DiscountRule updateDiscountRule(Long id, DiscountRuleRequest req) {
        DiscountRule rule = getDiscountRuleById(id);
        rule.setRuleName(req.getRuleName().trim());
        rule.setRuleType(req.getRuleType());
        rule.setTargetIdentifier(req.getTargetIdentifier().trim());
        rule.setDiscountPercentage(req.getDiscountPercentage());
        if (req.getIsActive() != null) rule.setActive(req.getIsActive());
        rule.setDescription(req.getDescription());

        DiscountRule updated = discountRuleRepository.save(rule);
        auditLogService.log("DISCOUNT_RULE_UPDATED", "DISCOUNT_RULE", String.valueOf(id),
                "Updated discount rule \"" + updated.getRuleName() + "\"", null);
        return updated;
    }

    public void deleteDiscountRule(Long id) {
        DiscountRule rule = getDiscountRuleById(id);
        discountRuleRepository.delete(rule);
        auditLogService.log("DISCOUNT_RULE_DELETED", "DISCOUNT_RULE", String.valueOf(id),
                "Deleted discount rule #" + id, null);
    }

    /**
     * Public evaluation: compute the single best (highest) applicable
     * discount across brand/membership/duration/manual-override rules -
     * exactly the "authoritative rule" from the original TS engine.
     */
    @Transactional(readOnly = true)
    public CalculateDiscountResponse calculateComprehensiveDiscount(CalculateDiscountRequest req) {
        double dailyPrice = Math.max(0, req.getDailyPrice() == null ? 0 : req.getDailyPrice());
        int rentalDays = Math.max(1, req.getRentalDays() == null ? 1 : req.getRentalDays());
        double originalAmount = dailyPrice * rentalDays;

        List<CalculateDiscountResponse.AppliedRule> appliedRules = new ArrayList<>();

        double brandDiscount = 0;
        if (req.getBrand() != null && !req.getBrand().isBlank()) {
            brandDiscount = discountEngine.getBrandDefaultDiscount(req.getBrand());
            if (brandDiscount > 0) {
                appliedRules.add(new CalculateDiscountResponse.AppliedRule(req.getBrand() + " Marque Standard Discount", brandDiscount));
            }
        }

        double membershipDiscount = 0;
        if (req.getMembershipTier() != null && !req.getMembershipTier().isBlank()) {
            String tier = req.getMembershipTier().trim().toUpperCase();
            membershipDiscount = switch (tier) {
                case "PLATINUM" -> 15;
                case "GOLD" -> 10;
                case "SILVER" -> 5;
                default -> 0;
            };
            if (membershipDiscount > 0) {
                appliedRules.add(new CalculateDiscountResponse.AppliedRule(tier + " Membership Privilege", membershipDiscount));
            }
        }

        double durationDiscount = 0;
        if (rentalDays >= 7) {
            durationDiscount = 10;
            appliedRules.add(new CalculateDiscountResponse.AppliedRule("Long-Term 7+ Day Rental Concession", durationDiscount));
        }

        double manualDiscount = 0;
        if (req.getManualDiscountPercentage() != null) {
            manualDiscount = Math.max(0, Math.min(100, req.getManualDiscountPercentage()));
            if (manualDiscount > 0) {
                appliedRules.add(new CalculateDiscountResponse.AppliedRule("Special Override Concession", manualDiscount));
            }
        }

        double effectiveDiscount = Math.max(Math.max(brandDiscount, membershipDiscount), Math.max(durationDiscount, manualDiscount));

        double discountAmount = Math.round(originalAmount * effectiveDiscount / 100.0);
        double finalAmount = Math.max(0, originalAmount - discountAmount);

        return CalculateDiscountResponse.builder()
                .dailyPrice(dailyPrice)
                .rentalDays(rentalDays)
                .originalAmount(originalAmount)
                .effectiveDiscountPercentage(effectiveDiscount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .appliedRules(appliedRules)
                .build();
    }
}
