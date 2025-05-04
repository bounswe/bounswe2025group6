
### **Request Password Reset Code**

**POST** `/api/request-password-reset-code/`

-   **Description**: This endpoint allows a user to request a password reset. Upon successful request, a 6-digit code will be sent to the provided email address for verifying the password reset.
    

#### Request Body Example:

    {
      "email": "john.doe@example.com"
    }

#### Fields:

-   `email` (string): The email address of the user who wants to reset the password.
    

#### Response:

-   **Success**:
    
    -   Status: `200 OK`
        
    -   Response body
    {
          "detail": "Password reset code sent successfully."
    }
**Error**:

-   Status: `400 Bad Request`
    
-   Possible Messages:

	{
    	  "email": ["This email address is not registered."]
    }

Status: `500 Internal Server Error` (if something goes wrong with email sending)

    {
      "detail": "There was an issue sending the email."
    }
### **Verify Reset Code**

**POST** `/api/verify-reset-code/`

-   **Description**: This endpoint verifies the 6-digit reset code sent to the user’s email. If the code matches the one sent, the user will be allowed to reset their password.
    

#### Request Body Example:

    {
      "email": "john.doe@example.com",
      "reset_code": "123456"
    }
#### Fields:

-   `email` (string): The email address of the user attempting to verify the reset code.
    
-   `reset_code` (string): The 6-digit code sent to the user's email address.
    

#### Response:

-   **Success**:
    
    -   Status: `200 OK`
        
    -   Response body: 

{
  "detail": "Reset code verified successfully. You can now reset your password."
}
**Error**:

-   Status: `400 Bad Request`
    
-   Possible Messages:

    {
      "reset_code": ["Invalid reset code."]
    }

    {
      "email": ["Email address not registered."]
    }

