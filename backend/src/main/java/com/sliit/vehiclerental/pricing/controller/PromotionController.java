package com.sliit.vehiclerental.pricing.controller;

import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import com.sliit.vehiclerental.pricing.dto.EvaluatePromotionRequest;
import com.sliit.vehiclerental.pricing.dto.PromotionAnalyticsDto;
import com.sliit.vehiclerental.pricing.dto.PromotionEvaluationResult;
import com.sliit.vehiclerental.pricing.dto.PromotionRequest;
import com.sliit.vehiclerental.pricing.entity.Promotion;
import com.sliit.vehiclerental.pricing.entity.PromotionStatus;
import com.sliit.vehiclerental.pricing.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @PostMapping
    @RequiresPermission(PermissionCodes.MANAGE_DISCOUNTS)
    public ResponseEntity<Promotion> createPromotion(@Valid @RequestBody PromotionRequest req) {
        return new ResponseEntity<>(promotionService.createPromotion(req), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Promotion>> getAllPromotions(@RequestParam(required = false) PromotionStatus status) {
        return ResponseEntity.ok(promotionService.getAllPromotions(status));
    }

    @GetMapping("/analytics")
    @RequiresPermission(PermissionCodes.VIEW_ANALYTICS)
    public ResponseEntity<PromotionAnalyticsDto> getPromotionAnalytics() {
        return ResponseEntity.ok(promotionService.getPromotionAnalytics());
    }

    /** Evaluate active promotions for a vehicle + rental period; returns the best one. */
    @PostMapping("/evaluate")
    public ResponseEntity<PromotionEvaluationResult> evaluatePromotion(@Valid @RequestBody EvaluatePromotionRequest req) {
        return ResponseEntity.ok(promotionService.evaluatePromotionForBooking(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Promotion> getPromotionById(@PathVariable Long id) {
        return ResponseEntity.ok(promotionService.getPromotionById(id));
    }

    @PutMapping("/{id}")
    @RequiresPermission(PermissionCodes.MANAGE_DISCOUNTS)
    public ResponseEntity<Promotion> updatePromotion(@PathVariable Long id, @Valid @RequestBody PromotionRequest req) {
        return ResponseEntity.ok(promotionService.updatePromotion(id, req));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(PermissionCodes.MANAGE_DISCOUNTS)
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id) {
        promotionService.deletePromotion(id);
        return ResponseEntity.noContent().build();
    }
}
