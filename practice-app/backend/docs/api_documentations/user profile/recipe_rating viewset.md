# Recipe Rating API Documentation

## Endpoint Overview
Provides CRUD operations for recipe ratings. All endpoints require authentication.

- **Base URL**: `/recipe-ratings/`
- **Authentication**: JWT Token Required
- **Permissions**: 
  - `IsAuthenticated` (All operations)
  - User can only modify their own ratings

## Available Endpoints

### List All Ratings
- **URL**: `/recipe-ratings/`
- **Method**: `GET`
- **Description**: List all ratings (filtered to current user's ratings in frontend)

#### Example Response (200 OK)
```json
[
    {
        "id": 1,
        "user": 42,
        "recipe_id": 101,
        "recipe_title": "Tomato Sandwich",
        "taste_rating": 4.5,
        "difficulty_rating": 3.0,
        "timestamp": "2024-03-15T14:30:00Z"
    }
]


### Create New Rating

-   **URL**: `/recipe-ratings/`
    
-   **Method**: `POST`
    
-   **Description**: Submit a new recipe rating
    

#### Request Body

Parameter

Type

Description

Required

`recipe_id`

integer

ID of recipe being rated

Yes

`taste_rating`

float

Taste rating (0.0-5.0)

No*

`difficulty_rating`

float

Difficulty rating (0.0-5.0)

No*

*At least one rating must be provided

#### Example Request

    {
        "recipe_id": 101,
        "taste_rating": 4.5,
        "difficulty_rating": 3.0
    }
#### Success Response (201 Created)

    {
        "id": 1,
        "user": 42,
        "recipe_id": 101,
        "recipe_title": "Tomato Sandwich",
        "taste_rating": 4.5,
        "difficulty_rating": 3.0,
        "timestamp": "2024-03-15T14:30:00Z"
    }
### Retrieve Single Rating

-   **URL**: `/recipe-ratings/<id>/`
    
-   **Method**: `GET`
    

#### Example Response (200 OK)

    {
        "id": 1,
        "user": 42,
        "recipe_id": 101,
        "recipe_title": "Tomato Sandwich",
        "taste_rating": 4.5,
        "difficulty_rating": 3.0,
        "timestamp": "2024-03-15T14:30:00Z"
    }

### Update Rating

-   **URL**: `/recipe-ratings/<id>/`
    
-   **Method**: `PUT`/`PATCH`
    
-   **Notes**:
    
    -   User can only update their own ratings
        
    -   At least one rating field must be provided
        

#### Example PATCH Request

    {
        "taste_rating": 5.0
    }

### Delete Rating

-   **URL**: `/recipe-ratings/<id>/`
    
-   **Method**: `DELETE`
    
-   **Success Response**: 204 No Content
    

## Error Responses

**400 Bad Request** (Validation errors)

    {
        "taste_rating": ["Ensure this value is less than or equal to 5.0."]
    }
**401 Unauthorized**

    {
        "detail": "Authentication credentials were not provided."
    }
**403 Forbidden** (When trying to modify another user's rating)

    {
        "detail": "You do not have permission to perform this action."
    }
**404 Not Found**

    {
        "detail": "Not found."
    }

## Example Usage

### cURL (Create Rating)

    curl -X POST \
      http://localhost:8000/recipe-ratings/ \
      -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
      -H 'Content-Type: application/json' \
      -d '{
        "recipe_id": 101,
        "taste_rating": 4.5,
        "difficulty_rating": 3.0
      }'
## Rules

1.  Users can only CRUD their own ratings
    
2.  Each user can have only one rating per recipe
    
3.  Ratings must be between 0.0 and 5.0
    
4.  At least one rating field must be provided for creation/update
    
5.  Timestamps are automatically managed
