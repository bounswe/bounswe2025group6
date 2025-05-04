
### **Forgot Password**

**POST** `/api/forgot-password/`

-   **Description**: This endpoint allows a user to initiate the password reset process. It sends a password reset email with a secure tokenized link to the user’s registered email address.
    

#### Request Body Example:

    {
      "email": "user@example.com"
    }
  
  #### **Fields**:

-   `email` (string): The user's registered email address.
    

#### Response:

-   **Success**:
    
    -   Status: `200 OK`
        
    -   Response body:
{
  "detail": "Password reset email has been sent."
}
**Error**:

-   Status: `400 Bad Request`

    {
      "email": ["This field is required."]
    }
-   Status: `404 Not Found`

    {
      "detail": "No user found with this email."
    }

### **Reset Password**

**POST** `/api/reset-password/`

-   **Description**: This endpoint allows users to reset their password using the token sent to their email from the forgot password request.
    

#### Request Body Example:

    {
      "token": "abc123xyz-token-string",
      "new_password": "NewSecurePassword123"
    }
#### Fields:

-   `token` (string): The token received via email to verify password reset request.
    
-   `new_password` (string): The new password the user wants to set.
    

#### Response:

-   **Success**:
    
    -   Status: `200 OK`
        
    -   Response body:
    {
      "detail": "Password has been reset successfully."
    }

**Error**:

-   Status: `400 Bad Request`

    {
      "token": ["This field is required."]
    }
Status: `401 Unauthorized`

    {
      "detail": "Invalid or expired token."
    }


