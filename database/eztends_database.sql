-- EzTends Tender Management System Database
DROP DATABASE IF EXISTS eztends;
CREATE DATABASE eztends;
USE eztends;

-- Main User table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    type ENUM('ADMIN', 'SUPPLIER', 'TENDERING_AUTHORITY') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- User sub-type admin table
CREATE TABLE admins (
    admin_id INT PRIMARY KEY,
    admin_level ENUM('SUPER_ADMIN', 'ADMIN') DEFAULT 'ADMIN',
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- User sub-type supplier table
CREATE TABLE suppliers (
    supplier_id INT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    business_reg_no VARCHAR(100) UNIQUE,
    tax_id VARCHAR(100) UNIQUE,
    FOREIGN KEY (supplier_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- User sub-type tendering authority table
CREATE TABLE tendering_authorities (
    authority_id INT PRIMARY KEY,
    organization_name VARCHAR(150) NOT NULL,
    registration_no VARCHAR(100) UNIQUE,
    address VARCHAR(255),
    FOREIGN KEY (authority_id) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Category table
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tender table
CREATE TABLE tenders (
    tender_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    budget DECIMAL(15,2),
    open_date DATE NOT NULL,
    close_date DATE NOT NULL,
    status ENUM('DRAFT', 'OPEN', 'CLOSED', 'AWARDED', 'CANCELLED') DEFAULT 'OPEN',
    created_by INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES tendering_authorities(authority_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CHECK (close_date >= open_date)
) ENGINE=InnoDB;

-- Bid table
CREATE TABLE bids (
    bid_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    tender_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    proposal_file VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('SUBMITTED', 'UPDATED', 'CANCELLED', 'APPROVED', 'REJECTED') DEFAULT 'SUBMITTED',

    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    FOREIGN KEY (tender_id) REFERENCES tenders(tender_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    UNIQUE KEY unique_supplier_tender (supplier_id, tender_id)
) ENGINE=InnoDB;

-- Document table
CREATE TABLE documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    tender_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tender_id) REFERENCES tenders(tender_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Report table
CREATE TABLE reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('TENDER_REPORT', 'BID_REPORT', 'USER_ACTIVITY_REPORT') NOT NULL,
    generated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by INT NOT NULL,

    FOREIGN KEY (generated_by) REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

-- indexes for search and filtering
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_category ON tenders(category_id);
CREATE INDEX idx_tenders_dates ON tenders(open_date, close_date);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_documents_status ON documents(status);

-- Sample categories
INSERT INTO categories (category_name) VALUES
('Chemical Products'),
('Computer and IT'),
('Construction Work'),
('Drugs, Pharmaceuticals and Equipment'),
('Electrical'),
('Electronics'),
('Agriculture and Food'),
('Metals'),
('Machinery and Equipment'),
('Mining and Quarrying'),
('Miscellaneous'),
('Services'),
('Building Material'),
('Plastic and Rubber'),
('Power and Energy'),
('Printing and Advertising'),
('Safety Equipment'),
('Stationery'),
('Textiles'),
('Transport'),
('Logistics'),
('Wood and Furniture');

-- sample users
INSERT INTO users (name, email, password, type) VALUES
('System Admin', 'admin@eztends.com', 'hashed_password_here', 'ADMIN'),
('ABC Suppliers', 'supplier@abc.com', 'hashed_password_here', 'SUPPLIER'),
('Colombo Tender Authority', 'authority@colombo.gov.lk', 'hashed_password_here', 'TENDERING_AUTHORITY');

INSERT INTO admins (admin_id, admin_level) VALUES
(1, 'SUPER_ADMIN');

INSERT INTO suppliers (supplier_id, company_name, business_reg_no, tax_id) VALUES
(2, 'ABC Suppliers Pvt Ltd', 'BR12345', 'TAX12345');

INSERT INTO tendering_authorities (authority_id, organization_name, registration_no, address) VALUES
(3, 'Colombo Tender Authority', 'TA12345', 'Colombo, Sri Lanka');

ALTER TABLE users
ADD COLUMN account_status
ENUM('ACTIVE', 'INACTIVE')
NOT NULL
DEFAULT 'ACTIVE';
