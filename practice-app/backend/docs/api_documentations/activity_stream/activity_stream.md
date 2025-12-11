# Activity Stream API Documentation

## Overview

The Activity Stream endpoint provides a unified feed of all activities from users that the authenticated user follows. This includes recipe creations, forum posts, comments, questions, and answers.

## Endpoint

```
GET /api/activity-stream/
```

## Authentication

**Required**: Bearer token authentication

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number for pagination (default: 1) |
| `page_size` | integer | No | Number of items per page (default: 20, max: 100) |
| `activity_type` | string | No | Filter by activity type. Options: `recipe`, `post`, `comment`, `question`, `answer` |

## Response Format

### Success Response (200 OK)

```json
{
  "page": 1,
  "page_size": 20,
  "total": 150,
  "results": [
    {
      "activity_type": "recipe",
      "activity_id": 123,
      "user_id": 45,
      "user_username": "chef_john",
      "user_profile_photo": "https://cloudinary.com/image.jpg",
      "timestamp": "2024-01-15T10:30:00Z",
      "title": "Pasta Carbonara",
      "content": "Created recipe: Pasta Carbonara",
      "target_id": 123,
      "target_title": "Pasta Carbonara",
      "metadata": {
        "meal_type": "dinner",
        "prep_time": 15,
        "cook_time": 20
      }
    },
    {
      "activity_type": "post",
      "activity_id": 456,
      "user_id": 45,
      "user_username": "chef_john",
      "user_profile_photo": "https://cloudinary.com/image.jpg",
      "timestamp": "2024-01-15T09:20:00Z",
      "title": "Tips for meal prep",
      "content": "Here are some great tips for meal preparation...",
      "target_id": 456,
      "target_title": "Tips for meal prep",
      "metadata": {
        "tags": ["meal-prep", "tips"],
        "upvote_count": 15,
        "downvote_count": 2
      }
    },
    {
      "activity_type": "comment",
      "activity_id": 789,
      "user_id": 67,
      "user_username": "foodie_sarah",
      "user_profile_photo": "https://cloudinary.com/image2.jpg",
      "timestamp": "2024-01-15T08:15:00Z",
      "title": "Commented on: Tips for meal prep",
      "content": "Great advice! I tried this and it worked perfectly...",
      "target_id": 456,
      "target_title": "Tips for meal prep",
      "metadata": {
        "post_id": 456,
        "level": 0,
        "upvote_count": 5
      }
    }
  ]
}
```

### Activity Types

#### 1. Recipe (`recipe`)
Activities when a followed user creates a new recipe.

**Metadata:**
- `meal_type`: Type of meal (breakfast, lunch, dinner)
- `prep_time`: Preparation time in minutes
- `cook_time`: Cooking time in minutes

#### 2. Forum Post (`post`)
Activities when a followed user creates a forum post.

**Metadata:**
- `tags`: Array of tags associated with the post
- `upvote_count`: Number of upvotes
- `downvote_count`: Number of downvotes

#### 3. Forum Comment (`comment`)
Activities when a followed user comments on a forum post.

**Metadata:**
- `post_id`: ID of the post being commented on
- `level`: Nesting level of the comment (0 = top-level)
- `upvote_count`: Number of upvotes on the comment

#### 4. Question (`question`)
Activities when a followed user asks a question.

**Metadata:**
- `tags`: Array of tags associated with the question
- `upvote_count`: Number of upvotes
- `downvote_count`: Number of downvotes

#### 5. Answer (`answer`)
Activities when a followed user answers a question.

**Metadata:**
- `question_id`: ID of the question being answered
- `level`: Nesting level (usually 0 for answers)
- `upvote_count`: Number of upvotes on the answer

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Empty Results
If the user is not following anyone, an empty paginated response is returned:
```json
{
  "page": 1,
  "page_size": 20,
  "total": 0,
  "results": []
}
```

## Examples

### Get all activities from followed users
```bash
curl -X GET "https://api.example.com/api/activity-stream/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get only recipe activities
```bash
curl -X GET "https://api.example.com/api/activity-stream/?activity_type=recipe" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get paginated activities
```bash
curl -X GET "https://api.example.com/api/activity-stream/?page=2&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get only forum posts and comments
```bash
# Get posts
curl -X GET "https://api.example.com/api/activity-stream/?activity_type=post" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get comments
curl -X GET "https://api.example.com/api/activity-stream/?activity_type=comment" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Notes

1. **Sorting**: Activities are sorted by timestamp in descending order (most recent first).

2. **Soft Deletes**: Deleted items (soft-deleted with `deleted_on` set) are excluded from the activity stream.

3. **Performance**: The endpoint efficiently queries only activities from followed users and excludes soft-deleted content.

4. **Following Activities**: Currently, the activity stream does not track when a user follows someone else, as this would require a separate Activity model with timestamps. If needed, this can be added in the future.

5. **Content Truncation**: Long content fields (like post/comment/answer content) are truncated to 200 characters for preview purposes in the activity stream.

## Implementation Details

- Activities are aggregated from multiple models: `Recipe`, `ForumPost`, `ForumPostComment`, `Question`, `Answer`
- All queries use `select_related()` for efficient database access
- Pagination uses the standard pagination utility
- The endpoint filters out soft-deleted content automatically

