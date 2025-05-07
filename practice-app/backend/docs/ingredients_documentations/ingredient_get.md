# 📘 Ingredient API Documentation

This document describes how to use the Ingredient API endpoint, which is a read-only endpoint for retrieving ingredient data used in recipes.

---

## ⚙️ Ingredient Model Schema

```json
{
  "id": 3,
  "created_at": "2025-05-03T22:02:12Z",
  "updated_at": "2025-05-03T22:02:12Z",
  "deleted_on": null,
  "name": "Ground Beef",
  "category": "proteins",
  "allergens": [],
  "dietary_info": [
    "high-protein"
  ]
}
```

### Fields
- `id`: Unique identifier for the ingredient (integer).
- `name`: Name of the ingredient (string).
- `category`: Category of the ingredient (string).
- `allergens`: List of allergens associated with the ingredient (array of strings).
- `dietary_info`: List of dietary information (e.g., vegan, gluten-free) (array of strings).
- `created_at`: Timestamp of when the ingredient was created (datetime).
- `updated_at`: Timestamp of when the ingredient was last updated (datetime).
- `deleted_on`: Timestamp of when the ingredient was deleted (datetime, nullable).

## 📍 Endpoints

### 1. **GET** `/ingredients/<int:pk>/`

- Returns a single ingredient object based on the provided ID.
- Only `GET` requests are allowed (read-only access).
- Useful for recipe creation, where users must select from existing ingredients.

#### 🔍 Request Format
```json
{
  "id": 3
}
```

- Must be provided:
  - `id`: The ID of the ingredient you want to retrieve.

#### 📦 Response Format
```json
{
  "id": 3,
  "created_at": "2025-05-03T22:02:12Z",
  "updated_at": "2025-05-03T22:02:12Z",
  "deleted_on": null,
  "name": "Ground Beef",
  "category": "proteins",
  "allergens": [],
  "dietary_info": [
    "high-protein",
    "gluten-free"
  ]
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
  "page_size": 10
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
  "page_size": 10,
  "count": 47,
  "total_pages": 5,
  "results": [
    {
      "id": 1,
      "created_at": "2025-05-03T22:02:12Z",
      "updated_at": "2025-05-03T22:02:12Z",
      "deleted_on": null,
      "name": "Chicken Breast",
      "category": "proteins",
      "allergens": [],
      "dietary_info": [
        "high-protein"
      ]
    },
    {
      "id": 2,
      "created_at": "2025-05-03T22:02:12Z",
      "updated_at": "2025-05-03T22:02:12Z",
      "deleted_on": null,
      "name": "Salmon Fillet",
      "category": "proteins",
      "allergens": [
        "fish"
      ],
      "dietary_info": [
        "omega-3",
        "keto-friendly"
      ]
    },
    {
      "id": 3,
      "created_at": "2025-05-03T22:02:12Z",
      "updated_at": "2025-05-03T22:02:12Z",
      "deleted_on": null,
      "name": "Ground Beef",
      "category": "proteins",
      "allergens": [],
      "dietary_info": [
        "high-protein"
      ]
    },
    ...,
    {
      "id": 10,
      "created_at": "2025-05-03T22:02:12Z",
      "updated_at": "2025-05-03T22:02:12Z",
      "deleted_on": null,
      "name": "Sweet Potato",
      "category": "vegetables",
      "allergens": [],
      "dietary_info": [
        "gluten-free",
        "vegan"
      ]
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
  "id": 3,
  "created_at": "2025-05-03T22:02:12Z",
  "updated_at": "2025-05-03T22:02:12Z",
  "deleted_on": null,
  "name": "Ground Beef",
  "category": "proteins",
  "allergens": [],
  "dietary_info": [
    "high-protein"
  ]
}
```

#### 🔒 Permissions
- No authentication is required.
- Read-only access: GET only. POST, PUT, PATCH, and DELETE are not allowed.

#### 🔗 Related
- Related model: Ingredient (inherits from TimestampedModel)
- Will be used in: recipes app for creating and managing recipes ingredients.