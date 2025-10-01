
### **User logout**

  

**POST**  `/api/logout/`

  

-  **Description**: This endpoint logs out the currently authenticated user by deleting their authentication token. The user must be logged in using token-based authentication.

#### Request Headers:

  

    Authorization: Token <your_token>

  

#### Request Body Example:

  

No request body is required.

  

#### Fields:

No request body is required.

  

#### Response:

  

-  **Success**:

- Status: `200 OK`

  

- Response body:

  

    {
    
    "detail": "Successfully logged out."
    
    }

  

-  **Error**:

- Status: `400 Bad Request`

- Possible Message:

    {
        "detail": "No token found."
    }



- Status: `400 Bad Request`

- Possible Message:

    {
        "detail": "Authentication credentials were not provided."
    }

