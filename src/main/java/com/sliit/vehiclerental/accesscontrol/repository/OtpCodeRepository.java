package com.sliit.vehiclerental.accesscontrol.repository;

import com.sliit.vehiclerental.accesscontrol.entity.OtpCode;
import com.sliit.vehiclerental.accesscontrol.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByUserAndPurposeAndUsedFalseOrderByCreatedAtDesc(User user, String purpose);
}
