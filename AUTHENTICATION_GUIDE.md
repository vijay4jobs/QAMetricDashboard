# QA Metrics Dashboard - Authentication System

## Overview
A complete authentication and authorization system with encrypted passwords, session management, and role-based access control.

## Features

### 1. **User Authentication**
- Secure login system with JWT tokens
- Password encryption using bcrypt (10 rounds)
- Session management with database-backed sessions
- 24-hour session expiry
- Automatic logout on session expiry

### 2. **User Roles**
- **Admin**: Full access to all features including admin panel
- **QA**: Access to metrics, graphs, and data entry
- **Individual**: Access to metrics and graphs
- **Viewer**: Read-only access to dashboard

### 3. **Database Tables**
- **users**: Stores user credentials and roles
- **sessions**: Manages active user sessions

### 4. **Security Features**
- Passwords hashed with bcrypt before storage
- Session tokens stored in database
- JWT tokens for client-server communication
- Role-based access control on backend and frontend
- Admin panel restricted to admin role only

## Default Credentials
```
Username: admin
Password: admin123
Role: admin
```

## API Endpoints

### Public Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Protected Endpoints
- `POST /api/auth/logout` - User logout (requires auth)
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/:id/toggle-active` - Toggle user active status (admin only)
- `DELETE /api/admin/delete/users/:id` - Delete user (admin only)
- All other `/api/admin/*` routes - Admin only

## Pages

### 1. **Login Page** (`/login.html`)
- Clean, modern glassmorphism design
- Username/email and password fields
- Error messaging
- Auto-redirect if already logged in

### 2. **Admin Panel** (`/admin.html`)
- **Restricted to admin role only**
- Four tabs: Database, Users, Projects, Metrics
- User management:
  - Add new users with role selection
  - View all users
  - Activate/deactivate users
  - Delete users
- Database query tool with checkbox-based bulk delete
- Project management
- Metric management

### 3. **Protected Pages**
- Dashboard (`/index.html`)
- Graphs (`/graphs.html`)
- Enter Metrics (`/metrics-input.html`)
- Admin Panel (`/admin.html`) - Admin only

## User Management

### Adding New Users (Admin Only)
1. Navigate to Admin Panel → Users tab
2. Fill in the form:
   - Username (unique)
   - Email (unique)
   - Password (will be encrypted)
   - Role (admin, qa, individual, viewer)
3. Click "Add User"

### Managing Users
- **Activate/Deactivate**: Toggle user access without deleting
- **Delete**: Permanently remove user and their sessions

## Frontend Authentication

### Session Storage
- `authToken`: JWT token (stored in localStorage)
- `user`: User information (username, email, role)

### Auto-Logout
- Invalid or expired tokens redirect to login
- Session expiry triggers automatic logout

### Role-Based UI
- Admin link only visible to admin users
- Role badge displayed in admin panel sidebar

## Backend Protection

### Admin Routes
All `/api/admin/*` routes require:
1. Valid authentication token
2. Admin role

### Optional Protection
Other API routes are currently public but can be protected by uncommenting:
```javascript
app.use('/api', authMiddleware);
```
in `src/app.js`

## Testing the System

1. **Start the server**: `npm run dev`
2. **Navigate to**: `http://localhost:3000`
3. **Login with**: 
   - Username: `admin`
   - Password: `admin123`
4. **Test admin panel**: You should see all tabs
5. **Add a new user**: Try creating a QA user
6. **Logout**: Click logout button
7. **Try accessing admin panel** without admin role: Should be denied

## Security Notes

### Production Deployment
- Change `JWT_SECRET` in `.env` file
- Use strong passwords for default admin
- Enable HTTPS in production
- Consider adding rate limiting
- Add CSRF protection for forms

### Password Requirements
Currently no password policy enforced. Consider adding:
- Minimum length
- Complexity requirements
- Password expiry

### Session Management
- Sessions expire after 24 hours
- Expired sessions are automatically invalidated
- Logout clears session from database

## Troubleshooting

### Can't login with admin/admin123
- Check database: `SELECT * FROM users WHERE username = 'admin';`
- Verify password hash matches the one in migration
- Check server logs for errors

### Admin panel access denied
- Verify user role is 'admin'
- Check localStorage for user data
- Clear browser cache and login again

### Session expired immediately
- Check system time/timezone
- Verify database datetime format
- Check JWT_SECRET matches between login and verification

## File Structure

```
migrations/
  └── 005_users_table.sql        # Users and sessions tables

src/
  ├── auth.js                     # Authentication logic
  ├── app.js                      # Route protection setup
  └── routes/
      └── admin.js                # Admin API routes

public/
  ├── login.html                  # Login page
  ├── admin.html                  # Admin panel (admin only)
  ├── index.html                  # Dashboard (admin link conditional)
  ├── graphs.html                 # Graphs page (admin link conditional)
  ├── metrics-input.html          # Input form (admin link conditional)
  └── js/
      └── auth.js                 # Client-side auth utilities
```

## Next Steps

1. ✅ Login system created
2. ✅ Password encryption implemented
3. ✅ Session management working
4. ✅ Role-based access control configured
5. ✅ Admin panel restricted to admin role
6. ✅ User management interface created
7. ✅ Bulk delete with checkboxes implemented

The authentication system is now fully functional!

