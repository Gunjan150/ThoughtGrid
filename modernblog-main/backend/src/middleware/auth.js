const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Session-based authentication middleware
const sessionAuth = async (req, res, next) => {
  try {
    // Check if user is logged in via session
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      
      if (!user || !user.isActive) {
        req.session.destroy();
        return res.status(401).json({ message: 'Session invalid' });
      }

      req.user = user;
      return next();
    }

    // Fallback to JWT token authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    await sessionAuth(req, res, () => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'Admin access required' });
      }
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(403).json({ message: 'Admin access required' });
  }
};

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    } else {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = { 
  auth: sessionAuth, 
  adminAuth, 
  optionalAuth 
};