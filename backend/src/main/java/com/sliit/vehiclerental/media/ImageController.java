package com.sliit.vehiclerental.media;
import com.sliit.vehiclerental.accesscontrol.security.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class ImageController {
    private final ImageService service;
    @PostMapping(value="/fleet/vehicles/{id}/images", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public List<ImageDto> addVehicle(@PathVariable Long id, @RequestPart("images") List<MultipartFile> files) {
        return service.addVehicleImages(id,files);
    }
    @DeleteMapping("/fleet/vehicles/{id}/images/{imageId}")
    @RequiresPermission(PermissionCodes.MANAGE_FLEET)
    public ResponseEntity<Void> removeVehicle(@PathVariable Long id, @PathVariable Long imageId) {
        service.removeVehicleImage(id,imageId); return ResponseEntity.noContent().build();
    }
    @PostMapping(value="/inspections/{id}/images", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequiresPermission(value=PermissionCodes.MANAGE_FLEET,anyOf={PermissionCodes.INSPECT_VEHICLE})
    public List<ImageDto> addInspection(@PathVariable Long id, @RequestPart("images") List<MultipartFile> files) {
        return service.addInspectionImages(id,files);
    }
    @DeleteMapping("/inspections/{id}/images/{imageId}")
    @RequiresPermission(value=PermissionCodes.MANAGE_FLEET,anyOf={PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<Void> removeInspection(@PathVariable Long id, @PathVariable Long imageId) {
        service.removeInspectionImage(id,imageId); return ResponseEntity.noContent().build();
    }
    @GetMapping("/vehicle-images/{id}/content")
    public ResponseEntity<byte[]> vehicleContent(@PathVariable Long id) { return content(id,true); }
    @GetMapping("/inspection-images/{id}/content")
    @RequiresPermission(value=PermissionCodes.MANAGE_FLEET,anyOf={PermissionCodes.INSPECT_VEHICLE})
    public ResponseEntity<byte[]> inspectionContent(@PathVariable Long id) { return content(id,false); }
    private ResponseEntity<byte[]> content(Long id, boolean vehicle) {
        var file=service.content(id,vehicle);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.type()))
                .header("X-Content-Type-Options","nosniff")
                .cacheControl(CacheControl.noStore()).body(file.bytes());
    }
}
