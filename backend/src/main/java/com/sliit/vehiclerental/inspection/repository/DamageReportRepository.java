package com.sliit.vehiclerental.inspection.repository;

import com.sliit.vehiclerental.inspection.entity.DamageReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DamageReportRepository extends JpaRepository<DamageReport, Long> {
    Optional<DamageReport> findByInspectionId(Long inspectionId);
}
