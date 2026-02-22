# Modern Blog Website

A comprehensive full-stack blog platform built with React, Node.js, Express, and MongoDB. Features include user authentication, blog management, comments system, admin panel, and Cloudinary integration for image uploads.

## 🚀 Features

### Frontend
- **Modern React App**: Built with React 18 + TypeScript
- **Beautiful UI**: Tailwind CSS with gradient backgrounds and smooth animations
- **Responsive Design**: Mobile-first approach with breakpoints for all devices
- **Authentication**: Login/Register with JWT tokens
- **Blog Management**: Create, edit, delete blogs with rich text editor
- **Comments System**: Real-time commenting with CRUD operations
- **User Profiles**: Personal dashboard with blog statistics
- **Admin Panel**: Comprehensive admin dashboard for content moderation
- **Image Uploads**: Drag-and-drop image uploads via Cloudinary
- **Search & Filtering**: Advanced search and sorting capabilities
- **Protected Routes**: Route protection based on authentication and roles

### Backend
- **Node.js + Express**: RESTful API with comprehensive error handling
- **MongoDB**: Document-based database with Mongoose ODM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Uploads**: Cloudinary integration for image storage and optimization
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Admin Features**: User management, content moderation, analytics
- **Comment System**: Nested comments with author verification
- **Blog Features**: Views tracking, likes, categories, and tags
- **Search**: Full-text search across blogs and content

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- React Hook Form for form handling
- React Hot Toast for notifications
- React Quill for rich text editing
- Framer Motion for animations
- Date-fns for date formatting

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt.js for password hashing
- Cloudinary for image storage
- Multer for file uploads
- Express Validator for input validation
- Helmet for security headers
- Express Rate Limit for API protection
- Morgan for logging
- CORS for cross-origin requests

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account for image uploads

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd modern-blog
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/modern-blog
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   NODE_ENV=development
   ```

5. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

6. **Run the application**
   
   **Option 1: Run both frontend and backend together**
   ```bash
   npm run dev:full
   ```
   
   **Option 2: Run separately**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Blog Endpoints
- `GET /api/blogs` - Get all blogs (with pagination and search)
- `GET /api/blogs/:id` - Get single blog
- `POST /api/blogs` - Create new blog (authenticated)
- `PUT /api/blogs/:id` - Update blog (author/admin only)
- `DELETE /api/blogs/:id` - Delete blog (author/admin only)
- `GET /api/blogs/my-blogs` - Get user's blogs

### Comment Endpoints
- `POST /api/blogs/:id/comments` - Add comment to blog
- `DELETE /api/blogs/:blogId/comments/:commentId` - Delete comment

### Upload Endpoints
- `POST /api/upload/image` - Upload single image to Cloudinary
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image from Cloudinary

### Admin Endpoints
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/blogs` - Get all blogs
- `PATCH /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Deactivate user

### User Endpoints
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/:userId/profile` - Get user public profile

## 🔐 Authentication & Authorization

The application uses JWT (JSON Web Tokens) for authentication:

1. **User Registration/Login**: Users receive a JWT token upon successful authentication
2. **Token Storage**: Tokens are stored in localStorage on the frontend
3. **Protected Routes**: Certain routes require authentication (viewing blog details, creating blogs, etc.)
4. **Role-Based Access**: Admin users have additional permissions for content moderation
5. **Token Expiration**: Tokens expire after 7 days for security

## 👥 User Roles

### Regular User
- Create, edit, and delete their own blogs
- View and comment on published blogs
- Manage their profile and view statistics
- Upload images for their blogs

### Admin User
- All regular user permissions
- Access to admin dashboard
- Manage all users (promote/demote, deactivate)
- Moderate all blog content (edit, delete, feature)
- View comprehensive site statistics
- Manage comments across all blogs

## 🎨 Design Features

- **Modern UI**: Clean, professional design with subtle animations
- **Responsive**: Mobile-first design that works on all screen sizes
- **Dark Theme Support**: Ready for dark theme implementation
- **Accessibility**: Proper semantic HTML and keyboard navigation
- **Performance**: Optimized images, lazy loading, and efficient API calls
- **User Experience**: Intuitive navigation, loading states, and error handling

## 🔒 Security Features

- **Input Validation**: Server-side validation for all user inputs
- **Password Hashing**: Bcrypt with salt rounds for secure password storage
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured for specific origins
- **Security Headers**: Helmet.js for security headers
- **Authentication**: JWT tokens with expiration
- **File Upload Security**: File type and size restrictions
- **SQL Injection Protection**: MongoDB's natural protection + input sanitization

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All components adapt gracefully to different screen sizes with optimized layouts and navigation patterns.

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables if needed

### Backend (Heroku/Railway/DigitalOcean)
1. Set up your MongoDB Atlas database
2. Configure environment variables on your hosting platform
3. Deploy the `backend` folder
4. Update CORS settings for production

### Environment Variables for Production
Make sure to update these for production:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A secure, randomly generated secret
- `CLOUDINARY_*`: Your Cloudinary credentials
- `NODE_ENV=production`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

- [ ] Real-time notifications
- [ ] Social media sharing
- [ ] Email newsletter subscription
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] SEO optimization
- [ ] Progressive Web App (PWA) features
- [ ] Content scheduling
- [ ] Blog categories and advanced filtering
- [ ] User following system#   m o d e r n b l o g  
 