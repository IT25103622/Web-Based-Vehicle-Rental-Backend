package com.sliit.vehiclerental.pricing.repository;

import com.sliit.vehiclerental.pricing.entity.Promotion;
import com.sliit.vehiclerental.pricing.entity.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    Optional<Promotion> findByPromotionCodeIgnoreCase(String promotionCode);
    boolean existsByPromotionCodeIgnoreCase(String promotionCode);
    List<Promotion> findByStatus(PromotionStatus status);
    List<Promotion> findAllByOrderByCreatedAtDesc();
}
