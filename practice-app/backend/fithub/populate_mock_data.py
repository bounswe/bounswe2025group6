#!/usr/bin/env python
"""
Automated script to populate database with mock data using API endpoints.

This script creates:
- Multiple users with registration and email verification
- Recipes (without ingredients)
- Forum posts
- Comments on posts
- Recipe likes (using Django ORM - no endpoint available)
- Recipe bookmarks
- Recipe ratings
- Post votes
- Comment votes

Usage:
    # From backend/fithub directory:
    python3 populate_mock_data.py
    
    # Or with Django management command:
    python3 manage.py shell < populate_mock_data.py

Configuration:
    - BASE_URL: API base URL (default: http://localhost:8000/api)
    - NUM_USERS: Number of users to create (default: 10)
    - RECIPES_PER_USER: Number of recipes per user (default: 2-4 random)
    - POSTS_PER_USER: Number of posts per user (default: 1-3 random)
    - COMMENTS_PER_POST: Number of comments per post (default: 2-5 random)
"""

import os
import sys
import json
import random
from typing import List, Dict, Optional

# Try to import requests - required for API calls
try:
    import requests
except ImportError:
    print("=" * 70)
    print("ERROR: The 'requests' module is not installed.")
    print("=" * 70)
    print("\nPlease install the required dependencies:")
    print("  pip install -r requirements.txt")
    print("\nOr install requests directly:")
    print("  pip install requests")
    print("=" * 70)
    sys.exit(1)

# Setup Django environment
if __name__ == "__main__":
    try:
        import django
    except ImportError:
        print("=" * 70)
        print("ERROR: Django is not installed or not in your Python path.")
        print("=" * 70)
        print("\nPlease ensure you:")
        print("1. Are in a virtual environment with Django installed")
        print("2. Have installed all requirements: pip install -r requirements.txt")
        print("3. Are running from the correct directory: backend/fithub/")
        print("\nAlternatively, you can run this script using Django's shell:")
        print("  python3 manage.py shell < populate_mock_data.py")
        print("=" * 70)
        sys.exit(1)
    
    current_dir = os.getcwd()
    
    if os.path.basename(current_dir) == 'fithub' and os.path.exists('manage.py'):
        sys.path.insert(0, current_dir)
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fithub.settings')
    else:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        if os.path.basename(script_dir) == 'fithub':
            os.chdir(script_dir)
            sys.path.insert(0, script_dir)
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fithub.settings')
        else:
            raise RuntimeError(
                "Error: Please run this script from the 'backend/fithub' directory:\n"
                "  cd backend/fithub\n"
                "  python3 populate_mock_data.py"
            )
    
    django.setup()

    # Django is now set up - import functions that use Django will work
    # Django model imports are done inside functions/methods as needed

# ============================================
# CONFIGURATION
# ============================================
BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:8000/api')
NUM_USERS = int(os.environ.get('NUM_USERS', '10'))
VERIFY_EMAILS = True  # Set to False to skip email verification

# Valid forum post tags
VALID_TAGS = ['Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
              'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick', 'Healthy',
              'Student', 'Nutrition', 'Healthy Eating', 'Snacks']

# Meal types
MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

# Mock data generators
FIRST_NAMES = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
    'Sam', 'Dakota', 'Jamie', 'Cameron', 'Blake', 'Drew', 'Skylar', 'Peyton',
    'Rowan', 'River', 'Phoenix', 'Ari', 'Charlie', 'Finley', 'Hayden', 'Reese',
    'Emery', 'Sage', 'Eden', 'Wren', 'Ellis', 'Quinn', 'Dylan', 'Harper',
    'Noah', 'Liam', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte',
    'Amelia', 'Evelyn', 'Abigail', 'Emily', 'Ella', 'Elizabeth', 'Sofia', 'Avery',
    'Scarlett', 'Grace', 'Chloe', 'Victoria', 'Riley', 'Aria', 'Lily', 'Natalie'
]

LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
    'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
    'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
    'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
]

RECIPE_NAMES = [
    'Delicious Pasta Carbonara', 'Fresh Greek Salad', 'Homemade Pizza Margherita',
    'Creamy Chicken Alfredo', 'Spicy Thai Curry', 'Classic Beef Burger',
    'Vegetarian Buddha Bowl', 'Seafood Paella', 'Chocolate Chip Cookies',
    'Caesar Salad', 'Beef Tacos', 'Vegetable Stir Fry', 'Chicken Noodle Soup',
    'Beef Stew', 'Fish and Chips', 'Ratatouille', 'Lasagna', 'Risotto',
    'Pad Thai', 'Sushi Rolls', 'Tacos al Pastor', 'Hamburger Helper',
    'Spaghetti Bolognese', 'Chicken Parmesan', 'Eggplant Parmesan',
    'French Onion Soup', 'Beef Wellington', 'Chicken Tikka Masala'
]

POST_TITLES = [
    'Best meal prep tips for busy students',
    'Quick and healthy breakfast ideas',
    'How to meal prep on a budget',
    'Vegetarian meal ideas for beginners',
    'Meal prep containers that changed my life',
    '10-minute healthy dinners',
    'How I meal prep for the whole week',
    'Budget-friendly grocery shopping tips',
    'Healthy snack ideas between meals',
    'Easy vegetarian recipes for meal prep',
    'How to save time in the kitchen',
    'Meal prep mistakes to avoid',
    'Healthy eating on a student budget',
    'Quick breakfast ideas for busy mornings',
    'How to make meal prep fun and easy'
]

POST_CONTENTS = [
    'I\'ve been meal prepping for 2 years now and it has completely changed my life! Here are my top tips...',
    'Eating healthy doesn\'t have to be expensive or time-consuming. Let me share some of my favorite quick recipes...',
    'As a student, I understand the struggle of eating well on a budget. Here are some tips that have helped me...',
    'Meal prep can seem overwhelming at first, but once you get into a routine, it becomes second nature...',
    'I\'ve tried many different meal prep strategies over the years. Here\'s what has worked best for me...',
    'These simple recipes have become staples in my meal prep rotation. They\'re easy, healthy, and delicious!',
    'Budget meal prep doesn\'t mean sacrificing flavor or nutrition. Here are some of my favorite affordable recipes...',
    'One of the best investments I\'ve made is good quality meal prep containers. They make such a difference!',
    'I used to struggle with finding time to cook, but meal prep has solved that problem completely...',
    'These vegetarian recipes are so good that even meat-lovers ask for the recipes!'
]

COMMENT_TEXTS = [
    'Great tips! Thanks for sharing.',
    'This is exactly what I needed. Going to try this next week!',
    'Love this idea! I\'ve been looking for meal prep inspiration.',
    'Thanks for the helpful advice. Can\'t wait to try some of these recipes.',
    'This is so helpful! I struggle with meal prep, so these tips are great.',
    'I\'ve been doing something similar and it works great!',
    'Thanks for sharing your experience. Very helpful!',
    'I\'m going to try this method. Looks much easier than what I\'ve been doing.',
    'Great post! I love how simple and practical these tips are.',
    'This is exactly the kind of content I need. Keep it up!',
    'I tried this and it worked perfectly! Thank you for the inspiration.',
    'Such good advice! Meal prep has changed my life too.',
    'I appreciate you sharing this. Very informative!',
    'Love these ideas! Can\'t wait to incorporate them into my routine.'
]


# ============================================
# HELPER FUNCTIONS
# ============================================

class MockDataGenerator:
    def __init__(self, base_url: str = BASE_URL):
        # Import Django models here (after Django setup)
        from ingredients.models import Ingredient
        
        self.base_url = base_url.rstrip('/')  # Remove trailing slash
        # Extract base URL without /api for forum/recipes endpoints
        if '/api' in self.base_url:
            self.server_base = self.base_url.split('/api')[0]
        else:
            self.server_base = self.base_url
        self.users = []
        self.recipes = []
        self.posts = []
        self.comments = []
        # Load available ingredients from database
        self.available_ingredients = list(Ingredient.objects.filter(deleted_on__isnull=True))
        if not self.available_ingredients:
            print("  ⚠ Warning: No ingredients found in database. Recipes will be created without ingredients.")
        else:
            print(f"  ✓ Loaded {len(self.available_ingredients)} available ingredients")
        
    def generate_user_data(self, index: int) -> Dict:
        """Generate random user data."""
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        username = f"{first_name.lower()}{last_name.lower()}{index}"
        email = f"{username}@example.com"
        
        return {
            'username': username,
            'email': email,
            'password': 'SecurePass123!',
            'usertype': 'user'
        }
    
    def register_user(self, user_data: Dict) -> Optional[Dict]:
        """Register a new user via API endpoint."""
        url = f"{self.base_url}/register/"
        response = requests.post(url, json=user_data)
        
        if response.status_code == 201:
            print(f"  ✓ Registered user: {user_data['username']}")
            # Get user ID from database
            try:
                from api.models import RegisteredUser
                user = RegisteredUser.objects.get(email=user_data['email'])
                return {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'password': user_data['password'],
                    'is_active': user.is_active
                }
            except Exception as e:
                if 'DoesNotExist' in str(type(e).__name__):
                    print(f"  ✗ Warning: User {user_data['email']} not found in database after registration")
                else:
                    print(f"  ✗ Error retrieving user: {str(e)}")
                return None
        else:
            print(f"  ✗ Failed to register user {user_data['username']}: {response.status_code} - {response.text}")
            return None
    
    def verify_email(self, user_id: int) -> bool:
        """Verify user email by generating token and calling verification endpoint."""
        try:
            from api.models import RegisteredUser
            from django.contrib.auth.tokens import default_token_generator
            from django.utils.http import urlsafe_base64_encode
            from django.utils.encoding import force_bytes
            
            user = RegisteredUser.objects.get(id=user_id)
            
            # Generate verification token (already imported above)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Call verification endpoint
            url = f"{self.base_url}/verify-email/{uid}/{token}/"
            response = requests.get(url)
            
            if response.status_code == 200:
                user.refresh_from_db()
                if user.is_active:
                    print(f"  ✓ Email verified for user: {user.username}")
                    return True
                else:
                    print(f"  ✗ Email verification failed: user still inactive")
                    return False
            else:
                print(f"  ✗ Email verification failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            if 'DoesNotExist' in str(type(e).__name__):
                print(f"  ✗ User {user_id} not found")
            else:
                print(f"  ✗ Error: {str(e)}")
            return False
        except Exception as e:
            print(f"  ✗ Error verifying email: {str(e)}")
            return False
    
    def get_jwt_token(self, email: str, password: str) -> Optional[str]:
        """Get JWT access token for a user (JWT endpoints use /api/token/)."""
        url = f"{self.server_base}/api/token/"
        data = {
            'username': email,  # JWT endpoint expects email as username
            'password': password
        }
        response = requests.post(url, json=data)
        
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"  ✗ Failed to get JWT token: {response.status_code} - {response.text}")
            return None
    
    def generate_ingredients_list(self, num_ingredients: int = None) -> List[Dict]:
        """Generate a random list of ingredients with valid units."""
        if not self.available_ingredients:
            return []
        
        if num_ingredients is None:
            num_ingredients = random.randint(3, 8)  # 3-8 ingredients per recipe
        
        # Select random ingredients (no duplicates)
        selected_ingredients = random.sample(
            self.available_ingredients, 
            min(num_ingredients, len(self.available_ingredients))
        )
        
        ingredients_list = []
        for ingredient in selected_ingredients:
            # Get allowed units for this ingredient
            # allowed_units is a JSONField, so it returns a list or None/empty list
            allowed_units = ingredient.allowed_units if (ingredient.allowed_units and len(ingredient.allowed_units) > 0) else [ingredient.base_unit]
            
            # Choose a random allowed unit
            unit = random.choice(allowed_units) if allowed_units else ingredient.base_unit
            
            # Generate appropriate quantity based on unit
            if unit == 'pcs':
                quantity = random.randint(1, 5)
            elif unit in ['g', 'ml']:
                quantity = random.randint(50, 500)
            elif unit in ['kg', 'l']:
                quantity = round(random.uniform(0.1, 2.0), 2)
            elif unit in ['tbsp', 'tsp']:
                quantity = random.randint(1, 10)
            elif unit == 'cup':
                quantity = round(random.uniform(0.25, 3.0), 2)
            else:
                quantity = random.randint(1, 5)
            
            ingredients_list.append({
                'ingredient_name': ingredient.name,
                'quantity': quantity,
                'unit': unit
            })
        
        return ingredients_list
    
    def create_recipe(self, token: str, user_id: int) -> Optional[Dict]:
        """Create a recipe via API endpoint with ingredients."""
        # Recipe URLs are at /recipes/, not /api/recipes/
        url = f"{self.server_base}/recipes/"
        headers = {'Authorization': f'Bearer {token}'}
        
        recipe_name = random.choice(RECIPE_NAMES)
        meal_type = random.choice(MEAL_TYPES)
        steps = [
            'Prepare all ingredients',
            'Follow the cooking instructions',
            'Serve and enjoy!'
        ]
        
        # Generate random ingredients for the recipe
        ingredients_list = self.generate_ingredients_list()
        
        data = {
            'name': recipe_name,
            'steps': json.dumps(steps),
            'prep_time': random.randint(5, 30),
            'cook_time': random.randint(10, 60),
            'meal_type': meal_type,
            'ingredients': json.dumps(ingredients_list)  # Include ingredients
        }
        
        # Use multipart format as required by the view
        response = requests.post(url, data=data, headers=headers)
        
        if response.status_code == 201:
            recipe_data = response.json()
            # Handle paginated response
            if 'results' in recipe_data:
                recipe_data = recipe_data['results'][0]
            recipe_id = recipe_data.get('id')
            if recipe_id:
                num_ingredients = len(ingredients_list)
                print(f"  ✓ Created recipe: {recipe_name} (ID: {recipe_id}, {num_ingredients} ingredients)")
                return {'id': recipe_id, 'name': recipe_name}
        else:
            print(f"  ✗ Failed to create recipe: {response.status_code} - {response.text}")
            return None
    
    def create_post(self, token: str) -> Optional[Dict]:
        """Create a forum post via API endpoint."""
        # Forum URLs are at /forum/, not /api/forum/
        url = f"{self.server_base}/forum/posts/"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        title = random.choice(POST_TITLES)
        content = random.choice(POST_CONTENTS)
        tags = random.sample(VALID_TAGS, k=random.randint(1, 3))
        
        data = {
            'title': title,
            'content': content,
            'tags': tags
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 201:
            post_data = response.json()
            post_id = post_data.get('id')
            if post_id:
                print(f"  ✓ Created post: {title} (ID: {post_id})")
                return {'id': post_id, 'title': title}
        else:
            print(f"  ✗ Failed to create post: {response.status_code} - {response.text}")
            return None
    
    def create_comment(self, token: str, post_id: int) -> Optional[Dict]:
        """Create a comment on a post via API endpoint."""
        # Forum URLs are at /forum/, not /api/forum/
        url = f"{self.server_base}/forum/posts/{post_id}/comments/"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        content = random.choice(COMMENT_TEXTS)
        data = {'content': content}
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 201:
            comment_data = response.json()
            comment_id = comment_data.get('id')
            if comment_id:
                print(f"    ✓ Created comment (ID: {comment_id})")
                return {'id': comment_id, 'content': content}
        else:
            print(f"    ✗ Failed to create comment: {response.status_code} - {response.text}")
            return None
    
    def like_recipe(self, user_id: int, recipe_id: int) -> bool:
        """Like a recipe using Django ORM (no endpoint available)."""
        try:
            from api.models import RegisteredUser
            from recipes.models import Recipe, RecipeLike
            
            user = RegisteredUser.objects.get(id=user_id)
            recipe = Recipe.objects.get(id=recipe_id)
            
            # Check if like already exists
            if not RecipeLike.objects.filter(user=user, recipe=recipe).exists():
                RecipeLike.objects.create(user=user, recipe=recipe)
                print(f"  ✓ Liked recipe {recipe_id} as user {user_id}")
                return True
            else:
                print(f"  - Recipe {recipe_id} already liked by user {user_id}")
                return False
        except Exception as e:
            print(f"  ✗ Failed to like recipe: {str(e)}")
            return False
    
    def bookmark_recipe(self, token: str, recipe_id: int) -> bool:
        """Bookmark a recipe via API endpoint."""
        url = f"{self.base_url}/users/bookmark-recipe/"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        data = {'recipe_id': recipe_id}
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            print(f"  ✓ Bookmarked recipe {recipe_id}")
            return True
        else:
            print(f"  ✗ Failed to bookmark recipe: {response.status_code} - {response.text}")
            return False
    
    def rate_recipe(self, token: str, recipe_id: int) -> bool:
        """Rate a recipe via API endpoint."""
        url = f"{self.base_url}/recipe-ratings/"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'recipe_id': recipe_id,
            'taste_rating': round(random.uniform(3.0, 5.0), 1),
            'difficulty_rating': round(random.uniform(1.0, 5.0), 1)
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"  ✓ Rated recipe {recipe_id}")
            return True
        else:
            # User might have already rated this recipe
            if response.status_code == 400:
                print(f"  - Recipe {recipe_id} already rated by this user")
            else:
                print(f"  ✗ Failed to rate recipe: {response.status_code} - {response.text}")
            return False
    
    def vote_post(self, token: str, post_id: int, vote_type: str = 'up') -> bool:
        """Vote on a forum post via API endpoint."""
        # Forum URLs are at /forum/, not /api/forum/
        url = f"{self.server_base}/forum/post/{post_id}/vote/"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        data = {'vote_type': vote_type}
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"  ✓ Voted {vote_type} on post {post_id}")
            return True
        else:
            if response.status_code == 400:
                print(f"  - Post {post_id} already voted by this user")
            else:
                print(f"  ✗ Failed to vote on post: {response.status_code} - {response.text}")
            return False
    
    def vote_comment(self, token: str, comment_id: int, vote_type: str = 'up') -> bool:
        """Vote on a comment via API endpoint."""
        # Forum URLs are at /forum/, not /api/forum/
        url = f"{self.server_base}/forum/comment/{comment_id}/vote/"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        data = {'vote_type': vote_type}
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"    ✓ Voted {vote_type} on comment {comment_id}")
            return True
        else:
            if response.status_code == 400:
                print(f"    - Comment {comment_id} already voted by this user")
            else:
                print(f"    ✗ Failed to vote on comment: {response.status_code} - {response.text}")
            return False


# ============================================
# MAIN POPULATION LOGIC
# ============================================

def populate_database():
    """Main function to populate the database with mock data."""
    print("=" * 70)
    print("POPULATING DATABASE WITH MOCK DATA")
    print("=" * 70)
    print(f"Base URL: {BASE_URL}")
    print(f"Number of users: {NUM_USERS}")
    print("=" * 70)
    print()
    
    generator = MockDataGenerator(BASE_URL)
    print()  # Add spacing after ingredient loading message
    
    # Step 1: Create and register users
    print("STEP 1: Creating and registering users...")
    print("-" * 70)
    
    for i in range(1, NUM_USERS + 1):
        user_data = generator.generate_user_data(i)
        user = generator.register_user(user_data)
        if user:
            generator.users.append(user)
    
    print(f"\n✓ Registered {len(generator.users)} users\n")
    
    # Step 2: Verify user emails (activate users)
    if VERIFY_EMAILS:
        print("STEP 2: Verifying user emails...")
        print("-" * 70)
        
        for user in generator.users:
            generator.verify_email(user['id'])
        
        print(f"\n✓ Verified emails for {len(generator.users)} users\n")
    
    # Step 3: Get JWT tokens for all users
    print("STEP 3: Obtaining JWT tokens...")
    print("-" * 70)
    
    user_tokens = {}
    for user in generator.users:
        token = generator.get_jwt_token(user['email'], user['password'])
        if token:
            user_tokens[user['id']] = token
            print(f"  ✓ Got token for user: {user['username']}")
    
    print(f"\n✓ Obtained {len(user_tokens)} JWT tokens\n")
    
    # Step 4: Create recipes for users
    print("STEP 4: Creating recipes...")
    print("-" * 70)
    
    for user in generator.users:
        if user['id'] not in user_tokens:
            continue
        
        token = user_tokens[user['id']]
        num_recipes = random.randint(2, 4)
        
        print(f"\nCreating recipes for user: {user['username']}")
        for _ in range(num_recipes):
            recipe = generator.create_recipe(token, user['id'])
            if recipe:
                generator.recipes.append(recipe)
    
    print(f"\n✓ Created {len(generator.recipes)} recipes\n")
    
    # Step 5: Create forum posts
    print("STEP 5: Creating forum posts...")
    print("-" * 70)
    
    for user in generator.users:
        if user['id'] not in user_tokens:
            continue
        
        token = user_tokens[user['id']]
        num_posts = random.randint(1, 3)
        
        print(f"\nCreating posts for user: {user['username']}")
        for _ in range(num_posts):
            post = generator.create_post(token)
            if post:
                generator.posts.append(post)
    
    print(f"\n✓ Created {len(generator.posts)} posts\n")
    
    # Step 6: Create comments on posts
    print("STEP 6: Creating comments on posts...")
    print("-" * 70)
    
    for post in generator.posts:
        print(f"\nAdding comments to post: {post['title']} (ID: {post['id']})")
        num_comments = random.randint(2, 5)
        
        # Get random users to comment
        commenters = random.sample([u for u in generator.users if u['id'] in user_tokens], 
                                  min(num_comments, len(generator.users)))
        
        for user in commenters:
            token = user_tokens[user['id']]
            comment = generator.create_comment(token, post['id'])
            if comment:
                generator.comments.append(comment)
    
    print(f"\n✓ Created {len(generator.comments)} comments\n")
    
    # Step 7: Add interactions (likes, bookmarks, ratings)
    print("STEP 7: Adding interactions (likes, bookmarks, ratings)...")
    print("-" * 70)
    
    likes_count = 0
    bookmarks_count = 0
    ratings_count = 0
    
    # Like recipes (using Django ORM)
    print("\nLiking recipes...")
    for recipe in generator.recipes:
        # Random users like this recipe
        num_likes = random.randint(1, min(5, len(generator.users)))
        likers = random.sample(generator.users, num_likes)
        
        for user in likers:
            if generator.like_recipe(user['id'], recipe['id']):
                likes_count += 1
    
    # Bookmark recipes
    print("\nBookmarking recipes...")
    for recipe in generator.recipes:
        # Random users bookmark this recipe
        num_bookmarks = random.randint(1, min(3, len(generator.users)))
        bookmarkers = random.sample([u for u in generator.users if u['id'] in user_tokens], num_bookmarks)
        
        for user in bookmarkers:
            token = user_tokens[user['id']]
            if generator.bookmark_recipe(token, recipe['id']):
                bookmarks_count += 1
    
    # Rate recipes
    print("\nRating recipes...")
    for recipe in generator.recipes:
        # Random users rate this recipe
        num_ratings = random.randint(1, min(4, len(generator.users)))
        raters = random.sample([u for u in generator.users if u['id'] in user_tokens], num_ratings)
        
        for user in raters:
            token = user_tokens[user['id']]
            if generator.rate_recipe(token, recipe['id']):
                ratings_count += 1
    
    print(f"\n✓ Added {likes_count} likes, {bookmarks_count} bookmarks, {ratings_count} ratings\n")
    
    # Step 8: Add votes on posts and comments
    print("STEP 8: Adding votes on posts and comments...")
    print("-" * 70)
    
    post_votes_count = 0
    comment_votes_count = 0
    
    # Vote on posts
    print("\nVoting on posts...")
    for post in generator.posts:
        # Random users vote on this post
        num_votes = random.randint(2, min(6, len(generator.users)))
        voters = random.sample([u for u in generator.users if u['id'] in user_tokens], num_votes)
        
        for user in voters:
            token = user_tokens[user['id']]
            vote_type = random.choice(['up', 'down'])
            if generator.vote_post(token, post['id'], vote_type):
                post_votes_count += 1
    
    # Vote on comments
    print("\nVoting on comments...")
    for comment in generator.comments:
        # Random users vote on this comment
        num_votes = random.randint(1, min(4, len(generator.users)))
        voters = random.sample([u for u in generator.users if u['id'] in user_tokens], num_votes)
        
        for user in voters:
            token = user_tokens[user['id']]
            vote_type = random.choice(['up', 'down'])
            if generator.vote_comment(token, comment['id'], vote_type):
                comment_votes_count += 1
    
    print(f"\n✓ Added {post_votes_count} post votes, {comment_votes_count} comment votes\n")
    
    # Summary
    print("=" * 70)
    print("POPULATION COMPLETE!")
    print("=" * 70)
    print(f"Users created: {len(generator.users)}")
    print(f"Recipes created: {len(generator.recipes)}")
    print(f"Posts created: {len(generator.posts)}")
    print(f"Comments created: {len(generator.comments)}")
    print(f"Recipe likes: {likes_count}")
    print(f"Recipe bookmarks: {bookmarks_count}")
    print(f"Recipe ratings: {ratings_count}")
    print(f"Post votes: {post_votes_count}")
    print(f"Comment votes: {comment_votes_count}")
    print("=" * 70)


if __name__ == "__main__":
    try:
        populate_database()
    except KeyboardInterrupt:
        print("\n\nScript interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

