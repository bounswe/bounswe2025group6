# Database Population Guide

All commands should be run from the `backend/fithub` directory.

## Step 1: Clear Database (if needed)

To clear all recipes and ingredients from the database:

```bash
python manage.py dbshell << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE recipes_recipeingredient;
TRUNCATE TABLE recipes_recipelike;
TRUNCATE TABLE api_reciperating;
TRUNCATE TABLE recipes_recipe;
TRUNCATE TABLE ingredients_wikidatainfo;
TRUNCATE TABLE ingredients_ingredient;
SET FOREIGN_KEY_CHECKS = 1;
EOF
```

## Step 2: Load Ingredients

1. Connect to MySQL:
   ```bash
   mysql -u root -p
   ```

2. Enter your password when prompted

3. Copy and paste the contents of `all_ingredients.sql` and press Enter

4. Exit MySQL:
   ```bash
   exit
   ```

## Step 3: Create Recipes for User

**Important:** Edit the `USER_ID` variable in `create_recipes_for_user.py` before running.

Then run:

```bash
python ../populate_db_sqls/create_recipes_for_user.py
```

This will create 10 recipes for the specified user with all ingredients, steps, and images (if available).

## Clear Recipes Only

To clear only recipes (keeping ingredients):

```bash
python3 manage.py dbshell << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE recipes_recipeingredient;
TRUNCATE TABLE recipes_recipelike;
TRUNCATE TABLE api_reciperating;
TRUNCATE TABLE recipes_recipe;
SET FOREIGN_KEY_CHECKS = 1;
EOF
```

