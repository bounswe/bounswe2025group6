# 📘 Ingredient API Documentation

This document describes how to use the Ingredient API endpoint, which is a read-only endpoint for retrieving ingredient data used in recipes.

---

## ⚙️ Ingredient Model Schema

```json
{
  "id": 222,
  "created_at": "2025-10-16T21:02:31Z",
  "updated_at": "2025-10-16T21:02:31Z",
  "deleted_on": null,
  "name": "Coconut Oil",
  "category": "oils_and_fats",
  "allergens": [],
  "dietary_info": [
    "healthy-fat",
    "vegan"
  ],
  "base_unit": "ml",
  "base_quantity": "100.00",
  "allowed_units": [
    "ml",
    "l",
    "tbsp"
  ],
  "prices": {
    "currency": "USD",
    "A101": 0.45,
    "SOK": 0.42,
    "BIM": 0.41,
    "MIGROS": 0.47
  }
}
```

### Fields
- `id`: Unique identifier for the ingredient (integer).
- `created_at`: Timestamp when the ingredient was created (ISO 8601 string).
- `updated_at`: Timestamp when the ingredient was last updated (ISO 8601 string).
- `deleted_on`: Timestamp when the ingredient was deleted, if applicable (ISO 8601 string or null).
- `name`: Name of the ingredient (string).
- `category`: Category of the ingredient (string).
- `allergens`: List of allergens associated with the ingredient (array of strings).
- `dietary_info`: List of dietary information (e.g., vegan, gluten-free) (array of strings).
- `base_unit`: The base measurement unit for the ingredient (string).
- `base_quantity`: The base quantity for the ingredient (decimal).
- `allowed_units`: List of allowed measurement units for the ingredient (array of strings).
- `prices`: An object containing price information across different stores (object). Can also be in TRY currency and will have automatically converted prices for other currencies. For example if the base currency is TRY, the prices object will look like this:
```json
{
  "currency": "TRY",
  "A101": 18.00,
  "SOK": 16.80,
  "BIM": 16.40,
  "MIGROS": 18.80
}
```

## 📍 Endpoints

### 1. **GET** `/ingredients/<int:pk>/`

- Returns a single ingredient object based on the provided ID.
- Only `GET` requests are allowed (read-only access).
- Useful for recipe creation, where users must select from existing ingredients.

#### 🔍 Request Format
```json
{
  "id": 222
}
```

- Must be provided:
  - `id`: The ID of the ingredient you want to retrieve.

#### 📦 Response Format
```json
{
  "id": 222,
  "created_at": "2025-10-16T21:02:31Z",
  "updated_at": "2025-10-16T21:02:31Z",
  "deleted_on": null,
  "name": "Coconut Oil",
  "category": "oils_and_fats",
  "allergens": [],
  "dietary_info": [
    "healthy-fat",
    "vegan"
  ],
  "base_unit": "ml",
  "base_quantity": "100.00",
  "allowed_units": [
    "ml",
    "l",
    "tbsp"
  ],
  "prices": {
    "currency": "USD",
    "A101": 0.45,
    "SOK": 0.42,
    "BIM": 0.41,
    "MIGROS": 0.47
  }
}
```


### 2. **GET** `/ingredients/`
- Returns a list of all ingredients.
- Supports pagination.
- Useful for displaying all available ingredients in a dropdown or selection list.

---
#### 🔍 Request Format

```json
{
  "page": 1,
  "page_size": 5
}
```

- Must be provided:
  - None (optional parameters for pagination).
- Optional:
  - `page`: The page number to retrieve (default is 1).
  - `page_size`: The number of items to return per page (default is 10).

#### 📦 Response Format
```json
{
  "page": 1,
  "page_size": 5,
  "count": 86,
  "total_pages": 18,
  "results": [
    {
      "id": 207,
      "name": "Almond Milk",
      "category": "dairy",
      "allergens": [
        "nuts"
      ],
      "dietary_info": [
        "vegan",
        "gluten-free"
      ],
      "base_unit": "ml",
      "base_quantity": "1000.00",
      "allowed_units": [
        "ml",
        "l",
        "cup",
        "tbsp",
        "tsp"
      ],
      "prices": {
        "currency": "USD",
        "A101": 2.5,
        "SOK": 2.4,
        "BIM": 2.3,
        "MIGROS": 2.6
      }
    }, // here there will be 3 more ingredients
    {
      "id": 211,
      "name": "Basil",
      "category": "herbs_and_spices",
      "allergens": [],
      "dietary_info": [
        "vegan"
      ],
      "base_unit": "g",
      "base_quantity": "10.00",
      "allowed_units": [
        "g",
        "kg"
      ],
      "prices": {
        "currency": "USD",
        "A101": 0.5,
        "SOK": 0.45,
        "BIM": 0.4,
        "MIGROS": 0.55
      }
    }
  ]
}
```
### 3. **GET** `/ingredients/get-id-by-name/``
- Returns the ingredient id that match the provided name. (Only one ingredient is possible, name unique)
- Useful for searching for a specific ingredient by name.
- Should be used when we want to create a new recipe and need to learn the ID of the ingredient.

#### 🔍 Request Format
```json
{
  "page": 1,
  "page_size": 10,
  "name": "Ground Beef"
}
```

- Must be provided:
  - `name`: The name of the ingredient you want to retrieve.
- Optional:
  - `page`: The page number to retrieve (default is 1).
  - `page_size`: The number of items to return per page (default is 10).
  - **Note:** The `page` and `page_size` parameters are written to code easier, we will never use these parameters in the frontend. You can get the wanted id with only giving the name field.

#### 📦 Response Format
```json
{
  "id": 3
}
```

### 4. **GET** `/ingredients/get-ingredient-by-name/`
- Returns the ingredient that match the provided name. (Only one ingredient is possible, name unique)
- Useful for searching for a specific ingredient by name. (Gives all fields of the ingredient)
- Should be used when we want to create a new recipe and need to learn the ingredient information.

#### 🔍 Request Format
```json
{
  "page": 1,
  "page_size": 10,
  "name": "Eggs"
}
```

- Must be provided:
  - `name`: The name of the ingredient you want to retrieve.

- Optional:
  - `page`: The page number to retrieve (default is 1).
  - `page_size`: The number of items to return per page (default is 10).
  - **Note:** The `page` and `page_size` parameters are written to code easier, we will never use these parameters in the frontend. You can get the wanted id with only giving the name field.

#### 📦 Response Format
```json
{
  "id": 225,
  "created_at": "2025-10-16T21:02:31Z",
  "updated_at": "2025-10-16T21:02:31Z",
  "deleted_on": null,
  "name": "Eggs",
  "category": "proteins",
  "allergens": [
    "egg"
  ],
  "dietary_info": [
    "high-protein",
    "gluten-free"
  ],
  "base_unit": "pcs",
  "base_quantity": "1.00",
  "allowed_units": [
    "pcs"
  ],
  "prices": {
    "currency": "USD",
    "A101": 0.2,
    "SOK": 0.23,
    "BIM": 0.23,
    "MIGROS": 0.26
  }
}
```

#### 🔒 Permissions
- No authentication is required.
- Read-only access: GET only. POST, PUT, PATCH, and DELETE are not allowed.

#### 🔗 Related
- Related model: Ingredient (inherits from TimestampedModel)
- Will be used in: recipes app for creating and managing recipes ingredients.

### Quick Reminder:
- It's almost certain that I've made some mistakes or inconsistencies in the above documentation. Please review our swagger documentation and the code itself to ensure everything is accurate and up-to-date. If you find any discrepancies, please correct the documentation accordingly. Thank you for your understanding and cooperation!
- You can easily find the working endpoints and their request/response formats in the swagger documentation. Just run backend locally and go to `http://127.0.0.1:8000/swagger/` to access the swagger UI. You can also use the Postman collection provided in the repository for testing the endpoints but I strongly suggest using the swagger UI for better understanding and testing.