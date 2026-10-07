package com.sliit.vehiclerental.media;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.inspection.entity.VehicleInspection;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="uploaded_images") @Getter @Setter @NoArgsConstructor
public class UploadedImage {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="vehicle_id") private Vehicle vehicle;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="inspection_id") private VehicleInspection inspection;
    @Column(nullable=false, unique=true, length=80) private String storedName;
    @Column(nullable=false, length=150) private String originalName;
    @Column(nullable=false, length=30) private String contentType;
    @Column(nullable=false) private long sizeBytes;
}
