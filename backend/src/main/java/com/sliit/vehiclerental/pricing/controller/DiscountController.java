package com.sliit.vehiclerental.pricing.controller;

import com.sliit.vehiclerental.accesscontrol.security.PermissionCodes;
import com.sliit.vehiclerental.accesscontrol.security.RequiresPermission;
import com.sliit.vehiclerental.pricing.dto.CalculateDiscountRequest;
import com.sliit.vehiclerental.pricing.dto.CalculateDiscountResponse;
import com.sliit.vehiclerental.pricing.dto.DiscountRuleRequest;
import com.sliit.vehiclerental.pricing.entity.DiscountRule;
import com.sliit.vehiclerental.pricing.service.DiscountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @PostMapping
    @RequiresPermission(PermissionCodes.MANAGE_DISCOUNTS)
    public ResponseEntity<DiscountRule> createDiscountRule(@Valid @RequestBody DiscountRuleRequest req) {
        return new ResponseEntity<>(discountService.createDiscountRule(req), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DiscountRule>> getAllDiscountRules() {
        return ResponseEntity.ok(discountService.getAllDiscountRules());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscountRule> getDiscountRuleById(@PathVariable Long id) {
        return ResponseEntity.ok(discountService.getDiscountRuleById(id));
    }

    @PutMapping("/{id}")
    @RequiresPermission(PermissionCodes.MANAGE_DISCOUNTS)
    public ResponseEntity<DiscountRule> updateDiscountRule(@PathVariable Long id, @Valid @RequestBody DiscountRuleRequest req) {
        return ResponseEntity.ok(discountService.updateDiscountRule(id, req));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(PermissionCodes.MANAGE_DISCOUNTS)
    public ResponseEntity<Void> deleteDiscountRule(@PathVariable Long id) {
        discountService.deleteDiscountRule(id);
        return ResponseEntity.noContent().build();
    }

    /** Public evaluation endpoint: compute the best discount for a quote/booking. */
    @PostMapping("/calculate")
    public ResponseEntity<CalculateDiscountResponse> calculateDiscount(@Valid @RequestBody CalculateDiscountRequest req) {
        return ResponseEntity.ok(discountService.calculateComprehensiveDiscount(req));
    }
}
