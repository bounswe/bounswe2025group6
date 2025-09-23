
# ``RegisteredUserViewSet``

Base URL

    /users/

## 🔍 List Users

**GET** `/users/`

Retrieve a list of all registered users.

-   **Response:**
    
    -   `200 OK` — List of users.
        
-   **Example Response:**

    ```json
    {
      "count": 2,
      "next": null,
      "previous": null,
      "results": [
        {
          "id": 1,
          "username": "user1",
          "email": "username@example.com",
          "usertype": "user",
          "profilePhoto": null,
          "foodAllergies": [],
          "notificationPreferences": {},
          "profileVisibility": "public",
          "recipeCount": 0,
          "avgRecipeRating": 0,
          "typeOfCook": null,
          "followedUsers": [],
          "bookmarkRecipes": [],
          "likedRecipes": []
        },
        {
          "id": 2,
          "username": "user2",
          "email": "user@user.org",
          "usertype": "user",
          "profilePhoto": null,
          "foodAllergies": [],
          "notificationPreferences": {},
          "profileVisibility": "public",
          "recipeCount": 0,
          "avgRecipeRating": 0,
          "typeOfCook": null,
          "followedUsers": [],
          "bookmarkRecipes": [
            1
          ],
          "likedRecipes": []
        }
      ]
    }
    ```json

## ➕ Create User

**POST** `/users/`

Create a new user. We will use register endpoint for new user creation. This endpoint will not be used in frontend or mobile. 

-   **Request Body:**
    {
      "username": "X",
      "email": "user@example.com",
      "usertype": "user",
      "profilePhoto": "string",
      "foodAllergies": {},
      "notificationPreferences": {},
      "profileVisibility": "public",
      "recipeCount": 2147483647,
      "avgRecipeRating": 5,
      "typeOfCook": "beginner",
      "followedUsers": [
        0
      ],
      "bookmarkRecipes": [
        0
      ],
      "likedRecipes": [
        0
      ]
    }

## 📄 Retrieve User

**GET** `/users/{id}/`

Retrieve details of a specific user by their ID.

-   **URL Parameter:**
    
    -   `id` — Integer — The user’s ID.
        
-   **Response:**
    
    -   `200 OK` — User details.
        
-   **Example Response:**

```json
{
  "id": 1,
  "username": "user",
  "email": "username@gmail.com",
  "usertype": "user",
  "profilePhoto": null,
  "foodAllergies": [],
  "notificationPreferences": {},
  "profileVisibility": "public",
  "recipeCount": 0,
  "avgRecipeRating": 0,
  "typeOfCook": null,
  "followedUsers": [],
  "bookmarkRecipes": [],
  "likedRecipes": []
}
```
## ✏️ Update User (Full)

**PUT** `/users/{id}/`

Update all fields of an existing user.

-   **Request Body:**
```json
    {
      "username": "sMCHS4j5vEAEduOTgfh0aNNWSuYl.AHo1JXTUNJZz7HlWuENW",
      "email": "user@example.com",
      "usertype": "user",
      "profilePhoto": "string",
      "foodAllergies": {},
      "notificationPreferences": {},
      "profileVisibility": "public",
      "recipeCount": 2147483647,
      "avgRecipeRating": 5,
      "typeOfCook": "beginner",
      "followedUsers": [
        0
      ],
      "bookmarkRecipes": [
        0
      ],
      "likedRecipes": [
        0
      ]
    } ``` json
```
**Response:**

-   `200 OK` — User updated successfully.

## 🔧 Update User (Partial)

**PATCH** `/users/{id}/`

Update one or more fields of a user.

-   **Request Body (example):**

    {
      "email": "john_new@example.com"
    }

## ❌ Delete User

**DELETE** `/users/{id}/`

Delete a user.

-   **Response:**
    
    -   `204 No Content` — User deleted successfully.

## 📄get_user_id_by_email

#### Endpoint

`GET /users/get_user_id_by_email/`

#### Description

Retrieves the user ID based on the email address provided as a query parameter.

#### Request

-   **Query Parameters**
    
    -   `email` (string, required): The email address of the user.
        

#### Response

-   **Success (200 OK)**

    {
      "id": 42
    }
**Error (400 Bad Request)**

    {
      "error": "Email parameter is required"
    }
   **Error (404 Not Found)**
    
    {
      "error": "User not found"
    }

#### Authentication

Not required.

##  ➕ follow_user

#### Endpoint

`POST /users/follow/`

#### Description

Allows an authenticated user to follow or unfollow another user by their user ID. Prevents users from following themselves.

#### Request

-   **Headers**
    
    -   `Authorization: Bearer <token>`
        
-   **Body**

    {
      "user_id": 123
    }
#### Response

-   **Success (200 OK)**
 

    {
      "status": "followed",
      "target_user_id": 123,
      "current_followers_count": 42
    }
or

    {
      "status": "unfollowed",
      "target_user_id": 123,
      "current_followers_count": 41
    }

**Error (400 Bad Request)**

    {
      "error": "user_id is required."
    }
or

    {
      "error": "You cannot follow yourself."
    }
**Error (404 Not Found)**

    {
      "error": "Target user not found"
    }

-   **Error (401 Unauthorized)**  
    No body, just unauthorized response if token is missing or invalid.
    

#### Authentication

Required (Bearer token)

### `bookmark_recipe`

#### Endpoint

`POST /users/bookmark_recipe/`

#### Description

Bookmarks a recipe for the currently authenticated user.

#### Request

-   **Headers**
    
    -   `Authorization: Bearer <token>`
        
-   **Body**

    {
      "recipe_id": 456
    }

#### Response

-   **Success (200 OK)**

    {
      "status": "recipe bookmarked"
    }
**Error (400 Bad Request)**

    {
      "error": "recipe_id is required."
    }

-   **Error (401 Unauthorized)**  
    No body, just unauthorized response if token is missing or invalid.
    

#### Authentication

Required (Bearer token)
