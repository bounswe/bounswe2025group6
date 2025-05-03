## 🔐 Authentication via Swagger UI

To access protected endpoints via Swagger, follow these steps:

### 1. 🔑 Obtain an Access Token

- Navigate to the `/api/token/` endpoint in the Swagger UI.
- In the request body:
  - **Enter your email** in the field labeled `username` (yes, it says "username", but you must provide your **email**).
  - Enter your **password**.
- Click the **"Execute"** button to request a token.

> ⚠️ Note: The authentication system is email-based, but Swagger still displays `username`. Just ignore the label and use your email.

### 2. 📋 Copy the Access Token

- After a successful request, you'll receive a response like:
  ```json
  {
    "access": "your-access-token",
    "refresh": "your-refresh-token"
  }

- Copy the access token.

### 3. 🛡️ Authorize Swagger Requests
Click the `"Authorize"` button at the top right of the Swagger UI.

In the `"Value"` field, enter your token like this:

- **Bearer your-access-token** (You must include the word "Bearer" followed by a space and then your token).
- Example:

    ```
    Bearer eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ2Mjk0MDEzLCJpYXQiOjE3NDYyOTM3MTMsIm
    p0aSI6IjZmZDM1ZjhhYTMzNTRmOGM4NzZiNDUwOTEyYjZjNTAwIiwidXNlcl9pZCI6NX0.dk03jTLwt5W4Lo1LSDcAL6xbK__G6f3-Etm--Ul6fF0
    ```
- Click the **"Authorize"** button to apply the token to all secured endpoints.

Now you're authenticated and can test any protected endpoints directly through Swagger!


### 4. A quick tip to fasten the process
- You can use the `curl` command to quickly obtain the access token. Writing the followwing function into you .zshrc or .bashrc file will allow you to get the token easily. After adding this function below to your .zshrc or .bashrc file:
```bash
function get_fithub_token() {
  # Send the request and capture the full response
  local RESPONSE=$(curl -s -X POST http://127.0.0.1:8000/api/token/ \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"celil3@example.com\", \"password\": \"celil3\"}")

  # Extract and print the token (if it exists)
  local TOKEN=$(echo "$RESPONSE" | jq -r '.access')

  # Output the token with Bearer prefix
  echo "Bearer $TOKEN"
}
```

- **Note**: Make sure to replace `celil3@example.com` and `celil3` with your actual email and password that you want to use for authentication. Otherwise, you will be only using the default test user (celil3).

- Open up a new terminal and run the following command:
```bash
source ~/.zshrc
```

- Now you can get the token by simply running the following command:
```bash
get_fithub_token
```
- This will return the token in the format `Bearer your-access-token`, which you can then copy and paste into the Swagger UI.

Let me know if you have any questions or need further assistance. @celilozknn