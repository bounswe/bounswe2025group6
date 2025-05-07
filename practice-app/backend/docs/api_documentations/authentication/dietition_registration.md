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
        
