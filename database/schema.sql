-- ============================================================================
-- SE2030 Software Engineering - Group Project
-- Integrated Module: UC-02 Search, Book and Manage Vehicle Availability
-- Student Name: Maduwearachchi T.G.O.N
-- Student Registration Number: IT25101871
-- Shared Central Database: vehicle_rental_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS vehicle_rental_db;
USE vehicle_rental_db;

-- ============================================================================
-- 1. VEHICLES TABLE (Shared Fleet Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    vehicle_type VARCHAR(30) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    seating_capacity INT NOT NULL,
    rental_rate DECIMAL(10, 2) NOT NULL,
    mileage INT NOT NULL,
    fuel_level VARCHAR(20) NOT NULL,
    vehicle_condition VARCHAR(50) NOT NULL,
    operational_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    image_url VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2. BOOKINGS TABLE (Referencing Central users.id and vehicles.vehicle_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30),
    pickup_location VARCHAR(100) NOT NULL,
    dropoff_location VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    comment TEXT,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 3. SEED VEHICLES (Sri Lankan registrations - Non-destructive insert)
-- ============================================================================
INSERT INTO vehicles (vehicle_id, registration_number, vehicle_type, brand, model, seating_capacity, rental_rate, mileage, fuel_level, vehicle_condition, operational_status, image_url, description)
VALUES
(1, 'WP-CAB-1234', 'SEDAN', 'Toyota', 'Prius', 5, 8500.00, 42000, 'Full (100%)', 'Excellent', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80', 
 'Eco-friendly hybrid sedan with superb fuel efficiency, cruise control, leather seating, and premium sound system.'),

(2, 'WP-CAA-5678', 'SUV', 'Honda', 'Vezel', 5, 12000.00, 38500, '90%', 'Excellent', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', 
 'Versatile compact crossover SUV featuring smart entry, push start, paddle shift, and high ground clearance.'),

(3, 'WP-KX-9012', 'HATCHBACK', 'Suzuki', 'Wagon R', 4, 4800.00, 65000, '80%', 'Good', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80', 
 'Economical city hatchback. Ideal for quick urban commuting, easy parking, and high mileage economy.'),

(4, 'WP-CAD-3456', 'VAN', 'Toyota', 'HiAce KDH', 14, 16500.00, 92000, '100%', 'Good', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=800&q=80', 
 'Spacious 14-seater passenger commuter van with dual AC, reclining high-back seats, and ample luggage space.'),

(5, 'WP-CAE-7890', 'SUV', 'Nissan', 'X-Trail', 7, 14500.00, 48000, '85%', 'Excellent', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 
 '7-seater all-wheel drive SUV with panoramic sunroof, intelligent emergency braking, and spacious cargo capacity.'),

(6, 'WP-CAG-2345', 'HATCHBACK', 'Toyota', 'Aqua', 5, 6200.00, 51000, '75%', 'Very Good', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80', 
 'Compact hybrid hatchback combining spirited performance with remarkable fuel savings for island-wide trips.'),

(7, 'WP-CAH-6789', 'LUXURY', 'BMW', '3 Series (320d)', 5, 24000.00, 29000, 'Full (100%)', 'Showroom Mint', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80', 
 'Executive German luxury sedan equipped with BMW Live Cockpit, ambient lighting, M-Sport styling, and plush comfort.'),

(8, 'WP-CAJ-1011', 'LUXURY', 'Mercedes-Benz', 'C-Class (C200)', 5, 28000.00, 24500, '95%', 'Showroom Mint', 'AVAILABLE', 
 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80', 
 'Elegantly refined luxury salon offering Burmester surround audio, active brake assist, and first-class ride quality.'),

(9, 'WP-CAL-1213', 'SEDAN', 'Toyota', 'Allion', 5, 9000.00, 78000, '50%', 'Under Inspection', 'MAINTENANCE', 
 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80', 
 'Currently scheduled for routine brake and transmission maintenance. Not available for new bookings.')
ON DUPLICATE KEY UPDATE registration_number = VALUES(registration_number);
