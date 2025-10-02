
# **User and Dietitian Registration & Email Verification**

## Overview

This update to the registration system introduces support for **regular users** and **dietitians**. Dietitians are required to provide a certification URL to prove their education. In addition, a process for **email verification** has been implemented, ensuring that users can only log in after verifying their email addresses.

### Key Updates:

1.  **User Registration**: Regular users can now register through the same endpoint.
    
2.  **Dietitian Registration**: Dietitians now have a registration process that includes providing a certification URL to verify their credentials.
    
3.  **Email Notifications**: A Gmail account has been set up to send email notifications for account verification.
    
4.  **Email Verification**: A new endpoint allows users to verify their email addresses before they can log in.
    

----------

## Endpoints

### 1. **Register User (with Dietitian option)**

**POST** `/api/register/`

-   **Description**: This endpoint allows users to register as either a regular user or a dietitian. If the user is a dietitian, they are required to provide a certification URL.
    

#### Request Body Example:

    {
      "username": "dietitianjohn",
      "email": "dietitian.john@example.com",
      "password": "secureDietitianPassword123",
      "usertype": "dietitian",
      "dietitian": {
        "certification_url": "https://example.com/certifications/john_certification"
      }
    }

#### Fields:

-   `username` (string): The username of the user.
    
-   `email` (string): The user's email address.
    
-   `password` (string): The password (will be hashed by the backend).
    
-   `usertype` (string): Can be `"user"` for regular users or `"dietitian"` for dietitians.
    
-   `dietitian.certification_url` (string): The URL to the dietitian’s certification. This field is required only if `usertype` is `"dietitian"`.
    

#### Response:

-   **Success**:
    
    -   Status: `201 Created`
        
    -   Message: `'User registered. Please check your email to verify your account.'`
        
-   **Error**:
    
    -   Status: `400 Bad Request`
        
    -   Message with validation errors if any fields are incorrect or missing.
        

----------

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

### Dietitian Registration

Dietitians must provide a certification URL to complete their registration.

#### Request Body Example for Dietitian:

    {
      "username": "dietitianjohn",
      "email": "dietitian.john@example.com",
      "password": "secureDietitianPassword123",
      "usertype": "dietitian",
      "dietitian": {
        "certification_url": "https://example.com/certifications/john_certification"
      }
    }

-   **Fields**:
    
    -   `dietitian.certification_url` is required only if the user is a dietitian.
        

1.  **Send a POST Request** to `/api/register/` with the data shown above.
    
2.  **Response**:
    
    -   Status: `201 Created`
        
    -   Message: `'Dietitian registered. Please check your email to verify your account.'`
        
3.  **Email Verification**:
    
    -   After the registration is complete, the dietitian will receive an email verification link.
        
    -   Click the link in the email to verify the account by accessing the `/api/verify-email/{verification_token}/` endpoint.
        

----------

## Testing the Endpoints using Swagger

To test the **User Registration** and **Dietitian Registration** functionality, you can use **Swagger UI** through the frontend interface.

### How to Test:

1.  **Register a User**:
    
    -   Open Swagger and go to the `POST /api/register/` endpoint.
        
    -   In the request body, provide the necessary details for either a regular user or a dietitian.
        
    
    Example Request Body for Regular User:
    {
      "username": "regularjohn",
      "email": "john.doe@example.com",
      "password": "secureUserPassword123",
      "usertype": "user"
    }

Example Request Body for Dietitian:

    {
      "username": "dietitianjohn",
      "email": "dietitian.john@example.com",
      "password": "secureDietitianPassword123",
      "usertype": "dietitian",
      "dietitian": {
        "certification_url": "https://example.com/certifications/john_certification"
      }
    }

1.  -   lick **Execute** to send the request.
        
    -   If successful, a confirmation message will appear indicating that the user has been registered and the email verification process has been triggered.
        
2.  **Verify Email**:
    
    -   After registration, the user will receive an email with a verification token.
        
    -   Open the `GET /api/verify-email/{verification_token}/` endpoint in Swagger.
        
    -   Replace `{verification_token}` with the actual token received in the email.
        
    -   Click **Execute** to verify the email.
        
    -   You should receive a success message confirming the email was verified.
        

----------

## Conclusion

With these updates, both **regular users** and **dietitians** can register on the platform, and email verification is required for all users before they can log in. These endpoints have been tested and are working as expected.

This documentation is intended to help frontend developers test the functionality via Swagger and understand the structure of requests and responses.
