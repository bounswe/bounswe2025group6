### 2. **Email Verification**

**GET** `/api/verify-email/{verification_token}/`

-   **Description**: This endpoint is used to verify a user's email address. After registration, the user will receive an email with a verification link.
    

#### Request Example:

-   **URL**: `http://localhost:8000/api/verify-email/{verification_token}/`
    
    -   Replace `{verification_token}` with the actual token sent to the user's email.
        

#### Response:

-   **Success**:
    
    -   Status: `200 OK`
        
    -   Message: `'Email verified successfully.'`
        
-   **Error**:
    
    -   Status: `400 Bad Request`
        
    -   If the verification token is invalid or expired, an error message will be returned.
        

----------

## Email Notifications

-   A **Gmail account** (fithub.notifications@gmail.com) has been created to handle the registration and email verification notifications. Email verification links are sent to the users after they register. The email contains a unique verification token to confirm their email address.
    

----------

## User Registration Guide

### Regular User Registration

To register as a **regular user**, follow the steps below:

1.  **Send a POST Request** to `/api/register/` with the following data:
    

#### Request Body Example for Regular User:

    {
      "username": "regularjohn",
      "email": "john.doe@example.com",
      "password": "secureUserPassword123",
      "usertype": "user"
    }

2.   **Response**:
    
    -   If the registration is successful, the server will respond with:
        
        -   Status: `201 Created`
            
        -   Message: `'User registered. Please check your email to verify your account.'`
            
3.  **Email Verification**:
    
    -   After registration, the user will receive a verification email containing a link to verify their email address.
        
    -   To verify the email, click the link, which will take the user to the `/api/verify-email/{verification_token}/` endpoint.

