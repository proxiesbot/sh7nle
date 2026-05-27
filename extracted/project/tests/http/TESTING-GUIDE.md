# Backend API Testing Guide

## Overview
This guide explains how to test the Laravel Fortify authentication endpoints for the Hi Card backend application using the REST Client extension in VS Code.

## Prerequisites

1. **Install REST Client Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "REST Client"
   - Install the extension by Huachao Mao

2. **Start Your Laravel Server**
   ```bash
   cd "c:\Users\HP\Desktop\Hi Card\backend"
   php artisan serve
   ```
   
   Note the URL (usually http://localhost:8000 or http://127.0.0.1:8000)

3. **Ensure Database is Ready**
   ```bash
   php artisan migrate:fresh --seed
   ```

## Using the Test File

### File Location
`c:\Users\HP\Desktop\Hi Card\backend\tests\http\auth-tests.http`

### Configuration

1. **Update Base URL** (if needed)
   At the top of the file, update:
   ```http
   @baseUrl = http://localhost:8000
   ```
   
2. **Update Test Credentials** (if needed)
   ```http
   @testEmail = testuser@example.com
   @testPassword = Password123!
   @testName = Test User
   ```

### Running Tests

#### Method 1: Using REST Client Extension
1. Open `auth-tests.http` in VS Code
2. You'll see "Send Request" above each test
3. Click "Send Request" to execute a test
4. View the response in a new tab

#### Method 2: Keyboard Shortcuts
- Place cursor in a request block
- Press `Ctrl+Alt+R` (Windows/Linux) or `Cmd+Alt+R` (Mac)

### Test Categories

The file contains 11 categories of tests:

1. **Registration Tests** (6 tests)
   - Success case
   - Missing fields
   - Invalid email
   - Password mismatch
   - Duplicate email
   - Weak password

2. **Login Tests** (6 tests)
   - Success case
   - Wrong password
   - Non-existent email
   - Missing email
   - Missing password
   - With remember me

3. **Logout Tests** (2 tests)
   - Authenticated logout
   - Unauthenticated attempt

4. **Forgot Password Tests** (4 tests)
   - Success case
   - Non-existent email
   - Invalid email format
   - Missing email

5. **Reset Password Tests** (4 tests)
   - Success case
   - Invalid token
   - Password mismatch
   - Missing token

6. **Email Verification Tests** (4 tests)
   - Get verification notice
   - Resend email (authenticated)
   - Resend email (unauthenticated)
   - Verify email link

7. **User Profile Tests** (2 tests)
   - Get current user (authenticated)
   - Get current user (unauthenticated)

8. **Two-Factor Authentication Tests** (9 tests)
   - Enable 2FA
   - Get QR code
   - Get secret key
   - Get recovery codes
   - Confirm with valid code
   - Confirm with invalid code
   - Challenge with code
   - Challenge with recovery code
   - Disable 2FA

9. **Google OAuth Tests** (2 tests)
   - Redirect to Google
   - Callback handling

10. **Rate Limiting Tests** (1 test)
    - Multiple failed login attempts

11. **CSRF Protection Tests** (2 tests)
    - Get CSRF token
    - Login without token

## Test Flow Recommendations

### Basic Flow
1. **Test Registration** → Test 1.1
2. **Test Login** → Test 2.1
3. **Test Logout** → Test 3.1

### Password Reset Flow
1. **Request Reset** → Test 4.1
2. Check email or database for token
3. **Reset Password** → Test 5.1 (update token variable)
4. **Login with new password** → Test 2.1

### Email Verification Flow
1. **Register new user** → Test 1.1
2. **Resend verification** → Test 6.2 (with session cookies)
3. Check email for verification link
4. **Verify email** → Test 6.4 (use link from email)

### 2FA Flow
1. **Login** → Test 2.1
2. **Enable 2FA** → Test 8.1 (with session cookies)
3. **Get QR Code** → Test 8.2
4. Scan with authenticator app
5. **Confirm 2FA** → Test 8.5 (with code from app)
6. **Test 2FA Challenge** → Test 8.7

## Working with Cookies

For authenticated requests, you need session cookies:

1. **Run a successful login** (Test 2.1)
2. **Copy cookies from response headers**:
   - Look for `Set-Cookie` headers
   - Copy `XSRF-TOKEN` and `laravel_session` values
3. **Paste in Cookie header**:
   ```http
   Cookie: XSRF-TOKEN=YOUR_TOKEN; laravel_session=YOUR_SESSION
   ```

## Working with API Tokens (Sanctum)

For API routes (`/api/user`):

1. **Create a token via Tinker**:
   ```bash
   php artisan tinker
   >>> $user = User::find(1)
   >>> $token = $user->createToken('test-token')->plainTextToken
   >>> echo $token
   ```

2. **Use in Authorization header**:
   ```http
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

## Expected Response Codes

| Code | Meaning |
|------|---------|
| 200/201 | Success |
| 302/303 | Redirect (web routes) |
| 401 | Unauthenticated |
| 403 | Forbidden (lack of permissions) |
| 419 | CSRF token mismatch |
| 422 | Validation error |
| 429 | Too many requests (rate limit) |

## Validation Errors Format

Laravel returns validation errors in this format:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password field is required."
    ]
  }
}
```

## Checking Email Verification

### Option 1: Database
```sql
SELECT * FROM password_reset_tokens WHERE email = 'testuser@example.com';
```

### Option 2: Mailtrap (Recommended for Development)
1. Sign up at https://mailtrap.io
2. Configure `.env`:
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.mailtrap.io
   MAIL_PORT=2525
   MAIL_USERNAME=your_username
   MAIL_PASSWORD=your_password
   ```

### Option 3: Laravel Log
Check `storage/logs/laravel.log` when using `log` mail driver

## Troubleshooting

### CSRF Token Mismatch (419)
- Make sure you're sending `X-Requested-With: XMLHttpRequest` header
- Get CSRF cookie first: Test 11.1
- Include cookies in subsequent requests

### 302 Redirects Instead of JSON
- Add `Accept: application/json` header
- Add `X-Requested-With: XMLHttpRequest` header

### Rate Limiting (429)
- Wait 1 minute
- Or clear rate limiting:
  ```bash
  php artisan cache:clear
  ```

### Email Not Sending
- Check `.env` mail configuration
- Check `storage/logs/laravel.log`
- Verify SMTP credentials

### Session Issues
- Clear session:
  ```bash
  php artisan session:clear
  ```
- Check `SESSION_DRIVER` in `.env`

## Recording Results

Create a document with your test results in this format:

```
Test: 1.1 - Successful Registration
Status: ✅ PASS / ❌ FAIL
Response Code: 201
Notes: User created successfully, redirected to email verification

Test: 1.2 - Registration Missing Fields
Status: ✅ PASS / ❌ FAIL
Response Code: 422
Errors: {
  "name": ["The name field is required."],
  "email": ["The email field is required."]
}
```

## Next Steps

After running all tests:
1. Document any failures or unexpected behaviors
2. Note the exact error messages and response codes
3. Share results with the development team
4. Frontend integration will be updated based on the actual backend responses

## Additional Resources

- [Laravel Fortify Documentation](https://laravel.com/docs/fortify)
- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)
- [REST Client Extension Documentation](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
