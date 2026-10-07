package com.sliit.vehiclerental.customer.controller;

import com.sliit.vehiclerental.customer.dto.CustomerProfileDTO;
import com.sliit.vehiclerental.customer.entity.CustomerUser;
import com.sliit.vehiclerental.customer.repository.CustomerUserRepository;
import com.sliit.vehiclerental.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final CustomerUserRepository customerUserRepository;

    public MeController(CustomerUserRepository customerUserRepository) {
        this.customerUserRepository = customerUserRepository;
    }

    /**
     * Retrieve ONLY the currently authenticated customer's own profile.
     * Prevents enumeration of other customers.
     */
    @GetMapping
    public ResponseEntity<CustomerProfileDTO> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null || principal.getId() == null) {
            return ResponseEntity.status(401).build();
        }

        CustomerUser user = customerUserRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        CustomerProfileDTO profile = new CustomerProfileDTO(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                principal.getRole()
        );

        return ResponseEntity.ok(profile);
    }
}
