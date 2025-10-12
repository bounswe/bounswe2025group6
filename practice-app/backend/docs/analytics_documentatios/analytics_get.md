# 📘 Analytics API Documentation

This document describes how to use the Analytics API endpoint, which is used to retrieve basic anonymized system-level statistics such as counts of users, recipes, ingredients, forum posts, and comments.

---

## ⚙️ Analytics Model Schema

```json
{
  "users_count": 42,
  "recipes_count": 10,
  "ingredients_count": 25,
  "posts_count": 15,
  "comments_count": 37
}
```
    
### Fields
    
- users_count: Total number of registered users (integer, anonymized).
- recipes_count: Total number of recipes in the system (integer).
- ingredients_count: Total number of ingredients in the system (integer).
- posts_count: Total number of forum posts (integer).
- comments_count: Total number of forum post comments (integer).


##  📍 Endpoint
### 1. GET /api/analytics/
#### 🔍 Request Format

Nothing required in the request body.

This is a simple GET request.

#### 📦 Response Format (200 OK)
```
{
  "users_count": 42,
  "recipes_count": 10,
  "ingredients_count": 25,
  "posts_count": 15,
  "comments_count": 37
}
```

Note: All counts are aggregated. No personal user data is exposed.
Note: This endpoint is read-only and returns system-level analytics in a fully anonymized way.

#### 📦 Response Format (If failure)
```
{
    "detail": "Internal Server Error"
}
```

Status code: 500 Internal Server Error (if something goes wrong on the server)