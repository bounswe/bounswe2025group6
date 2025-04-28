DROP DATABASE IF EXISTS  fithub;
CREATE DATABASE fithub;
USE fithub;

CREATE TABLE mediaFile (
    media_id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('image', 'video', 'document') NOT NULL,
    url VARCHAR(255) NOT NULL,
    caption VARCHAR(255),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registered_users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_visibility ENUM('public', 'private', 'friends_only') DEFAULT 'public',
    recipe_count INT DEFAULT 0,
    avg_recipe_rating DECIMAL(3,2) DEFAULT 0.00,
    profile_photo_id INT,
    type_of_cook ENUM('beginner', 'intermediate', 'advanced', 'professional') DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE, 
    FOREIGN KEY (profile_photo_id) REFERENCES mediaFile(media_id)
);

CREATE TABLE media_owners (
user_id INT,
media_id INT,
PRIMARY KEY (user_id, media_id),
FOREIGN KEY (user_id) REFERENCES registered_users(user_id),
FOREIGN KEY (media_id) REFERENCES mediaFile(media_id)
);

CREATE TABLE user_allergies (
    user_id INT,
    allergy VARCHAR(50),
    PRIMARY KEY (user_id, allergy),
    FOREIGN KEY (user_id) REFERENCES registered_users(user_id) ON DELETE CASCADE
);

CREATE TABLE notification_preferences (
    user_id INT,
    notification_type VARCHAR(50),
    is_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (user_id, notification_type),
    FOREIGN KEY (user_id) REFERENCES registered_users(user_id) ON DELETE CASCADE
);

CREATE TABLE dietitians (
    user_id INT PRIMARY KEY,
    verification_document_id INT,
    clinic_location VARCHAR(100),
    website VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_requested_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES registered_users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (verification_document_id) REFERENCES mediaFile(media_id)
);

CREATE TABLE dietitian_professional_info (
    user_id INT,
    info_key VARCHAR(50),
    info_value TEXT,
    PRIMARY KEY (user_id, info_key),
    FOREIGN KEY (user_id) REFERENCES dietitians(user_id) ON DELETE CASCADE
);

-- Indexes for user tables
CREATE INDEX idx_user_username ON registered_users(username);
CREATE INDEX idx_user_email ON registered_users(email);