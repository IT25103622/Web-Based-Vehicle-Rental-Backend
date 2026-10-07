package com.sliit.vehiclerental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Entry Application for:
 * SE2030 Software Engineering - Individual Module
 * UC-02: Search, Book and Manage Vehicle Availability
 *
 * Student: Maduwearachchi T.G.O.N
 * Registration Number: IT25101871
 */
@SpringBootApplication
public class VehicleRentalApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehicleRentalApplication.class, args);
        System.out.println("==========================================================");
        System.out.println(" Vehicle Rental System (UC-02) Successfully Started!");
        System.out.println(" Student: Maduwearachchi T.G.O.N (IT25101871)");
        System.out.println(" Open in browser: http://localhost:8080");
        System.out.println("==========================================================");
    }
}
