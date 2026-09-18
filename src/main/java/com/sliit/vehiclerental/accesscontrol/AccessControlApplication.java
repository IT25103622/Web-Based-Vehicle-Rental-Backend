package com.sliit.vehiclerental.accesscontrol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the System Administration, Security & Access Control module.
 *
 * This module is a cross-cutting layer for the Vehicle Rental Service platform:
 * every other module (Registration, Booking, Fleet, Payments, Notifications)
 * is expected to call into this module's security filter chain and
 * AuditLogService when the group project is merged.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class AccessControlApplication {
    public static void main(String[] args) {
        SpringApplication.run(AccessControlApplication.class, args);
    }
}
