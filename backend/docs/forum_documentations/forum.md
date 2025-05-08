# 📘 Forum API Documentation

This document describes how to use the Forum API endpoint, which is used for creating, retrieving, updating, and deleting posts in the forum.

---

## ⚙️ Forum Post Model Schema

```json
{
  "id": 14,
  "title": "How to make a Budget-friendly meal?",
  "content": "Here are some tips on how to make a delicious and budget-friendly meal...",
  "is_commentable": true,
  "author": 1,
  "view_count": 0,
  "like_count": 0,
  "tags": [
    "Budget",
    "Healthy",
    "Quick"
  ],
  "created_at": "2025-05-07T20:54:23.037658Z",
  "updated_at": "2025-05-07T20:54:23.040858Z",
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
- `like_count`: Number of likes (integer).
- `tags`: List of tags associated with the post (array of strings) (enum)
- `created_at`: Timestamp of when the post was created (datetime).
- `updated_at`: Timestamp of when the post was last updated (datetime).
- `deleted_on`: Timestamp of when the post was deleted (datetime, nullable).


## 📍 Endpoints

### 1. **POST** `/forum/posts/`

#### 🔍 Request Format

```json
{
  "title": "How to make a Budget-friendly meal?",
  "content": "Here are some tips on how to make a delicious and budget-friendly meal...",
  "is_commentable": true,
  "tags": ["Budget", "Healthy", "Quick"]
}
```

- **Note:**: The `is_commentable` and `tags` fields are optional. If not provided, `is_commentable` defaults to `false`, and `tags` defaults to an empty list. All other fields are required.

#### 📦 Response Format
```json
{
  "id": 14,
  "title": "How to make a Budget-friendly meal?",
  "content": "Here are some tips on how to make a delicious and budget-friendly meal...",
  "is_commentable": true,
  "author": 1,
  "view_count": 0,
  "like_count": 0,
  "tags": [
    "Budget",
    "Healthy",
    "Quick"
  ],
  "created_at": "2025-05-07T20:54:23.037658Z",
  "updated_at": "2025-05-07T20:54:23.040858Z",
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
  "page_size": 5,
  "total": 10,
  "results": [
    {
      "id": 23,
      "title": "How meal?",
      "content": "Here is  a delicious and budget-friendly meal...",
      "is_commentable": false,
      "author": 1,
      "view_count": 0,
      "like_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-07T21:02:41.254344Z",
      "updated_at": "2025-05-07T21:02:41.255472Z",
      "deleted_on": null
    },
    {
      "id": 22,
      "title": "How meal?",
      "content": "Here is  a delicious and budget-friendly meal...",
      "is_commentable": false,
      "author": 1,
      "view_count": 0,
      "like_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-07T21:02:41.133570Z",
      "updated_at": "2025-05-07T21:02:41.135065Z",
      "deleted_on": null
    },
    {
      "id": 21,
      "title": "How meal?",
      "content": "Here is  a delicious and budget-friendly meal...",
      "is_commentable": false,
      "author": 1,
      "view_count": 0,
      "like_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-07T21:02:38.869082Z",
      "updated_at": "2025-05-07T21:02:38.871334Z",
      "deleted_on": null
    },
    {
      "id": 20,
      "title": "How to make a Budget-friendly meal?",
      "content": "Here are some tips on how to make a delicious and budget-friendly meal...",
      "is_commentable": false,
      "author": 1,
      "view_count": 0,
      "like_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-07T21:02:27.374686Z",
      "updated_at": "2025-05-07T21:02:27.376405Z",
      "deleted_on": null
    },
    {
      "id": 19,
      "title": "How to make a Budget-friendly meal?",
      "content": "Here are some tips on how to make a delicious and budget-friendly meal...",
      "is_commentable": false,
      "author": 1,
      "view_count": 0,
      "like_count": 0,
      "tags": [
        "Healthy",
        "Quick"
      ],
      "created_at": "2025-05-07T21:02:27.090421Z",
      "updated_at": "2025-05-07T21:02:27.098239Z",
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
  "id": 24,
  "title": "Healthy Meal Prep for Students",
  "content": "Let's share our best meal prep strategies that are healthy and budget-friendly.",
  "is_commentable": true,
  "author": 1,
  "view_count": 0,
  "like_count": 0,
  "tags": [
    "Meal Prep",
    "Healthy",
    "Student",
    "Tips"
  ],
  "created_at": "2025-05-07T21:20:43.079422Z",
  "updated_at": "2025-05-07T21:20:43.092132Z",
  "deleted_on": null
}
```

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
  "id": 23,
  "title": "Updated Healthy Meal Prep for Students",
  "content": "Updated tips and tricks for meal prepping on a student budget.",
  "is_commentable": false,
  "author": 1,
  "view_count": 0,
  "like_count": 0,
  "tags": [
    "Healthy Eating",
    "Student",
    "Quick",
    "Nutrition"
  ],
  "created_at": "2025-05-07T21:02:41.254344Z",
  "updated_at": "2025-05-07T21:21:26.342611Z",
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



#### 🔒 Permissions
- Authentication is required for all endpoints. Please refer to jwt token documentation for details.

#### 🔗 Related
- Related model: Forum Post (inherits from TimestampedModel, PostModel)
- Will be used in: forum app for creating and managing forum posts.