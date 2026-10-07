package com.sliit.vehiclerental.media;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ImageRepository extends JpaRepository<UploadedImage, Long> {
    List<UploadedImage> findByVehicle_IdOrderByIdAsc(Long vehicleId);
    List<UploadedImage> findByInspection_IdOrderByIdAsc(Long inspectionId);
}
