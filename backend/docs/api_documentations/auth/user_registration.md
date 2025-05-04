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
        
