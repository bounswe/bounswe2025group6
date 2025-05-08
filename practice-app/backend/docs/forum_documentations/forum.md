# 📘 Forum API Documentation

This document describes how to use the Forum API endpoint, which is used for creating, retrieving, updating, and deleting posts in the forum.

---

## ⚙️ Forum Post Model Schema

```json
{
  "id": 45,
  "title": "Sample Post Title",
  "content": "This is a sample content for the forum post.",
  "is_commentable": true,
  "author": 1,
  "view_count": 0,
  "upvote_count": 0,
  "downvote_count": 0,
  "tags": [
    "Healthy",
    "Quick"
  ],
  "created_at": "2025-05-08T17:24:04.561597Z",
  "updated_at": "2025-05-08T17:24:04.563531Z",
  "deleted_on": null
}
```

```json
TagChoices:
`Budget', 'Meal Prep',  'Family', 'No Waste',
'Sustainability', 'Tips', 'Gluten Free',
'Vegan', 'Vegetarian', 'Quick',
'Healthy', 'Student', 'Nutrition',
`Healthy Eating', 'Snacks
```

### Fields
- `id`: Unique identifier for the ingredient (integer).
- `title`: Title of the post (string).
- `content`: Content of the post (string).
- `is_commentable`: Indicates if the post can be commented on (boolean).
- `author`: ID of the author (integer).
- `view_count`: Number of views (integer). (updated on each detailed get request to that post)
- `upvote_count`: Number of upvotes (integer).
- `downvote_count`: Number of downvotes (integer).
- `tags`: List of tags associated with the post (array of strings) (enum)
- `created_at`: Timestamp of when the post was created (datetime).
- `updated_at`: Timestamp of when the post was last updated (datetime).
- `deleted_on`: Timestamp of when the post was deleted (datetime, nullable).


## 📍 Endpoints

### 1. **POST** `/forum/posts/`

#### 🔍 Request Format

```json
{
  "title": "Sample Post Title",
  "content": "This is a sample content for the forum post.",
  "is_commentable": true,
  "tags": [
    "Healthy",
    "Quick"
  ]
}
```

- **Note:**: The `is_commentable` and `tags` fields are optional. If not provided, `is_commentable` defaults to `false`, and `tags` defaults to an empty list. All other fields are required.

#### 📦 Response Format
```json
{
  "id": 45,
  "title": "Sample Post Title",
  "content": "This is a sample content for the forum post.",
  "is_commentable": true,
  "author": 1,
  "view_count": 0,
  "upvote_count": 0,
  "downvote_count": 0,
  "tags": [
    "Healthy",
    "Quick"
  ],
  "created_at": "2025-05-08T17:24:04.561597Z",
  "updated_at": "2025-05-08T17:24:04.563531Z",
  "deleted_on": null
}
```

### 2. **GET** `/forum/posts/`

#### 🔍 Request Format

```json
{
  "page": 1,
  "page_size": 10
}
```

- **Note:** The `page` and `page_size` parameters are optional. If not provided, the default values are `1` and `10`, respectively.

#### 📦 Response Format
```json
{
  "page": 1,
  "page_size": 3,
  "total": 20,
  "results": [
    {
      "id": 45,
      "title": "Sample Post Title",
      "content": "This is a sample content for the forum post.",
      "is_commentable": true,
      "author": 1,
      "view_count": 0,
      "upvote_count": 0,
      "downvote_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-08T17:24:04.561597Z",
      "updated_at": "2025-05-08T17:24:04.563531Z",
      "deleted_on": null
    },
    {
      "id": 44,
      "title": "Sample Post Title",
      "content": "This is a sample content for the forum post.",
      "is_commentable": false,
      "author": 1,
      "view_count": 0,
      "upvote_count": 0,
      "downvote_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-08T17:23:50.461145Z",
      "updated_at": "2025-05-08T17:23:50.462824Z",
      "deleted_on": null
    },
    {
      "id": 43,
      "title": "Sample Post Title",
      "content": "This is a sample content for the forum post.",
      "is_commentable": true,
      "author": 1,
      "view_count": 0,
      "upvote_count": 0,
      "downvote_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-08T17:23:46.653863Z",
      "updated_at": "2025-05-08T17:23:46.655832Z",
      "deleted_on": null
    }
  ]
}
```

- **Note:** Returns ordered by `created_at` in descending order. New posts appear first.


### 3. **GET** `/forum/posts/{id}/`

#### 🔍 Request Format

Nothing required as a request body, just the URL with the post ID.

- **Note:** The `id` parameter is required in the URL path

#### 📦 Response Format
```json
{
  "id": 42,
  "title": "Sample Post Title",
  "content": "This is a sample content for the forum post.",
  "is_commentable": true,
  "author": 1,
  "view_count": 1,
  "upvote_count": 0,
  "downvote_count": 0,
  "tags": [
    "Healthy",
    "Quick"
  ],
  "created_at": "2025-05-08T17:23:45.383180Z",
  "updated_at": "2025-05-08T17:25:37.551355Z",
  "deleted_on": null
}
```
- **Note:** The `view_count` is updated each time this endpoint is accessed.

### 4. **PUT** `/forum/posts/{id}/`

#### 🔍 Request Format

```json
{
  "title": "Updated Healthy Meal Prep for Students",
  "content": "Updated tips and tricks for meal prepping on a student budget.",
  "is_commentable": false,
  "tags": ["Healthy Eating", "Student", "Quick", "Nutrition"]
}
```

- **Note:** The `id` parameter is required in the URL path. All the fields are optional, you can give any number of fields to update. If a field is not provided, it will not be updated and will retain its previous value.

#### 📦 Response Format
```json
{
  "id": 42,
  "title": "Updated Healthy Meal Prep for Students",
  "content": "Updated tips and tricks for meal prepping on a student budget.",
  "is_commentable": false,
  "author": 1,
  "view_count": 1,
  "upvote_count": 0,
  "downvote_count": 0,
  "tags": [
    "Healthy Eating",
    "Student",
    "Quick",
    "Nutrition"
  ],
  "created_at": "2025-05-08T17:23:45.383180Z",
  "updated_at": "2025-05-08T17:26:00.371097Z",
  "deleted_on": null
}
```

### 5. **DELETE** `/forum/posts/{id}/`

#### 🔍 Request Format

Nothing required as a request body, just the URL with the post ID.

- **Note:** The `id` parameter is required in the URL path.

#### 📦 Response Format
```json
{
  "message": "Post deleted successfully."
}
```

### 6. **POST** `/forum/posts/{post_id}/vote/`
#### 🔍 Request Format

```json
{
  "vote_type": "up"
}
```
- **Note:** The `id` parameter is required in the URL path. The `vote_type` field is required in the request body.
- **Note:** The `vote_type` can be either `up` or `down`.

#### 📦 Response Format
```json
{
  "message": "Vote recorded successfully!"
}
```
#### 📦 Response Format (failed)
```json
{
  "message": "You have already voted on this post!"
}
```
- Status code: 400 Bad Request

- **Note:** The `upvote_count` and `downvote_count` fields are updated accordingly. Only one vote is allowed per user per post. A user cannot vote again on the same post until they remove their previous vote.
- **Note:** If a user tries to vote again, they will receive a message indicating that they have already voted.

### 7. **DELETE** `/forum/posts/{post_id}/vote/`
#### 🔍 Request Format
- Nothing required as a request body, just the URL with the post ID.
- **Note:** The `post_id` parameter is required in the URL path.
#### 📦 Response Format
```json
{
  "message": "Vote removed successfully!"
}
```
#### 📦 Response Format (failed)
```json
{
  "message": "No vote found to delete for this post."
}
```
- Status code: 404 Not Found
- **Note:** The `upvote_count` and `downvote_count` fields are updated accordingly. The user can remove their vote at any time.
- **Note:** If the user tries to remove a vote that they haven't cast, they will receive a message indicating that they have not voted on this post.

#### 🔒 Permissions
- Authentication is required for all endpoints. Please refer to jwt token documentation for details.

#### 🔗 Related
- Related model: Forum Post (inherits from TimestampedModel, PostModel)
- Will be used in: forum app for creating and managing forum posts.

### Quick Reminder:
- It's almost certain that I've made some mistakes or inconsistencies in the above documentation. Please review our swagger documentation and the code itself to ensure everything is accurate and up-to-date. If you find any discrepancies, please correct the documentation accordingly. Thank you for your understanding and cooperation!
- You can easily find the working endpoints and their request/response formats in the swagger documentation. Just run backend locally and go to `http://127.0.0.1:8000/swagger/` to access the swagger UI. You can also use the Postman collection provided in the repository for testing the endpoints but I strongly suggest using the swagger UI for better understanding and testing.