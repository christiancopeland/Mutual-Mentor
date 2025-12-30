# Authentication Setup Guide

## Overview

Mutual Mentor now has a complete authentication system with JWT-based authentication. All API endpoints are protected and require a valid login.

## Login Credentials (Default User)

**Email:** `advisor@mutualmentor.com`
**Password:** `DefaultPass123!`

> **Note:** This password meets all security requirements:
> - 12+ characters
> - Uppercase letter (D, P)
> - Lowercase letters
> - Number (1, 2, 3)
> - Special character (!)

## How to Use

### 1. Start the Application

Make sure both the server and client are running:

```bash
# Terminal 1 - Start the server
cd server
npm start

# Terminal 2 - Start the client
cd client
npm run dev
```

### 2. Access the Application

Open your browser to `http://localhost:5173`

### 3. Login

You'll be automatically redirected to the login page if not authenticated:
- Enter email: `advisor@mutualmentor.com`
- Enter password: `DefaultPass123!`
- Click "Sign In"

### 4. Create a New Account (Optional)

If you want to create your own account:
1. Click "Create one here" on the login page
2. Fill out the registration form with:
   - Your full name
   - Email address
   - Password (must meet requirements)
   - Confirm password
3. Click "Create Account"

## Features

### Implemented Authentication Features

✅ **Login Page** - Secure login with email/password
✅ **Registration Page** - Create new user accounts
✅ **Protected Routes** - All main pages require authentication
✅ **JWT Tokens** - Secure token-based authentication
✅ **Auto Token Management** - Tokens automatically included in API requests
✅ **Auto Redirect** - Redirects to login when unauthorized
✅ **Logout Functionality** - Log out button in header
✅ **User Display** - Shows logged-in user name in header
✅ **Password Validation** - Strong password requirements enforced
✅ **Session Persistence** - Stays logged in after page refresh

### Security Features

- **Password Requirements:**
  - Minimum 12 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

- **Backend Security:**
  - JWT authentication on all API endpoints
  - Bcrypt password hashing (12 rounds)
  - Rate limiting on login/register
  - CORS protection
  - Helmet security headers
  - Audit logging
  - Input validation

## Files Created/Modified

### New Files Created:
- `client/src/contexts/AuthContext.jsx` - Authentication state management
- `client/src/pages/Login.jsx` - Login page
- `client/src/pages/Register.jsx` - Registration page
- `client/src/components/ProtectedRoute.jsx` - Route protection wrapper
- `AUTH_SETUP.md` - This file

### Modified Files:
- `client/src/lib/api.js` - Added auth API methods and token handling
- `client/src/App.jsx` - Added protected routes and auth provider
- `client/src/components/layout/Header.jsx` - Added logout button and user display
- `server/data/crm.db` - Updated default user with password

## Troubleshooting

### Issue: Getting 401 errors on all API calls
**Solution:** Make sure you're logged in. The token is automatically added to all requests after login.

### Issue: Login page won't load
**Solution:** Make sure the client development server is running (`npm run dev` in the client folder).

### Issue: "Invalid email or password" error
**Solution:** Double-check you're using the correct credentials:
- Email: `advisor@mutualmentor.com`
- Password: `DefaultPass123!` (case-sensitive)

### Issue: Session expires immediately
**Solution:** Check that `JWT_SECRET` is set in the server `.env` file. Tokens expire after 24 hours by default.

### Issue: Can't create new account
**Solution:** Make sure your password meets all requirements (shown below password field on registration page).

## Changing Your Password

Once logged in, you can change your password:
1. Go to Settings page
2. (Password change UI coming soon - currently available via API)

Or use the API directly:
```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "DefaultPass123!",
    "newPassword": "MyNewSecurePass456!"
  }'
```

## API Endpoints

All authentication endpoints are at `/api/auth`:

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/change-password` - Change password (requires auth)
- `POST /api/auth/refresh` - Refresh JWT token (requires auth)

## Next Steps

1. **Change the default password** - For security, change the default user password
2. **Create your own account** - Register with your own email
3. **Set up production** - Use strong JWT_SECRET in production environment
4. **Enable HTTPS** - Use HTTPS in production for secure token transmission

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the server console for API errors
3. Verify both server and client are running
4. Clear localStorage and try logging in again

---

**Last Updated:** December 29, 2024
**Version:** 1.0
