#!/usr/bin/env python
"""
Script to create 10 recipes for a specific user using ingredients from all_ingredients.sql

Usage:
    # From backend/fithub directory:
    python3 ../populate_db_sqls/create_recipes_for_user.py
    
    # OR using Django shell:
    python3 manage.py shell < ../populate_db_sqls/create_recipes_for_user.py

To change user ID, modify the USER_ID variable below.
"""

import os
import sys
import django

# Setup Django environment
if __name__ == "__main__":
    # Script should be run from backend/fithub directory
    # Get current working directory (should be backend/fithub)
    current_dir = os.getcwd()
    
    # Check if we're in backend/fithub directory
    if os.path.basename(current_dir) == 'fithub' and os.path.exists('manage.py'):
        # We're in backend/fithub, perfect!
        sys.path.insert(0, current_dir)
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fithub.settings')
    else:
        # Try to find fithub directory
        # If script is run from backend/fithub, current_dir should be fithub
        # If not, try to find it relative to script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Script is in backend/populate_db_sqls
        # Go up one level to backend, then into fithub
        backend_dir = os.path.dirname(script_dir)
        fithub_dir = os.path.join(backend_dir, 'fithub')
        
        if os.path.exists(os.path.join(fithub_dir, 'manage.py')):
            # Found fithub directory, change to it
            os.chdir(fithub_dir)
            sys.path.insert(0, fithub_dir)
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fithub.settings')
        else:
            raise RuntimeError(
                "Error: Could not find 'fithub' directory with manage.py\n"
                "Please run this script from the 'backend/fithub' directory:\n"
                "  cd practice-app/backend/fithub\n"
                "  python3 ../populate_db_sqls/create_recipes_for_user.py"
            )
    
    django.setup()

from recipes.models import Recipe, RecipeIngredient
from ingredients.models import Ingredient
from api.models import RegisteredUser
from decimal import Decimal
from django.utils import timezone
import requests
from pathlib import Path
import cloudinary
import cloudinary.uploader

# ============================================
# CONFIGURATION - Change this to your desired user ID
# ============================================
USER_ID = 1

# ============================================
# Recipe Definitions
# ============================================

RECIPES = [
    {
        'name': 'Classic Chicken Stir Fry',
        'meal_type': 'dinner',
        'prep_time': 15,
        'cook_time': 20,
        'steps': [
            'Cut chicken breast into thin strips',
            'Heat vegetable oil in a large wok or pan',
            'Cook chicken until golden brown and cooked through',
            'Add bell peppers, broccoli, and carrots',
            'Stir fry for 5 minutes until vegetables are tender-crisp',
            'Add minced garlic and grated ginger',
            'Season with salt and black pepper',
            'Serve hot over steamed rice'
        ],
        'ingredients': [
            ('Chicken Breast', 300, 'g'),
            ('Bell Pepper', 2, 'pcs'),
            ('Broccoli', 200, 'g'),
            ('Carrot', 2, 'pcs'),
            ('Garlic', 10, 'g'),
            ('Ginger', 20, 'g'),
            ('Vegetable Oil', 30, 'ml'),
            ('Salt', 5, 'g'),
            ('Black Pepper', 5, 'g'),
            ('Rice', 200, 'g'),
        ]
    },
    {
        'name': 'Mediterranean Quinoa Salad',
        'meal_type': 'lunch',
        'prep_time': 20,
        'cook_time': 15,
        'steps': [
            'Rinse quinoa thoroughly under cold water',
            'Cook quinoa in boiling water for 15 minutes until fluffy',
            'Let quinoa cool to room temperature',
            'Dice cucumber, tomato, and bell pepper',
            'Chop fresh basil and oregano',
            'Mix quinoa with vegetables and herbs',
            'Dress with olive oil, lemon juice, salt and pepper',
            'Serve chilled or at room temperature'
        ],
        'ingredients': [
            ('Quinoa', 150, 'g'),
            ('Cucumber', 1, 'pcs'),
            ('Tomato', 2, 'pcs'),
            ('Bell Pepper', 1, 'pcs'),
            ('Basil', 10, 'g'),
            ('Oregano', 5, 'g'),
            ('Olive Oil', 30, 'ml'),
            ('Lemon', 1, 'pcs'),
            ('Salt', 3, 'g'),
            ('Black Pepper', 2, 'g'),
        ]
    },
    {
        'name': 'Scrambled Eggs with Toast',
        'meal_type': 'breakfast',
        'prep_time': 5,
        'cook_time': 10,
        'steps': [
            'Crack eggs into a bowl and whisk',
            'Heat butter in a non-stick pan',
            'Pour in eggs and scramble gently',
            'Season with salt and black pepper',
            'Toast bread slices until golden',
            'Serve eggs on toast with fresh herbs'
        ],
        'ingredients': [
            ('Eggs', 3, 'pcs'),
            ('Butter', 20, 'g'),
            ('Whole Wheat Bread', 2, 'pcs'),
            ('Salt', 2, 'g'),
            ('Black Pepper', 2, 'g'),
        ]
    },
    {
        'name': 'Grilled Salmon with Asparagus',
        'meal_type': 'dinner',
        'prep_time': 10,
        'cook_time': 15,
        'steps': [
            'Preheat grill or grill pan to medium-high heat',
            'Season salmon fillets with salt, pepper, and lemon juice',
            'Brush asparagus with olive oil',
            'Grill salmon for 6-7 minutes per side',
            'Grill asparagus for 5-6 minutes until tender',
            'Serve with a drizzle of olive oil and lemon wedges'
        ],
        'ingredients': [
            ('Salmon Fillet', 200, 'g'),
            ('Asparagus', 200, 'g'),
            ('Olive Oil', 20, 'ml'),
            ('Lemon', 1, 'pcs'),
            ('Salt', 3, 'g'),
            ('Black Pepper', 2, 'g'),
        ]
    },
    {
        'name': 'Vegetable Pasta Primavera',
        'meal_type': 'dinner',
        'prep_time': 15,
        'cook_time': 20,
        'steps': [
            'Bring a large pot of salted water to boil',
            'Cook pasta according to package directions',
            'Heat olive oil in a large pan',
            'Sauté garlic and onion until fragrant',
            'Add zucchini, bell peppers, and tomatoes',
            'Cook vegetables until tender',
            'Toss cooked pasta with vegetables',
            'Add parmesan cheese and fresh basil',
            'Season with salt and pepper'
        ],
        'ingredients': [
            ('Pasta', 300, 'g'),
            ('Zucchini', 2, 'pcs'),
            ('Bell Pepper', 1, 'pcs'),
            ('Tomato', 2, 'pcs'),
            ('Garlic', 10, 'g'),
            ('Onion', 1, 'pcs'),
            ('Olive Oil', 40, 'ml'),
            ('Parmesan', 50, 'g'),
            ('Basil', 10, 'g'),
            ('Salt', 5, 'g'),
            ('Black Pepper', 3, 'g'),
        ]
    },
    {
        'name': 'Avocado Toast with Poached Eggs',
        'meal_type': 'breakfast',
        'prep_time': 10,
        'cook_time': 5,
        'steps': [
            'Toast bread slices until golden brown',
            'Mash avocado with lemon juice and salt',
            'Poach eggs in simmering water for 3-4 minutes',
            'Spread avocado mixture on toast',
            'Top with poached eggs',
            'Garnish with black pepper and optional red pepper flakes'
        ],
        'ingredients': [
            ('Whole Wheat Bread', 2, 'pcs'),
            ('Avocado', 1, 'pcs'),
            ('Eggs', 2, 'pcs'),
            ('Lemon', 0.5, 'pcs'),
            ('Salt', 2, 'g'),
            ('Black Pepper', 2, 'g'),
        ]
    },
    {
        'name': 'Beef and Vegetable Stir Fry',
        'meal_type': 'dinner',
        'prep_time': 20,
        'cook_time': 15,
        'steps': [
            'Slice beef into thin strips',
            'Marinate beef with soy sauce and ginger',
            'Heat oil in a wok over high heat',
            'Stir fry beef until browned, then remove',
            'Add vegetables: broccoli, bell peppers, carrots',
            'Stir fry vegetables until crisp-tender',
            'Return beef to pan and add sauce',
            'Serve over steamed rice'
        ],
        'ingredients': [
            ('Ground Beef', 300, 'g'),
            ('Broccoli', 200, 'g'),
            ('Bell Pepper', 2, 'pcs'),
            ('Carrot', 2, 'pcs'),
            ('Garlic', 10, 'g'),
            ('Ginger', 15, 'g'),
            ('Vegetable Oil', 30, 'ml'),
            ('Rice', 200, 'g'),
            ('Salt', 3, 'g'),
        ]
    },
    {
        'name': 'Greek Yogurt Parfait',
        'meal_type': 'breakfast',
        'prep_time': 10,
        'cook_time': 0,
        'steps': [
            'Layer Greek yogurt in a glass or bowl',
            'Add fresh strawberries and blueberries',
            'Sprinkle with granola or nuts',
            'Drizzle with honey or maple syrup',
            'Repeat layers',
            'Top with fresh mint leaves'
        ],
        'ingredients': [
            ('Greek Yogurt', 200, 'g'),
            ('Strawberries', 100, 'g'),
            ('Blueberries', 50, 'g'),
            ('Almonds', 30, 'g'),
        ]
    },
    {
        'name': 'Mushroom Risotto',
        'meal_type': 'dinner',
        'prep_time': 15,
        'cook_time': 30,
        'steps': [
            'Heat olive oil and butter in a large pan',
            'Sauté chopped onion until translucent',
            'Add rice and toast for 2 minutes',
            'Add white wine and stir until absorbed',
            'Add warm broth one ladle at a time, stirring constantly',
            'Sauté mushrooms separately',
            'When rice is creamy, stir in mushrooms and parmesan',
            'Season with salt, pepper, and fresh thyme'
        ],
        'ingredients': [
            ('Rice', 200, 'g'),
            ('Mushrooms', 200, 'g'),
            ('Onion', 1, 'pcs'),
            ('Garlic', 10, 'g'),
            ('Olive Oil', 30, 'ml'),
            ('Butter', 30, 'g'),
            ('Parmesan', 50, 'g'),
            ('Thyme', 5, 'g'),
            ('Salt', 5, 'g'),
            ('Black Pepper', 3, 'g'),
        ]
    },
    {
        'name': 'Fresh Fruit Smoothie Bowl',
        'meal_type': 'breakfast',
        'prep_time': 10,
        'cook_time': 0,
        'steps': [
            'Blend frozen banana with Greek yogurt',
            'Add fresh strawberries and blueberries',
            'Blend until smooth and creamy',
            'Pour into a bowl',
            'Top with fresh fruit slices, granola, and chia seeds',
            'Drizzle with honey or maple syrup'
        ],
        'ingredients': [
            ('Banana', 1, 'pcs'),
            ('Greek Yogurt', 150, 'g'),
            ('Strawberries', 100, 'g'),
            ('Blueberries', 50, 'g'),
            ('Chia Seeds', 15, 'g'),
        ]
    },
]

# ============================================
# Main Script
# ============================================

def get_ingredient_by_name(name):
    """Get ingredient by name, raise error if not found."""
    try:
        return Ingredient.objects.get(name=name)
    except Ingredient.DoesNotExist:
        raise ValueError(f"Ingredient '{name}' not found in database. Make sure all_ingredients.sql has been loaded.")

def get_recipe_image(image_number):
    """
    Get a recipe image from local recipe_img folder by number (1-10).
    Uploads to Cloudinary and returns the public_id string for CloudinaryField.
    Returns None if image not found.
    """
    try:
        # Get the script directory
        script_dir = Path(__file__).parent
        recipe_img_dir = script_dir / 'recipe_img'
        
        # Try jpg first, then other extensions
        possible_extensions = ['jpg', 'jpeg', 'png', 'webp']
        
        for ext in possible_extensions:
            image_path = recipe_img_dir / f"{image_number}.{ext}"
            if image_path.exists():
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    str(image_path),
                    folder="recipes",  # Optional: organize in Cloudinary
                    resource_type="image"
                )
                # Return the public_id (CloudinaryField stores this)
                return upload_result['public_id']
        
        print(f"  Warning: Image {image_number}.jpg not found in recipe_img folder")
        return None
    except Exception as e:
        print(f"  Warning: Could not upload image {image_number}.jpg to Cloudinary: {str(e)}")
        return None

def create_recipes_for_user(user_id):
    """Create all recipes for the specified user."""
    try:
        user = RegisteredUser.objects.get(id=user_id)
        print(f"Creating recipes for user: {user.username} (ID: {user_id})")
    except RegisteredUser.DoesNotExist:
        raise ValueError(f"User with ID {user_id} does not exist.")

    created_recipes = []
    
    for index, recipe_data in enumerate(RECIPES, start=1):
        print(f"\nCreating recipe: {recipe_data['name']}")
        
        # Get image from local recipe_img folder (1.jpg, 2.jpg, ..., 10.jpg)
        image_file = get_recipe_image(index)
        if image_file:
            print(f"  - Image {index}.jpg loaded from recipe_img folder")
        
        # Create recipe
        recipe = Recipe.objects.create(
            name=recipe_data['name'],
            meal_type=recipe_data['meal_type'],
            prep_time=recipe_data['prep_time'],
            cook_time=recipe_data['cook_time'],
            steps=recipe_data['steps'],
            creator=user,
            is_approved=True,
            is_featured=False,
            image=image_file,  # CloudinaryField will handle the upload automatically
        )
        
        # Add ingredients
        for ingredient_name, quantity, unit in recipe_data['ingredients']:
            ingredient = get_ingredient_by_name(ingredient_name)
            
            # Validate unit
            if unit not in ingredient.allowed_units:
                print(f"Warning: Unit '{unit}' not in allowed_units for {ingredient_name}, using first allowed unit")
                unit = ingredient.allowed_units[0] if ingredient.allowed_units else 'pcs'
            
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantity=Decimal(str(quantity)),
                unit=unit
            )
            print(f"  - Added {quantity} {unit} of {ingredient_name}")
        
        # Calculate and save cost_per_serving in USD (signal will also do this, but we do it explicitly)
        class _DummyUSDUser:
            preferredCurrency = "USD"
        recipe.cost_per_serving = recipe.calculate_cost_per_serving(_DummyUSDUser())
        recipe.save()
        
        created_recipes.append(recipe)
        print(f"✓ Recipe '{recipe.name}' created successfully (ID: {recipe.id}, Cost: ${recipe.cost_per_serving})")
    
    print(f"\n{'='*60}")
    print(f"Successfully created {len(created_recipes)} recipes for user {user_id}")
    print(f"{'='*60}")
    
    return created_recipes

if __name__ == "__main__":
    # Run the script
    create_recipes_for_user(USER_ID)

