
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

-   **Description**: This endpoint verifies the 6-digit numeric reset code provided by the user for the given email address. If the code is valid and has not expired, a temporary unique token is generated and returned, which is required for the final password reset step.
    

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
  "detail": "Code verified.",
  "token": "your-unique-verification-token-uuid"
}

**Error**:

-   Status: `400 Bad Request`
    
-   Possible Messages:

    {
      "email": [
          "Enter a valid email address."
      ],
      "code": [
          "Ensure this value has at least 6 characters.",
          "Ensure this value has no more than 6 characters."
      ]
    }

    {
      "non_field_errors": [
          "Invalid or expired code."
      ]
    }


### **Reset Password**

**POST** `/api/reset-password/`

-   **Description**: This endpoint allows the user to set a new password for their account using the temporary verification token obtained from the "Verify Reset Code" step.
    

#### Request Body Example:

  {
    "token": "your-unique-verification-token-uuid",
    "new_password": "NewSecurePassword123"
  }

#### Fields:

-   `token` (string, required): The unique verification token received after successfully verifying the reset code.
    
-   `new_password` (string, required): The new password that the user wants to set for their account. It must be at least 8 characters long.
    

#### Response:

-   **Success**:
    
    -   Status: `200 OK`
        
    -   Response body: 

    {
      "detail": "Password has been successfully reset."
    }

**Error**:

-   Status: `400 Bad Request`
    
-   Possible Messages:

    {
      "token": [
          "Valid UUID string is required."
      ],
      "new_password": [
          "Ensure this value has at least 8 characters."
      ]
    }

    {
      "non_field_errors": [
          "Invalid or expired token."
      ]
    }