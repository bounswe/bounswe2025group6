# Reports API Documentation

## User Report Endpoints

### Create Report
**POST** `/api/reports/`

**Description**: Create a new report for a post or recipe. Requires authentication.

#### Request Headers:
```
Authorization: Bearer <access_token>
```

#### Request Body Example:
```json
{
    "content_type": "post",  // or "recipe"
    "object_id": 123,
    "report_type": "spam",
    "description": "This content appears to be spam advertising"
}
```

#### Fields:
- `content_type` (string, required): Type of content being reported ("post" or "recipe")
- `object_id` (integer, required): ID of the content being reported
- `report_type` (string, required): Type of report ("spam", "inappropriate", "harassment", or "other")
- `description` (string, optional): Additional details about the report

#### Response:
- **Success**:
  - Status: `201 Created`
  ```json
  {
      "id": 1,
      "content_type_name": "post",
      "reporter_username": "user1",
      "content_object_preview": "Post title or preview",
      "report_type": "spam",
      "description": "This content appears to be spam advertising",
      "status": "pending",
      "created_at": "2024-03-20T12:00:00Z"
  }
  ```

- **Error**:
  - Status: `400 Bad Request`
  ```json
  {
      "content_type": ["Invalid content type. Available types: post, recipe"]
  }
  ```

### List User's Reports
**GET** `/api/reports/`

**Description**: Get a list of reports created by the authenticated user.

#### Request Headers:
```
Authorization: Bearer <access_token>
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  [
      {
          "id": 1,
          "content_type_name": "post",
          "reporter_username": "user1",
          "content_object_preview": "Post title or preview",
          "report_type": "spam",
          "description": "This content appears to be spam advertising",
          "status": "pending",
          "created_at": "2024-03-20T12:00:00Z"
      }
  ]
  ```

### Get Single Report
**GET** `/api/reports/{report_id}/`

**Description**: Retrieve a specific report by ID. Users can only access their own reports.

#### Request Headers:
```
Authorization: Bearer <access_token>
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "id": 1,
      "content_type_name": "post",
      "reporter_username": "user1",
      "content_object_preview": "Post title or preview",
      "report_type": "spam",
      "description": "This content appears to be spam advertising",
      "status": "pending",
      "created_at": "2024-03-20T12:00:00Z"
  }
  ```

### Update Report
**PUT** `/api/reports/{report_id}/`

**Description**: Update a report. Users can only update their own reports.

#### Request Headers:
```
Authorization: Bearer <access_token>
```

#### Request Body:
```json
{
    "report_type": "harassment",
    "description": "Updated description of the report"
}
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "id": 1,
      "content_type_name": "post",
      "reporter_username": "user1",
      "content_object_preview": "Post title or preview",
      "report_type": "harassment",
      "description": "Updated description of the report",
      "status": "pending",
      "created_at": "2024-03-20T12:00:00Z"
  }
  ```

### Delete Report
**DELETE** `/api/reports/{report_id}/`

**Description**: Delete a report. Users can only delete their own reports.

#### Request Headers:
```
Authorization: Bearer <access_token>
```

#### Response:
- **Success**:
  - Status: `204 No Content`

## Admin Report Endpoints

## Creating an Admin Superuser

Before you can use the admin endpoints, you need to create a superuser account. Follow these steps:

1. Open your terminal and navigate to the project directory:
```bash
cd /path/to/practice-app/backend
```

2. Create a superuser using Django's management command:
```bash
python manage.py createsuperuser
```

3. You will be prompted to enter:
   - Username
   - Email address
   - Password (the password won't be visible when typing)
   - Password confirmation

Example:
```bash
Username: admin
Email address: admin@example.com
Password: 
Password (again): 
Superuser created successfully.
```

Now you can use these credentials to:
1. Access the Django admin interface at `/admin/`
2. Login using the admin login endpoint `/api/reports/admin/auth/login/`
3. Use all admin-only endpoints with the obtained access token

### Admin Login
**POST** `/api/reports/admin/auth/login/`

**Description**: Login endpoint specifically for admin users.

#### Request Body:
```json
{
    "username": "admin",
    "password": "adminpass"
}
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "message": "Admin login successful",
      "user": {
          "id": 1,
          "username": "admin",
          "email": "admin@example.com",
          "is_staff": true,
          "is_superuser": true
      },
      "tokens": {
          "refresh": "refresh_token",
          "access": "access_token"
      }
  }
  ```

### List All Reports (Admin)
**GET** `/api/reports/admin/reports/`

**Description**: Get a list of all reports. Requires admin privileges.

#### Request Headers:
```
Authorization: Bearer <admin_access_token>
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  [
      {
          "id": 1,
          "content_type_name": "post",
          "reporter_username": "user1",
          "content_object_preview": "Post title or preview",
          "report_type": "spam",
          "status": "pending",
          "created_at": "2024-03-20T12:00:00Z"
      }
  ]
  ```

### Get Single Report (Admin)
**GET** `/api/reports/admin/reports/{report_id}/`

**Description**: Retrieve a specific report by ID. Admins can access any report.

#### Request Headers:
```
Authorization: Bearer <admin_access_token>
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "id": 1,
      "content_type_name": "post",
      "reporter_username": "user1",
      "content_object_preview": "Post title or preview",
      "report_type": "spam",
      "description": "This content appears to be spam advertising",
      "status": "pending",
      "created_at": "2024-03-20T12:00:00Z"
  }
  ```

### Update Report (Admin)
**PUT** `/api/reports/admin/reports/{report_id}/`

**Description**: Update any report details. Admin only.

#### Request Headers:
```
Authorization: Bearer <admin_access_token>
```

#### Request Body:
```json
{
    "report_type": "spam",
    "description": "Admin updated description",
    "status": "resolved"
}
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "id": 1,
      "content_type_name": "post",
      "reporter_username": "user1",
      "content_object_preview": "Post title or preview",
      "report_type": "spam",
      "description": "Admin updated description",
      "status": "resolved",
      "created_at": "2024-03-20T12:00:00Z"
  }
  ```

### Delete Report (Admin)
**DELETE** `/api/reports/admin/reports/{report_id}/`

**Description**: Delete any report. Admin only.

#### Request Headers:
```
Authorization: Bearer <admin_access_token>
```

#### Response:
- **Success**:
  - Status: `204 No Content`

### Resolve Report - Keep Content
**POST** `/api/reports/admin/reports/{report_id}/resolve_keep/`

**Description**: Resolve a report while keeping the reported content. Requires admin privileges.

#### Request Headers:
```
Authorization: Bearer <admin_access_token>
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "status": "Report resolved - content kept"
  }
  ```

### Resolve Report - Delete Content
**POST** `/api/reports/admin/reports/{report_id}/resolve_delete/`

**Description**: Resolve a report by deleting the reported content. Requires admin privileges.

#### Request Headers:
```
Authorization: Bearer <admin_access_token>
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "status": "Report resolved - content deleted"
  }
  ```

### Check Admin Status
**GET** `/api/reports/admin/auth/check/`

**Description**: Check if the current user has admin privileges.

#### Request Headers:
```
Authorization: Bearer <access_token>
```

#### Response:
- **Success**:
  - Status: `200 OK`
  ```json
  {
      "is_admin": true,
      "user": {
          "id": 1,
          "username": "admin",
          "email": "admin@example.com",
          "is_staff": true,
          "is_superuser": true
      }
  }
  ```
