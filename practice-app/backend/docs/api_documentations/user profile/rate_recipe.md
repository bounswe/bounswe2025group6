# Rate Recipe API Documentation

## Endpoint Overview
Allows authenticated users to submit ratings for recipes. Each user can rate a recipe only once.

- **URL**: `/users/rate_recipe/`
- **Method**: `POST`
- **Authentication**: JWT Token Required

## Request

### Headers
| Key | Value | Required |
|-----|-------|----------|
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes |

### Body Parameters
| Parameter | Type | Description | Required | Constraints |
|-----------|------|-------------|----------|-------------|
| `recipe_id` | integer | ID of the recipe being rated | Yes | Must exist |
| `taste_rating` | float | Rating for taste (0.0-5.0) | No* | 0.0 ≤ value ≤ 5.0 |
| `difficulty_rating` | float | Rating for difficulty (0.0-5.0) | No* | 0.0 ≤ value ≤ 5.0 |

*At least one of the rating fields must be provided

### Example Request
```json
{
    "recipe_id": 42,
    "taste_rating": 4.5,
    "difficulty_rating": 3.0
}

## Response

### Success (200 OK)

    {
        "status": "rating saved"
    }


### Error Responses

**400 Bad Request** (Validation errors)

    {
        "error": "You have already rated this recipe."
    }

    {
        "taste_rating": ["Ensure this value is less than or equal to 5.0."]
    }

**401 Unauthorized**

    {
        "detail": "Authentication credentials were not provided."
    }
    
**404 Not Found** (When recipe doesn't exist)

    {
        "error": "Recipe not found"
    }

## Example Usage

### cURL

    curl -X POST \
      http://localhost:8000/users/rate_recipe/ \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
      -H 'Content-Type: application/json' \
      -d '{
        "recipe_id": 42,
        "taste_rating": 4.5,
        "difficulty_rating": 3.0
      }'

## Rules

1.  Each user can rate a recipe only once
    
2.  Ratings must be between 0.0 and 5.0 (inclusive)
    
3.  At least one rating fields (taste or difficulty) must be provided
    
4.  The authenticated user will be automatically associated with the rating
    
5.  Recipe statistics (average ratings) are updated automatically

