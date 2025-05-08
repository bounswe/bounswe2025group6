# 📘 Forum Post Comments API Documentation

This document describes how to use the Forum API comments endpoints, which is used for creating, retrieving, updating, and deleting posts in the forum.

---

## ⚙️ Forum Post Comments Model Schema

```json
{
  "id": 26,
  "content": "Hello, this is a comment",
  "author": 1,
  "upvote_count": 0,
  "downvote_count": 0,
  "reported_count": 0,
  "created_at": "2025-05-08T16:46:02.817075Z",
  "updated_at": "2025-05-08T16:46:02.817163Z",
  "deleted_on": null
}
```

### Fields
- `id`: Unique identifier for the ingredient (integer).
- `content`: Content of the comment (string).
- `author`: ID of the user who created the comment (integer).
- `upvote_count`: Number of upvotes for the comment (integer).
- `downvote_count`: Number of downvotes for the comment (integer).
- `reported_count`: Number of times the comment has been reported (integer).
- `created_at`: Timestamp of when the post was created (datetime).
- `updated_at`: Timestamp of when the post was last updated (datetime).
- `deleted_on`: Timestamp of when the post was deleted (datetime, nullable).


## 📍 Endpoints

### 1. **POST** `/forum/posts/<post_id>/comments/`

#### 🔍 Request Format

```json
{
  "content": "Hello, this is a comment"
}
```
- **Note:** The `post_id` parameter is required in the URL path. The `content` field is required in the request body.

#### 📦 Response Format (If success)
```json
{
  "id": 26,
  "content": "Hello, this is a comment",
  "author": 1,
  "upvote_count": 0,
  "downvote_count": 0,
  "reported_count": 0,
  "created_at": "2025-05-08T16:46:02.817075Z",
  "updated_at": "2025-05-08T16:46:02.817163Z",
  "deleted_on": null
}
```

#### 📦 Response Format (If failure)
```json
{
  "detail": {
    "non_field_errors": [
      "Cannot comment on a deleted post."
    ]
  }
}
```
- Status code: 404 Not Found
```json
{
  "detail": {
    "non_field_errors": [
      "Cannot comment on a non-commentable post."
    ]
  }
}
```
- Status code: 403 Forbidden


### 2. **GET** `/forum/posts/<post_id>/comments/`

#### 🔍 Request Format

```json
{
  "page": 1,
  "page_size": 10
}
```

- **Note:** The `post_id` parameter is required in the URL path. The `page` and `page_size` fields are optional in the request body.

#### 📦 Response Format
```json
{
  "page": 1,
  "page_size": 10,
  "total": 4,
  "results": [
    {
      "id": 27,
      "content": "Comment 4",
      "author": 1,
      "upvote_count": 0,
      "downvote_count": 0,
      "reported_count": 0,
      "created_at": "2025-05-08T16:49:43.194146Z",
      "updated_at": "2025-05-08T16:49:43.194187Z",
      "deleted_on": null
    },
    {
      "id": 28,
      "content": "Comment 3",
      "author": 1,
      "upvote_count": 0,
      "downvote_count": 0,
      "reported_count": 0,
      "created_at": "2025-05-08T16:49:45.103160Z",
      "updated_at": "2025-05-08T16:49:45.103192Z",
      "deleted_on": null
    },
    {
      "id": 29,
      "content": "Comment 2",
      "author": 1,
      "upvote_count": 0,
      "downvote_count": 0,
      "reported_count": 0,
      "created_at": "2025-05-08T16:49:46.943216Z",
      "updated_at": "2025-05-08T16:49:46.943254Z",
      "deleted_on": null
    },
    {
      "id": 30,
      "content": "Comment 1",
      "author": 1,
      "upvote_count": 0,
      "downvote_count": 0,
      "reported_count": 0,
      "created_at": "2025-05-08T16:49:49.842595Z",
      "updated_at": "2025-05-08T16:49:49.842615Z",
      "deleted_on": null
    }
  ]
}
```

- **Note:** Returns ordered by `created_at` in descending order. New comments appear first.


### 3. **GET** `/forum/posts/{post_id}/comments/{comment_id}/`

#### 🔍 Request Format

- Nothing required as a request body, just the URL with the post ID and comment ID.

- **Note:** The `post_id` and `comment_id` parameters are required in the URL path.

#### 📦 Response Format
```json
{
  "id": 28,
  "content": "Comment 3",
  "author": 1,
  "upvote_count": 0,
  "downvote_count": 0,
  "reported_count": 0,
  "created_at": "2025-05-08T16:49:45.103160Z",
  "updated_at": "2025-05-08T16:49:45.103192Z",
  "deleted_on": null
}
```


### 5. **DELETE** `/forum/posts/{post_id}/comments/{comment_id}/`

#### 🔍 Request Format

Nothing required as a request body, just the URL with the post ID.

- **Note:** The `id` parameter is required in the URL path.

#### 📦 Response Format
- Nothing, just a 204 No Content response.


### 6. **POST** `/forum/comments/{comment_id}/vote/`
#### 🔍 Request Format

```json
{
  "vote_type": "up"
}
```

- **Note:** The `comment_id` parameter is required in the URL path. The `vote_type` field is required in the request body.
- **Note:** The `vote_type` can be either `up` or `down`.

#### 📦 Response Format
```json
{
  "message": "Vote recorded successfully!"
}
```

- **Note:** The response will contain a message indicating the success of the operation. And the status code will be 201 Created.

### 7. **DELETE** `/forum/comments/{comment_id}/vote/`

#### 🔍 Request Format
- Nothing required as a request body, just the URL with the comment ID.
- **Note:** The `comment_id` parameter is required in the URL path.

#### 📦 Response Format

- Nothing, just a 204 No Content response.

#### 🔒 Permissions
- Authentication is required for all endpoints. Please refer to jwt token documentation for details.

#### 🔗 Related
- Related model: Forum Post Comments (inherits from TimestampedModel, PostModel)
- Will be used in: forum app for creating and managing forum post comments.

### Quick Reminder:
- It's almost certain that I've made some mistakes or inconsistencies in the above documentation. Please review our swagger documentation and the code itself to ensure everything is accurate and up-to-date. If you find any discrepancies, please correct the documentation accordingly. Thank you for your understanding and cooperation!
- You can easily find the working endpoints and their request/response formats in the swagger documentation. Just run backend locally and go to `http://127.0.0.1:8000/swagger/` to access the swagger UI. You can also use the Postman collection provided in the repository for testing the endpoints but I strongly suggest using the swagger UI for better understanding and testing.