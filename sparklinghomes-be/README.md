# BooknMove Backend API

A comprehensive REST API for the BooknMove platform - connecting customers with verified local movers.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
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
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/booknmove
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:8080
   ```

3. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

4. **Health Check**
   Visit: `http://localhost:5000/health`

## 📋 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication (`/auth`)
- `POST /auth/register/user` - Register customer
- `POST /auth/register/mover` - Register mover
- `POST /auth/login` - Login user/mover
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `PUT /auth/update-profile` - Update profile
- `PUT /auth/update-password` - Update password

#### Users (`/users`)
- `GET /users` - Get all users (Admin)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/me/bookings` - Get user bookings
- `GET /users/me/reviews` - Get user reviews

#### Movers (`/movers`)
- `GET /movers/search` - Search movers (Public)
- `GET /movers/:id` - Get mover by ID (Public)
- `GET /movers/:id/reviews` - Get mover reviews (Public)
- `PUT /movers/:id` - Update mover
- `DELETE /movers/:id` - Delete mover
- `GET /movers/me/bookings` - Get mover bookings
- `PUT /movers/availability` - Update availability
- `PUT /movers/pricing` - Update pricing

#### Bookings (`/bookings`)
- `POST /bookings` - Create booking
- `GET /bookings` - Get all bookings (Admin)
- `GET /bookings/:id` - Get booking
- `PUT /bookings/:id` - Update booking
- `POST /bookings/:id/quote` - Provide quote (Mover)
- `POST /bookings/:id/accept-quote` - Accept quote (Customer)
- `POST /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/complete` - Complete booking (Mover)
- `GET /bookings/:id/messages` - Get booking messages
- `POST /bookings/:id/messages` - Add message

#### Reviews (`/reviews`)
- `GET /reviews` - Get reviews (Public)
- `POST /reviews` - Create review
- `GET /reviews/:id` - Get review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `POST /reviews/:id/helpful` - Mark helpful
- `POST /reviews/:id/report` - Report review
- `POST /reviews/:id/respond` - Respond to review

## 🏗️ Architecture

### Database Models

1. **User** - Customer accounts
2. **Mover** - Moving service providers
3. **Booking** - Moving requests and bookings
4. **Review** - Customer and mover reviews

### Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- Role-based access control

### File Structure

```
booknmove-be/
├── config/
│   ├── database.js      # MongoDB connection
│   └── cloudinary.js    # Cloudinary setup
├── controllers/         # Route controllers
├── middleware/          # Custom middleware
├── models/             # Mongoose models
├── routes/             # Route definitions
├── utils/              # Utility functions
├── server.js           # Main server file
└── package.json
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRE` | JWT expiration time | No (default: 7d) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:8080) |

### User Types & Roles

- **Customer** (`customer`): Can create bookings, leave reviews
- **Mover** (`mover`): Can provide quotes, manage bookings
- **Admin** (`admin`): Full system access

## 🚀 Next Steps

1. **Set up Cloudinary** for image uploads
2. **Configure email service** for notifications
3. **Add payment integration** (Stripe)
4. **Implement real-time features** (Socket.io)
5. **Add geocoding service** for location features
6. **Set up comprehensive testing**

## 📝 Notes

- All routes are properly secured with authentication and authorization
- Database models include comprehensive validation
- Error handling is centralized and consistent
- Code is modular and follows best practices
- Ready for production deployment
