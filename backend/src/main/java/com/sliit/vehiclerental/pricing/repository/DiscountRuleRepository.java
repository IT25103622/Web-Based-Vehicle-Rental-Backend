package com.sliit.vehiclerental.pricing.repository;

import com.sliit.vehiclerental.pricing.entity.DiscountRule;
import com.sliit.vehiclerental.pricing.entity.DiscountRuleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiscountRuleRepository extends JpaRepository<DiscountRule, Long> {
    Optional<DiscountRule> findByRuleTypeAndTargetIdentifierIgnoreCase(DiscountRuleType ruleType, String targetIdentifier);
    List<DiscountRule> findAllByOrderByDiscountPercentageDesc();
    List<DiscountRule> findByRuleTypeOrderByDiscountPercentageDesc(DiscountRuleType ruleType);
}
