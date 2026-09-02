# Uptula Admin Dashboard

This is a completely isolated admin dashboard for the Uptula job platform. The admin dashboard is designed to be completely separate from the main application to prevent CSS conflicts and maintain clean separation of concerns.

## Features

- **Isolated CSS**: All admin styles are contained in `AdminStyles.css` to prevent conflicts with the main application
- **Admin Authentication**: Secure login with admin credentials
- **Dashboard Overview**: Statistics and charts for platform activity
- **Candidate Management**: View and manage registered candidates
- **Employer Management**: View and manage registered employers
- **Job Management**: View and manage job postings
- **Premium Members**: Track premium membership subscriptions

## Admin Credentials

- **Email**: admin@uptula.com
- **Password**: admin@uptula78945

## File Structure

```
src/Admin/
├── AdminStyles.css          # Isolated CSS for admin dashboard
├── AdminContext.js          # Context for admin state management
├── AdminLogin.js           # Login component
├── AdminDashboard.js       # Main dashboard component
├── AdminRoutes.js          # Admin routing
├── index.js                # Main admin entry point
└── components/
    ├── AdminSidebar.js     # Sidebar navigation
    ├── AdminTopbar.js      # Top navigation bar
    ├── DashboardOverview.js # Dashboard statistics
    ├── CandidatesList.js   # Candidates management
    ├── EmployersList.js    # Employers management
    ├── JobsList.js         # Jobs management
    └── PremiumMembers.js   # Premium members tracking
```

## Usage

The admin dashboard is accessible at `/admin` route. It includes:

1. **Login Page** (`/admin/login`): Admin authentication
2. **Dashboard** (`/admin/dashboard`): Main admin interface with:
   - Platform statistics
   - Recent activity
   - Quick actions
   - Data visualization

## Key Features

### CSS Isolation
- All admin styles are prefixed with `.admin-dashboard` class
- No interference with main application styles
- Responsive design for all screen sizes

### State Management
- React Context for admin state
- JWT token-based authentication
- Real-time data fetching from backend

### Backend Integration
- Admin-specific API endpoints
- Secure authentication middleware
- Database queries for admin data

## API Endpoints

- `POST /api/admin/login` - Admin login
- `GET /api/admin/verify` - Verify admin token
- `GET /api/admin/candidates` - Get all candidates
- `GET /api/admin/employers` - Get all employers
- `GET /api/admin/jobs` - Get all jobs
- `GET /api/admin/premium-members` - Get premium members
- `GET /api/admin/stats` - Get dashboard statistics

## Security

- Admin routes are protected with JWT authentication
- Role-based access control (admin only)
- Secure password handling
- CORS protection

## Development

To add new admin features:

1. Create components in the `components/` directory
2. Add routes to `AdminRoutes.js`
3. Update the sidebar navigation in `AdminSidebar.js`
4. Add backend endpoints in `admin.routes.js`
5. Update the admin context if needed

## Styling

All admin styles are in `AdminStyles.css` and use the `.admin-dashboard` prefix to ensure isolation from the main application styles.
