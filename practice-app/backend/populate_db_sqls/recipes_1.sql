INSERT INTO `recipes_recipe` (
  `created_at`, `updated_at`, `deleted_on`, `name`, `steps`, `prep_time`, `cook_time`,
  `meal_type`, `cost_per_serving`, `difficulty_rating`, `taste_rating`, `health_rating`,
  `like_count`, `comment_count`, `difficulty_rating_count`, `taste_rating_count`,
  `health_rating_count`, `is_approved`, `is_featured`, `creator_id`, `image`
) VALUES
('2025-10-16 08:00:00', '2025-10-16 08:00:00', NULL, 'Classic Pancakes', '["Mix flour, eggs, milk, and sugar", "Heat a skillet and add butter", "Pour batter and cook until golden", "Flip and cook other side"]', 10, 15, 'breakfast', 2.50, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 0, 1, NULL),
('2025-10-16 08:05:00', '2025-10-16 08:05:00', NULL, 'Spaghetti Bolognese', '["Chop onions and garlic", "Cook minced beef until brown", "Add tomato sauce and herbs", "Simmer for 30 minutes", "Boil spaghetti", "Serve together with parmesan"]', 20, 40, 'dinner', 5.75, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 1, 1, NULL),
('2025-10-16 08:10:00', '2025-10-16 08:10:00', NULL, 'Quinoa Salad', '["Rinse quinoa and boil until fluffy", "Chop vegetables", "Mix quinoa with vegetables and dressing", "Serve chilled"]', 15, 15, 'lunch', 3.20, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 0, 1, NULL),
('2025-10-16 08:15:00', '2025-10-16 08:15:00', NULL, 'Grilled Salmon with Asparagus', '["Preheat grill", "Season salmon with lemon and herbs", "Grill salmon and asparagus until cooked", "Serve with a drizzle of olive oil"]', 10, 20, 'dinner', 7.80, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 1, 1, NULL),
('2025-10-16 08:20:00', '2025-10-16 08:20:00', NULL, 'Avocado Toast', '["Toast bread slices", "Mash avocado with lemon juice", "Spread avocado on toast", "Top with salt, pepper, and optional toppings"]', 5, 5, 'breakfast', 1.90, NULL, NULL, NULL, 0, 0, 0, 0, 0, 1, 0, 1, NULL);
