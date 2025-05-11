### **Login User (via Email)**

**POST** `/api/login/`

-   **Description**: This endpoint allows a registered and active user to log in using their email and password. On successful login, it returns an authentication token and basic user info.
    

#### Request Body Example:

    {
      "email": "dietitian.john@example.com",
      "password": "secureDietitianPassword123"
    }

#### Fields:
    
-   `email` (string): The user's email address.
    
-   `password` (string): The user's password
    

#### Response:

-   **Success**:
    
    -   Status: `200 OK`

    
        
    -   Response body: 

    {
        "token": "6a4c4f4e3f3f2b2a1a1d1e1f0f0c0b0a12345678",
        "user_id": 12,
        "username": john,
        "email": "dietitian.john@example.com",
        "usertype": "dietitian"
    }

        
-   **Error**:
    
    -   Status: `400 Bad Request`
        
    -   Possible Messages:

    {
        "non_field_errors": ["Invalid email or password."]
    }

    {
        "non_field_errors": ["User account is inactive."]
    }


        
