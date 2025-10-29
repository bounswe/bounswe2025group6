# Health Rating ViewSet

This viewset manages health ratings given by dietitians to recipes. Only registered users with the dietitian role can create, update, or delete health ratings.

## Endpoints

### List Health Ratings [GET /api/health-ratings/]
Returns a list of all health ratings created by the authenticated dietitian.

**Permissions:**
- Must be authenticated
- Must have dietitian role

**Response (200 OK):**
```json
[
    {
        "id": 1,
        "dietitian": 2,
        "recipe": 5,
        "health_score": 4,
        "comment": "Good nutritional balance",
        "timestamp": "2025-10-27T14:30:00Z"
    }
]
```

### Create Health Rating [POST /api/health-ratings/]
Create a new health rating for a recipe. Each dietitian can only give one health rating per recipe.

**Permissions:**
- Must be authenticated
- Must have dietitian role

**Request Body:**
```json
{
    "recipe": 5,
    "health_score": 4,
    "comment": "Good nutritional balance"
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "dietitian": 2,
    "recipe": 5,
    "health_score": 4,
    "comment": "Good nutritional balance",
    "timestamp": "2025-10-27T14:30:00Z"
}
```

### Update Health Rating [PUT /api/health-ratings/{id}/]
Replace an existing health rating.

**Permissions:**
- Must be authenticated
- Must have dietitian role
- Must be the creator of the rating

**Request Body:**
```json
{
    "recipe": 5,
    "health_score": 3,
    "comment": "Updated nutritional assessment"
}
```

**Response (200 OK):**
```json
{
    "id": 1,
    "dietitian": 2,
    "recipe": 5,
    "health_score": 3,
    "comment": "Updated nutritional assessment",
    "timestamp": "2025-10-27T14:30:00Z"
}
```

### Delete Health Rating [DELETE /api/health-ratings/{id}/]
Remove a health rating.

**Permissions:**
- Must be authenticated
- Must have dietitian role
- Must be the creator of the rating

**Response (204 No Content)**

## Business Rules

1. Only users with the dietitian role can create/update/delete health ratings
2. Each dietitian can give only one health rating per recipe
3. Health scores must be between 0.0 and 5.0
4. Recipe's average health rating is automatically updated when:
   - A new rating is created
   - An existing rating is updated
   - A rating is deleted
5. Comments are optional

## Error Responses

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "Only dietitians can give health ratings."
}
```

### 400 Bad Request
```json
{
    "health_score": ["Ensure this value is less than or equal to 5.0."]
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```