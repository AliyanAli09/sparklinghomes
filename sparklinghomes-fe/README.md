# BooknMove Frontend

A modern React frontend for the BooknMove platform - connecting customers with verified local movers.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configurations:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=BooknMove
   VITE_APP_VERSION=1.0.0
   NODE_ENV=development
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Visit the application**
   Open: `http://localhost:8080`

## 📋 Tech Stack

- **React 19** - Frontend framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Styling framework
- **Axios** - HTTP client
- **React Icons** - Icon library
- **Framer Motion** - Animation library

## 🏗️ Project Structure

```
booknmove-fe/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Header.jsx      # Navigation header
│   │   ├── Footer.jsx      # Site footer
│   │   ├── Hero.jsx        # Landing page hero
│   │   ├── Features.jsx    # Features section
│   │   ├── ProtectedRoute.jsx # Auth-protected routes
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.jsx        # Landing page
│   │   ├── Login.jsx       # User login
│   │   ├── Register.jsx    # User registration
│   │   ├── Dashboard.jsx   # Customer dashboard
│   │   ├── SearchMovers.jsx # Mover search page
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx # Authentication context
│   ├── services/           # API services
│   │   ├── api.js          # Axios configuration
│   │   ├── auth.js         # Authentication API
│   │   ├── movers.js       # Movers API
│   │   ├── bookings.js     # Bookings API
│   │   ├── reviews.js      # Reviews API
│   │   └── index.js        # Service utilities
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # App entry point
│   └── index.css           # Global styles
├── tailwind.config.js      # Tailwind configuration
├── vite.config.js          # Vite configuration
└── package.json
```

## 🔐 Authentication System

### User Types
- **Customer** - Can search and book movers
- **Mover** - Can provide moving services
- **Admin** - System administration

### Auth Features
- Registration for customers and movers
- JWT-based authentication
- Protected routes based on user type
- Persistent login state
- Automatic token refresh

### Usage Example
```jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }
  
  return <Dashboard user={user} onLogout={logout} />;
}
```

## 🛣️ Routing Structure

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | User login |
| `/register` | Public | User registration |
| `/search` | Public | Search movers |
| `/dashboard` | Customer | Customer dashboard |
| `/mover/dashboard` | Mover | Mover dashboard |
| `/profile` | Auth | Profile settings |
| `/bookings/:id` | Auth | Booking details |

## 🔧 API Services

### Authentication
```javascript
import { authService } from './services';

// Login
const response = await authService.login(email, password, userType);

// Register
const response = await authService.registerUser(userData);

// Get current user
const user = await authService.getCurrentUser();
```

### Movers
```javascript
import { moversService } from './services';

// Search movers
const movers = await moversService.searchMovers({
  zipCode: '78701',
  services: ['local-moving'],
  maxPrice: 150
});

// Get mover details
const mover = await moversService.getMover(moverId);
```

### Bookings
```javascript
import { bookingsService } from './services';

// Create booking
const booking = await bookingsService.createBooking(bookingData);

// Get user bookings
const bookings = await bookingsService.getUserBookings();
```

## 🎨 Component Examples

### Protected Route
```jsx
<ProtectedRoute allowedUserTypes={['customer']}>
  <Dashboard />
</ProtectedRoute>
```

### Search Filters
```jsx
<SearchMovers 
  initialFilters={{ zipCode: '78701' }}
  onMoverSelect={(mover) => navigate(`/movers/${mover.id}`)}
/>
```

### Authentication Context
```jsx
<AuthProvider>
  <Router>
    <App />
  </Router>
</AuthProvider>
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_APP_NAME` | Application name | No |
| `VITE_APP_VERSION` | App version | No |

### Tailwind Theme
Custom color palette defined in `tailwind.config.js`:
- **Primary**: Blue shades for main UI elements
- **Red**: Accent colors for CTAs
- **Dark**: Various gray shades

## 📱 Features Implemented

### ✅ Core Features
- [x] Responsive landing page
- [x] User authentication (login/register)
- [x] Protected routing system
- [x] Customer dashboard
- [x] Mover search with filters
- [x] Navigation with auth state
- [x] API service layer
- [x] Error handling

### 🚧 In Progress
- [ ] Booking creation flow
- [ ] Payment integration
- [ ] Real-time messaging
- [ ] Photo uploads
- [ ] Review system
- [ ] Mover dashboard

### 📋 Planned Features
- [ ] Advanced search filters
- [ ] Map integration
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Admin dashboard

## 🛠️ Development

### Available Scripts
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Style
- ES6+ JavaScript
- Functional components with hooks
- TailwindCSS for styling
- Component-based architecture

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Setup
1. Set production API URL
2. Configure environment variables
3. Build and deploy to hosting platform

### Hosting Recommendations
- **Vercel** - Easy deployment from Git
- **Netlify** - Great for static sites
- **AWS S3 + CloudFront** - Scalable solution

## 🔗 Integration with Backend

The frontend communicates with the BooknMove backend API:
- Base URL: `http://localhost:5000/api`
- Authentication: JWT tokens
- Content-Type: `application/json`

### API Endpoints Used
- `POST /auth/login` - User authentication
- `POST /auth/register/user` - Customer registration
- `POST /auth/register/mover` - Mover registration
- `GET /movers/search` - Search movers
- `POST /bookings` - Create booking
- `GET /users/me/bookings` - Get user bookings

## 📝 Next Steps

1. **Complete Authentication Integration** - Connect login/register to backend
2. **Implement Booking Flow** - Full booking creation process
3. **Add Payment Processing** - Stripe integration
4. **Build Mover Dashboard** - Complete mover interface
5. **Add Real-time Features** - Live chat and notifications
