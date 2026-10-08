package com.sliit.vehiclerental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point for the unified Web-Based Vehicle Rental Service platform.
 *
 * This merges the 5 group members' modules into one Spring Boot application,
 * sharing one database, one JWT/session auth system (the Access Control
 * module, package com.sliit.vehiclerental.accesscontrol), and one audit log:
 *
 *   - accesscontrol : System Admin, Security & Access Control (Widanage)
 *   - booking        : Search, Book & Manage Vehicle Availability (Maduwerachchi)
 *   - fleet / inspection / media : Manage Fleet & Vehicle Records, Return & Inspection (Sampath)
 *   - support        : Customer Support Tickets (Ahamed)
 *   - pricing        : Discounts & Promotions (Wijesinghe, ported from the original TS module)
 *
 * Being at the com.sliit.vehiclerental root (rather than nested under one
 * module's package) means @SpringBootApplication's default component scan
 * picks up every module's controllers/services/repositories automatically.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class VehicleRentalApplication {
    public static void main(String[] args) {
        SpringApplication.run(VehicleRentalApplication.class, args);
    }
}
