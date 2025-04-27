DROP DATABASE IF EXISTS  cooking_app;
CREATE DATABASE cooking_app;
USE cooking_app;

CREATE TABLE registered_users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_visibility ENUM('public', 'private', 'friends_only') DEFAULT 'public',
    recipe_count INT DEFAULT 0,
    avg_recipe_rating DECIMAL(3,2) DEFAULT 0.00,
    type_of_cook ENUM('beginner', 'intermediate', 'advanced', 'professional') DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
);


-- Insert sample data into registered_users table
INSERT INTO registered_users (username, email, password_hash, profile_visibility, recipe_count, avg_recipe_rating, type_of_cook, created_at, updated_at, is_active)
VALUES
('john_doe', 'john.doe@example.com', '$2a$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'public', 10, 4.5, 'intermediate', NOW(), NOW(), TRUE),
('jane_smith', 'jane.smith@example.com', '$2a$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'friends_only', 5, 3.9, 'beginner', NOW(), NOW(), TRUE),
('chef_mike', 'mike.chef@example.com', '$2a$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'private', 25, 4.8, 'professional', NOW(), NOW(), TRUE);

