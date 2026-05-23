USE ny_patrol_db;


USE ny_patrol_db;
SELECT driver_id, first_name, last_name FROM driver;


-- Create users table for JWT authentication
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

USE ny_patrol_db;


UPDATE users SET password_hash = '$2b$12$8T7dSVNLt13EeBUx98eg5OSQjybQbW7owt5AdzzSe3nJkKToHnvNS' WHERE username = 'admin';

UPDATE users SET password_hash = '$2b$12$8T7dSVNLt13EeBUx98eg5OSQjybQbW7owt5AdzzSe3nJkKToHnvNS' WHERE username = 'officer1';

UPDATE users SET password_hash = '$2b$12$8T7dSVNLt13EeBUx98eg5OSQjybQbW7owt5AdzzSe3nJkKToHnvNS' WHERE username = 'public';



SELECT username, password_hash FROM users;

-- Insert test users with hashed passwords
-- Password for all: "password123"
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@nypatrol.gov', '$2b$12$8T7dSVNLt13EeBUx98eg5OSQjybQbW7owt5AdzzSe3nJkKToHnvNS', 'admin'),
('officer1', 'officer1@nypatrol.gov', '$2b$12$8T7dSVNLt13EeBUx98eg5OSQjybQbW7owt5AdzzSe3nJkKToHnvNS', 'officer'),
('public', 'public@example.com', '$2b$12$8T7dSVNLt13EeBUx98eg5OSQjybQbW7owt5AdzzSe3nJkKToHnvNS', 'user');



-- Check users created
SELECT * FROM users;



-- Drop and recreate database
DROP DATABASE IF EXISTS ny_patrol_db;
CREATE DATABASE ny_patrol_db;

USE ny_patrol_db;
SHOW TABLES;

-- Table for storing driver personal details
CREATE TABLE driver (
    driver_id INT PRIMARY KEY AUTO_INCREMENT,
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    address VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    dl_number VARCHAR(20) UNIQUE NOT NULL,
    licence_state VARCHAR(2),
    birth_date DATE,
    height VARCHAR(10),
    weight VARCHAR(10),
    eye_colour VARCHAR(20)
);

-- Create Vehicle table
CREATE TABLE vehicle (
    vehicle_id INT PRIMARY KEY AUTO_INCREMENT,
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(50),
    colour VARCHAR(30),
    year INT,
    type VARCHAR(30),
    vehicle_licence VARCHAR(20) UNIQUE,
    licence_state VARCHAR(2),
    registered_owner_id INT,
    FOREIGN KEY (registered_owner_id) REFERENCES driver(driver_id)
);

-- Create Officer table
CREATE TABLE officer (
    officer_id INT PRIMARY KEY AUTO_INCREMENT,
    officer_name VARCHAR(100) NOT NULL,
    personal_number VARCHAR(20) UNIQUE NOT NULL
);

-- Create Notice table
CREATE TABLE notice (
    notice_id INT PRIMARY KEY AUTO_INCREMENT,
    violation_date DATE NOT NULL,
    violation_time TIME NOT NULL,
    district VARCHAR(50),
    detachment VARCHAR(50),
    location VARCHAR(200),
    violation_description TEXT,
    vehicle_id INT NOT NULL,
    officer_id INT NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id),
    FOREIGN KEY (officer_id) REFERENCES officer(officer_id)
);

-- Create Violation table
CREATE TABLE violation (
    violation_id INT PRIMARY KEY AUTO_INCREMENT,
    notice_id INT UNIQUE NOT NULL,
    violation_description TEXT,
    action_taken VARCHAR(100),
    FOREIGN KEY (notice_id) REFERENCES notice(notice_id)
);


SELECT User, Host FROM mysql.user 
WHERE User IN ('db_admin', 'patrol_officer', 'public_user');

-- Create users with different privileges (DCL)

-- Admin user (full access)
CREATE USER IF NOT EXISTS 'db_admin'@'localhost' IDENTIFIED BY 'admin123';
GRANT ALL PRIVILEGES ON ny_patrol_db.* TO 'db_admin'@'localhost';

-- Officer user (can insert and view notices)
CREATE USER IF NOT EXISTS 'patrol_officer'@'localhost' IDENTIFIED BY 'officer123';
GRANT SELECT, INSERT, UPDATE ON ny_patrol_db.* TO 'patrol_officer'@'localhost';

-- Citizen user (can only view their own notices)
CREATE USER IF NOT EXISTS 'public_user'@'localhost' IDENTIFIED BY 'citizen123';
GRANT SELECT ON ny_patrol_db.notice TO 'public_user'@'localhost';
GRANT SELECT ON ny_patrol_db.vehicle TO 'public_user'@'localhost';

FLUSH PRIVILEGES;

SELECT * FROM driver;

-- Insert test data into Driver table
INSERT INTO driver (last_name, first_name, address, city, state, zip_code, dl_number, licence_state, birth_date, height, weight, eye_colour) VALUES
('Anderson', 'Robert', '890 Elm Street', 'Albany', 'NY', '12203', 'NYL987654', 'NY', '1988-09-10', '178cm', '82kg', 'Hazel'),
('Martinez', 'Emily', '234 Maple Drive', 'Syracuse', 'NY', '13201', 'NYL456789', 'NY', '1995-12-18', '170cm', '65kg', 'Gray'),
('Thompson', 'David', '567 Cedar Lane', 'Yonkers', 'NY', '10701', 'NYL321098', 'NY', '2001-07-25', '183cm', '78kg', 'Blue');

-- Insert test data into Officer table
INSERT INTO officer (officer_name, personal_number) VALUES
('Sergeant Kevin Murphy', 'PN2105'),
('Officer Patricia Lee', 'PN2106'),
('Detective Robert Garcia', 'PN2107');

-- Insert test data into Vehicle table
INSERT INTO vehicle (vin, make, colour, year, type, vehicle_licence, licence_state, registered_owner_id) VALUES
('5FNRL6H78HB012345', 'Nissan', 'Blue', 2019, 'Sedan', 'ABC1234', 'NY', 1),
('1FTFW1ET5EFC98765', 'Chevrolet', 'White', 2021, 'Truck', 'XYZ5678', 'NY', 2),
('WBADT63452CJ12345', 'BMW', 'Gray', 2017, 'Sedan', 'DEF9012', 'NY', 3);

-- Insert test data into Notice table
INSERT INTO notice (violation_date, violation_time, district, detachment, location, violation_description, vehicle_id, officer_id) VALUES
('2025-01-15', '14:30:00', 'District 1', 'Detachment A', 'Main St & 5th Ave', 'Speeding 75mph in 55mph zone', 1, 1),
('2025-02-10', '09:15:00', 'District 2', 'Detachment B', 'Highway 90 Exit 12', 'Running red light', 2, 2),
('2025-03-05', '18:45:00', 'District 1', 'Detachment C', 'Park Ave near Central', 'Using phone while driving', 3, 3),
('2025-03-20', '11:00:00', 'District 3', 'Detachment A', 'Route 17 Mile 45', 'Expired registration', 1, 2);

-- Insert test data into Violation table
INSERT INTO violation (notice_id, violation_description, action_taken) VALUES
(1, 'Excessive speed - 20mph over limit', 'Fine issued - $250'),
(2, 'Traffic signal violation', 'Fine issued - $150, 2 points'),
(3, 'Distracted driving - texting', 'Fine issued - $200, mandatory safety course'),
(4, 'Vehicle registration expired 3 months', 'Fine issued - $100, vehicle impounded');


-- Query 1: Get all violation details with driver and officer names (JOIN 4 tables)
SELECT 
    n.notice_id,
    d.last_name AS driver_surname,
    d.first_name AS driver_name,
    v.make AS car_make,
    v.year AS car_year,
    n.violation_date,
    n.location,
    o.officer_name AS issuing_officer
FROM notice n
INNER JOIN vehicle v ON n.vehicle_id = v.vehicle_id
INNER JOIN driver d ON v.registered_owner_id = d.driver_id
INNER JOIN officer o ON n.officer_id = o.officer_id
ORDER BY n.violation_date DESC;

-- Query 2: Find drivers aged between 18 and 30 with violations
SELECT 
    d.first_name,
    d.last_name,
    TIMESTAMPDIFF(YEAR, d.birth_date, CURDATE()) AS age,
    COUNT(n.notice_id) AS total_violations
FROM driver d
JOIN vehicle v ON d.driver_id = v.registered_owner_id
JOIN notice n ON v.vehicle_id = n.vehicle_id
WHERE TIMESTAMPDIFF(YEAR, d.birth_date, CURDATE()) BETWEEN 18 AND 30
GROUP BY d.driver_id;

-- Query 3: Search violations related to speeding
SELECT 
    notice_id,
    violation_description,
    location,
    violation_date
FROM notice
WHERE violation_description LIKE '%speed%'
ORDER BY violation_date;

-- Query 4: Update a notice location
UPDATE notice
SET location = 'Highway 90 Exit 15 (Updated)'
WHERE notice_id = 2;

-- Query 5: Count violations by district in last 6 months
SELECT 
    district,
    COUNT(*) AS violation_count
FROM notice
WHERE violation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
GROUP BY district
ORDER BY violation_count DESC;

-- Query 6: Get vehicles with multiple violations
SELECT 
    v.vehicle_licence,
    v.make,
    v.colour,
    COUNT(n.notice_id) AS violation_count
FROM vehicle v
JOIN notice n ON v.vehicle_id = n.vehicle_id
GROUP BY v.vehicle_id
HAVING COUNT(n.notice_id) > 1;

-- Query 7: Find all violations with action taken details (JOIN 3 tables)
SELECT 
    n.notice_id,
    n.violation_date,
    n.location,
    viol.violation_description,
    viol.action_taken
FROM notice n
JOIN violation viol ON n.notice_id = viol.notice_id
WHERE viol.action_taken IS NOT NULL;

-- Query 8: List officers and their violation counts
SELECT 
    o.officer_name,
    o.personal_number,
    COUNT(n.notice_id) AS notices_issued
FROM officer o
LEFT JOIN notice n ON o.officer_id = n.officer_id
GROUP BY o.officer_id
ORDER BY notices_issued DESC;

-- Query 9: Get driver details for blue vehicles with violations
SELECT DISTINCT
    d.first_name,
    d.last_name,
    d.dl_number,
    v.make,
    v.colour
FROM driver d
JOIN vehicle v ON d.driver_id = v.registered_owner_id
JOIN notice n ON v.vehicle_id = n.vehicle_id
WHERE v.colour = 'Blue';

-- Query 10: Find violations in specific location with driver contact info
SELECT 
    n.notice_id,
    d.first_name,
    d.last_name,
    d.address,
    d.city,
    n.location,
    n.violation_date
FROM notice n
JOIN vehicle v ON n.vehicle_id = v.vehicle_id
JOIN driver d ON v.registered_owner_id = d.driver_id
WHERE n.location LIKE '%Main%'
ORDER BY n.violation_date;


