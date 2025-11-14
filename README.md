# QA Metrics Dashboard (Micro SaaS)

A comprehensive dashboard to centralize QA productivity, quality, and delivery metrics with role-based access control and beautiful UI.

## 🎯 Features

- **12 Core QA Metrics** with automated calculations
- **Real-time Dashboard** with glassmorphism UI
- **Interactive Graphs** with time-series visualization
- **Metric Input Forms** for data entry
- **Admin Panel** for system management
- **Authentication System** with encrypted passwords
- **Role-Based Access Control** (Admin, QA, Individual, Viewer)
- **Session Management** with 24-hour expiry
- **Dark Mode Support** across all pages
- **Responsive Design** for desktop and mobile

## 📊 Metrics Tracked

### Test Productivity Metrics
1. **Test Design Productivity** (TC/PD) - Higher The Better
2. **Test Execution Productivity** (TC/PD) - Higher The Better
3. **Test Environment Availability** (%) - Higher The Better

### Test Coverage Metrics
4. **Test Design Coverage** (%) - Higher The Better
5. **Test Execution Coverage** (%) - Higher The Better
6. **Requirements Traceability** (%) - Higher The Better

### Quality & Effort Metrics
7. **Defect Rejection** (%) - Lower The Better
8. **Effort Variation** (%) - Lower The Better
9. **Effort Per Story Point** (PHrs/Story Point) - Lower The Better

### Delivery & Automation Metrics
10. **Automation Coverage** (%) - Higher The Better
11. **Schedule Variation** (%) - Lower The Better
12. **On Time Completion of Milestones** (%) - Higher The Better

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (dev) / PostgreSQL (prod via DATABASE_URL)
- **Frontend**: HTML + Tailwind CSS (CDN) + Alpine.js + Chart.js
- **Authentication**: JWT + bcrypt + Session Management
- **Charts**: Chart.js with datalabels plugin

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Database Setup
```bash
npm run migrate
```
This creates all necessary tables including users, sessions, projects, metrics, etc.

### Start Development Server
```bash
npm run dev
```
Visit http://localhost:3000

### Default Login Credentials
```
Username: admin
Password: admin123
Role: admin
```

## 📁 Project Structure

```
QAMetricDashboard/
├── migrations/           # Database migrations
│   ├── 001_init.sql
│   ├── 002_metric_inputs.sql
│   ├── 003_metric_definitions.sql
│   ├── 004_unique_project_name.sql
│   └── 005_users_table.sql
├── public/              # Frontend files
│   ├── login.html       # Login page
│   ├── index.html       # Dashboard
│   ├── graphs.html      # Metrics graphs
│   ├── metrics-input.html # Data entry form
│   ├── admin.html       # Admin panel (admin only)
│   └── js/
│       └── auth.js      # Client-side auth utilities
├── src/
│   ├── app.js           # Express application
│   ├── auth.js          # Authentication & authorization
│   ├── db.js            # Database connection
│   └── routes/
│       ├── admin.js     # Admin API routes
│       ├── metrics.js   # Metrics API
│       ├── projects.js  # Projects API
│       ├── metricInputs.js  # Metric input & calculations
│       ├── testRuns.js
│       ├── defects.js
│       └── metricTargets.js
├── scripts/
│   └── runMigrations.js # Migration runner
├── package.json
└── README.md
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access including admin panel, user management, database operations
- **QA**: Access to metrics, graphs, and data entry
- **Individual**: Access to metrics viewing and graphs
- **Viewer**: Read-only access to dashboard

### Security Features
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with 24-hour expiry
- ✅ Database-backed session management
- ✅ Role-based access control
- ✅ Automatic session cleanup
- ✅ Protected admin routes

### Pages Access
- **Login** (`/login.html`): Public
- **Dashboard** (`/index.html`): All authenticated users
- **Graphs** (`/graphs.html`): All authenticated users
- **Enter Metrics** (`/metrics-input.html`): All authenticated users
- **Admin Panel** (`/admin.html`): **Admin role only**

## 🌐 API Endpoints

### Authentication (Public)
```
POST /api/auth/login       # User login
POST /api/auth/register    # User registration
POST /api/auth/logout      # User logout (requires auth)
```

### Admin Routes (Admin Only)
```
GET  /api/admin/query/:table              # Query database tables
DELETE /api/admin/delete/:table/:id       # Delete records
GET  /api/admin/users                     # List all users
PUT  /api/admin/users/:id/toggle-active   # Activate/deactivate user
GET  /api/admin/metrics                   # Get metric definitions
POST /api/admin/metrics                   # Add new metric
PUT  /api/admin/metrics/:id               # Update metric
```

### Metrics & Data
```
GET  /api/metrics/catalog                     # Metric definitions
GET  /api/projects                            # List projects
POST /api/projects                            # Create project
POST /api/metric-inputs                       # Save metric inputs & calculate
GET  /api/metric-inputs/calculated            # Get calculated metrics
GET  /api/metric-inputs/time-series           # Get time-series data for graphs
```

## 💾 Environment Variables

Create a `.env` file:

```env
# Server
PORT=3000

# Database (optional - uses SQLite by default)
DATABASE_URL=postgres://user:password@host:5432/dbname

# Security (IMPORTANT: Change in production!)
JWT_SECRET=your_super_secret_jwt_key_here
```

## 🔧 Scripts

```bash
npm run migrate    # Apply database migrations
npm run seed       # Seed sample data (optional)
npm run dev        # Development server with nodemon
npm start          # Production server
```

## 🎨 Admin Panel Features

### Database Tab
- Query any table in the database
- View records in formatted table
- **Bulk delete** with checkbox selection
- Select all/individual records
- Tables: users, sessions, projects, metric_inputs, calculated_metrics, metric_definitions

### Users Tab
- Add new users with role selection
- View all existing users
- Activate/deactivate user accounts
- Delete users permanently
- Color-coded role badges

### Projects Tab
- Add new projects
- View all projects
- Delete projects
- Auto-sync across all pages

### Metrics Tab
- Add new metric definitions
- Edit existing metrics
- Enable/disable metrics
- Delete metrics
- Configure metric properties:
  - Metric key (unique identifier)
  - Display name
  - Unit of measurement
  - Direction (HTB/LTB)
  - Description
  - Display order

## 📈 Dashboard Features

- **KPI Cards** grouped by category
- **Date Range Filters** (defaults to current month)
- **Project Filtering**
- **Auto-calculations** based on input data
- **HTB/LTB indicators** for each metric
- **Glassmorphism UI** with smooth animations
- **Responsive grid layout**

## 📊 Graphs Page

- **Bar Charts** for 7 key metrics:
  - Test Design Productivity
  - Test Execution Productivity
  - Test Design Coverage
  - Test Execution Coverage
  - Defect Rejection
  - Effort Variation
  - Automation Coverage
- **Data labels** on bars showing exact values
- **Multi-project comparison** with color coding
- **Date range filtering**
- **Auto-load** on page open
- **Horizontal axis labels**

## 📝 Data Entry

- **3-Section Input Form**: Test Metrics, Quality & Effort, Delivery & Automation
- **Side-by-side layout** on larger screens
- **Default values** for quick testing
- **Project and period selection**
- **Auto-calculation** on save
- **Redirect to dashboard** after successful save

## 🚀 Deployment

### Production Checklist
1. ✅ Set strong `JWT_SECRET` in environment variables
2. ✅ Use PostgreSQL for production (set `DATABASE_URL`)
3. ✅ Change default admin password
4. ✅ Enable HTTPS
5. ✅ Run migrations on production database
6. ✅ Consider adding rate limiting
7. ✅ Set up automated backups

### Deployment Platforms
- **Render**: Set environment variables, connect to PostgreSQL
- **Railway**: Auto-detects Node.js, add PostgreSQL service
- **Heroku**: Add Postgres addon, set config vars
- **DigitalOcean**: Deploy on App Platform with managed database

## 🧪 Testing

### Test Login System
1. Navigate to `http://localhost:3000`
2. Login with `admin` / `admin123`
3. Verify redirect to dashboard
4. Check admin panel access
5. Try creating a QA user
6. Logout and login as QA user
7. Verify admin panel is not accessible

### Test Metrics Flow
1. Login as any user
2. Navigate to "Enter Metrics"
3. Select project and dates
4. Fill in metric input fields
5. Click "Save & Calculate"
6. Verify dashboard shows calculated values
7. Go to "Graphs" page
8. Select date range and view charts

### Test Admin Features
1. Login as admin
2. Navigate to Admin Panel
3. Test each tab:
   - Database: Query tables, bulk delete
   - Users: Add/edit/delete users
   - Projects: Add/delete projects
   - Metrics: Add/edit/delete metrics

## 📚 Documentation

- `AUTHENTICATION_GUIDE.md` - Complete authentication system documentation
- API endpoints fully documented above
- Role-based permissions clearly defined
- Security best practices included

## 🔒 Security Notes

### Password Storage
- All passwords encrypted with bcrypt (10 rounds)
- Never stored in plain text
- Secure comparison during authentication

### Session Management
- 24-hour session expiry
- Database-backed session storage
- Automatic cleanup on logout
- Token validation on every protected request

### Production Security
⚠️ **Before deploying to production:**
1. Change `JWT_SECRET` to a strong random string
2. Change default admin password
3. Enable HTTPS/TLS
4. Add rate limiting middleware
5. Implement CSRF protection
6. Review and update CORS settings
7. Enable security headers (helmet.js)

## 🐛 Troubleshooting

### Login Issues
- Verify database migration completed: `npm run migrate`
- Check default user exists: Query users table
- Check server logs for errors
- Clear browser localStorage and cookies

### Admin Access Denied
- Verify user role is 'admin'
- Check localStorage user data
- Logout and login again

### Graphs Not Showing
- Ensure data has been entered via "Enter Metrics" page
- Check date range matches data entry dates
- Verify calculations were successful
- Check browser console for errors

### Database Errors
- Ensure migrations have run successfully
- Check `metrics.db` file exists (SQLite)
- Verify write permissions
- Check PostgreSQL connection if using DATABASE_URL

## 📦 Dependencies

### Production
- `express` - Web framework
- `sqlite3` + `sqlite` - SQLite database
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `dotenv` - Environment variables
- `chart.js` - Charts library

### Development
- `nodemon` - Auto-restart server

## 📞 Support

For issues or questions:
1. Check this README
2. Review `AUTHENTICATION_GUIDE.md`
3. Check server console logs
4. Check browser console logs
5. Review database tables in Admin Panel

## 📄 License

MIT License - See LICENSE file

## 🎯 Future Enhancements

- [ ] Email notifications for metric thresholds
- [ ] Export reports to PDF/Excel
- [ ] More chart types (line, pie, radar)
- [ ] Historical trend analysis
- [ ] Team collaboration features
- [ ] API documentation with Swagger
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Audit logs for admin actions
- [ ] Custom metric formulas

---

**Built with ❤️ for QA Teams**
