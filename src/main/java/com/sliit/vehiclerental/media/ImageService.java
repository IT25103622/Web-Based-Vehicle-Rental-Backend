package com.sliit.vehiclerental.media;

import com.sliit.vehiclerental.accesscontrol.exception.NotFoundException;
import com.sliit.vehiclerental.accesscontrol.service.AuditLogService;
import com.sliit.vehiclerental.fleet.entity.Vehicle;
import com.sliit.vehiclerental.fleet.repository.VehicleRepository;
import com.sliit.vehiclerental.inspection.repository.VehicleInspectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import javax.imageio.ImageIO;
import javax.imageio.stream.ImageInputStream;

@Service @RequiredArgsConstructor
public class ImageService {
    public static final int MAX_IMAGES = 10;
    public static final long MAX_BYTES = 5 * 1024 * 1024;
    private final ImageRepository images;
    private final VehicleRepository vehicles;
    private final VehicleInspectionRepository inspections;
    private final AuditLogService audit;
    @Value("${app.upload.directory:./uploads}") private String uploadDirectory;
    private record ValidImage(byte[] bytes, String name, String type, String extension) {}

    public void validateUploads(List<MultipartFile> files) { validate(files); }

    private List<ValidImage> validate(List<MultipartFile> files) {
        if (files == null) return List.of();
        if (files.size() > MAX_IMAGES) throw new IllegalArgumentException("Maximum 10 images per vehicle or inspection.");
        List<ValidImage> result = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) throw new IllegalArgumentException("Empty image files are not allowed.");
            if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Each image must be 5 MB or smaller.");
            try {
                byte[] b = file.getBytes();
                String type, ext;
                if (b.length >= 8 && b[0] == (byte)137 && b[1] == 80 && b[2] == 78 && b[3] == 71
                        && b[4] == 13 && b[5] == 10 && b[6] == 26 && b[7] == 10) { type="image/png"; ext="png"; }
                else if (b.length >= 3 && b[0] == (byte)255 && b[1] == (byte)216 && b[2] == (byte)255) { type="image/jpeg"; ext="jpg"; }
                else if (isWebp(b)) { type="image/webp"; ext="webp"; }
                else throw new IllegalArgumentException("Only valid JPG, PNG and WebP images are accepted.");
                if (!ext.equals("webp")) {
                    try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(b))) {
                        var readers = ImageIO.getImageReaders(input);
                        if (!readers.hasNext()) throw new IllegalArgumentException("Image file cannot be read.");
                        var reader = readers.next();
                        try {
                            reader.setInput(input);
                            int w=reader.getWidth(0), h=reader.getHeight(0);
                            if (w <= 0 || h <= 0 || (long)w*h > 20_000_000)
                                throw new IllegalArgumentException("Images must be at most 20 megapixels.");
                            if (reader.read(0) == null) throw new IllegalArgumentException("Invalid image data.");
                        } finally { reader.dispose(); }
                    }
                }
                String name = Optional.ofNullable(file.getOriginalFilename()).orElse("image." + ext)
                        .replace('\\', '/');
                name = name.substring(name.lastIndexOf('/')+1).replaceAll("[\\p{Cntrl}]", "");
                if (name.isBlank()) name="image."+ext;
                if (name.length() > 150) name=name.substring(0,150);
                result.add(new ValidImage(b,name,type,ext));
            } catch (IOException ex) { throw new IllegalArgumentException("Image file is invalid or cannot be read.", ex); }
        }
        return result;
    }

    private static long uint(byte[] b, int offset) {
        return ((long)b[offset]&255) | (((long)b[offset+1]&255)<<8) |
                (((long)b[offset+2]&255)<<16) | (((long)b[offset+3]&255)<<24);
    }
    private boolean isWebp(byte[] b) {
        if (b.length < 30 || !new String(b,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")
                || !new String(b,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP")
                || uint(b,4)+8 != b.length) return false;
        boolean image=false;
        for (int p=12; p < b.length;) {
            if (p+8 > b.length) return false;
            String chunk=new String(b,p,4,java.nio.charset.StandardCharsets.US_ASCII);
            long n=uint(b,p+4), end=p+8L+n;
            if (end > b.length) return false;
            if (chunk.equals("VP8 ")) {
                if (n < 10 || b[p+11]!=(byte)157 || b[p+12]!=1 || b[p+13]!=42) return false;
                int w=(b[p+14]&255)|((b[p+15]&63)<<8), h=(b[p+16]&255)|((b[p+17]&63)<<8);
                if (w==0 || h==0 || (long)w*h>20_000_000) return false;
                image=true;
            } else if (chunk.equals("VP8L")) {
                if(n < 5 || b[p+8]!=47) return false;
                long dims=uint(b,p+9); long w=(dims&16383)+1, h=((dims>>14)&16383)+1;
                if(w*h>20_000_000) return false;
                image=true;
            }
            p=(int)(end+(n&1));
        }
        return image;
    }

    private Path path(String name) {
        if (!name.matches("[a-f0-9-]{36}\\.(jpg|png|webp)")) throw new IllegalStateException("Invalid stored image name.");
        return Path.of(uploadDirectory).toAbsolutePath().normalize().resolve(name);
    }
    private ImageDto dto(UploadedImage i) {
        String prefix = i.getVehicle()!=null ? "/api/vehicle-images/" : "/api/inspection-images/";
        return new ImageDto(i.getId(), prefix+i.getId()+"/content", i.getOriginalName(), i.getContentType(), i.getSizeBytes());
    }
    @Transactional(readOnly=true) public List<ImageDto> vehicleImages(Long id) {
        return images.findByVehicle_IdOrderByIdAsc(id).stream().map(this::dto).toList();
    }
    @Transactional(readOnly=true) public List<ImageDto> inspectionImages(Long id) {
        return images.findByInspection_IdOrderByIdAsc(id).stream().map(this::dto).toList();
    }
    @Transactional public List<ImageDto> addVehicleImages(Long id, List<MultipartFile> files) {
        Vehicle v=vehicles.findById(id).orElseThrow(() -> new NotFoundException("Vehicle not found."));
        // Serialize image count checks and mutations on the owning row.
        vehicles.lockImageOwner(id);
        add(files, v, null, images.findByVehicle_IdOrderByIdAsc(id).size());
        refreshCover(v);
        return vehicleImages(id);
    }
    @Transactional public List<ImageDto> addInspectionImages(Long id, List<MultipartFile> files) {
        var i=inspections.findById(id).orElseThrow(() -> new NotFoundException("Inspection not found."));
        inspections.lockImageOwner(id);
        add(files, null, i, images.findByInspection_IdOrderByIdAsc(id).size());
        return inspectionImages(id);
    }
    private void add(List<MultipartFile> files, Vehicle v,
                     com.sliit.vehiclerental.inspection.entity.VehicleInspection inspection, int existing) {
        List<ValidImage> validated=validate(files);
        if(existing+validated.size()>MAX_IMAGES) throw new IllegalArgumentException("Maximum 10 images per vehicle or inspection.");
        for(ValidImage image: validated) {
            String stored=UUID.randomUUID()+"."+image.extension();
            Path target=path(stored);
            try {
                Files.createDirectories(target.getParent());
                Files.write(target, image.bytes(), StandardOpenOption.CREATE_NEW);
            } catch(IOException ex) { removeFile(target); throw new IllegalStateException("Could not save image. Check the uploads folder permissions.",ex); }
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCompletion(int status) {
                    if(status!=STATUS_COMMITTED) removeFile(target);
                }
            });
            UploadedImage row=new UploadedImage();
            row.setVehicle(v); row.setInspection(inspection); row.setStoredName(stored);
            row.setOriginalName(image.name()); row.setContentType(image.type()); row.setSizeBytes(image.bytes().length);
            images.save(row);
        }
        if (!validated.isEmpty()) audit.log("IMAGES_UPLOADED", v!=null?"VEHICLE":"VEHICLE_INSPECTION",
                String.valueOf(v!=null?v.getId():inspection.getId()), "Uploaded "+validated.size()+" images",null);
    }
    private void refreshCover(Vehicle v) {
        var rows=images.findByVehicle_IdOrderByIdAsc(v.getId());
        v.setImageUrl(rows.isEmpty()?null:dto(rows.get(0)).url()); vehicles.save(v);
    }
    private void removeFile(Path target) {
        try { Files.deleteIfExists(target); } catch(IOException ex) {
            org.slf4j.LoggerFactory.getLogger(ImageService.class).warn("Could not remove stored image {}",target.getFileName());
        }
    }
    private void remove(UploadedImage row) {
        Path target=path(row.getStoredName()); images.delete(row); images.flush();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { removeFile(target); }
        });
    }
    @Transactional public void removeVehicleImage(Long vehicleId, Long imageId) {
        vehicles.lockImageOwner(vehicleId);
        var row=images.findById(imageId).filter(i -> i.getVehicle()!=null && i.getVehicle().getId().equals(vehicleId))
                .orElseThrow(() -> new NotFoundException("Image not found for this vehicle."));
        Vehicle v=row.getVehicle(); remove(row); refreshCover(v);
        audit.log("IMAGE_REMOVED","VEHICLE",String.valueOf(vehicleId),"Removed image #"+imageId,null);
    }
    @Transactional public void removeInspectionImage(Long inspectionId, Long imageId) {
        inspections.lockImageOwner(inspectionId);
        var row=images.findById(imageId).filter(i -> i.getInspection()!=null && i.getInspection().getId().equals(inspectionId))
                .orElseThrow(() -> new NotFoundException("Image not found for this inspection."));
        remove(row);
        audit.log("IMAGE_REMOVED","VEHICLE_INSPECTION",String.valueOf(inspectionId),"Removed image #"+imageId,null);
    }
    @Transactional public void removeForVehicle(Long id) { images.findByVehicle_IdOrderByIdAsc(id).forEach(this::remove); }
    @Transactional public void removeForInspection(Long id) { images.findByInspection_IdOrderByIdAsc(id).forEach(this::remove); }
    public record Content(byte[] bytes, String type) {}
    @Transactional(readOnly=true) public Content content(Long id, boolean vehicleImage) {
        var row=images.findById(id).filter(i -> vehicleImage ? i.getVehicle()!=null : i.getInspection()!=null)
                .orElseThrow(() -> new NotFoundException("Image not found."));
        try { return new Content(Files.readAllBytes(path(row.getStoredName())),row.getContentType()); }
        catch(IOException ex) { throw new NotFoundException("Image file is unavailable."); }
    }
}
