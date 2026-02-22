const express = require('express');
const User = require('../models/User');
const Blog = require('../models/Blog');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get admin statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalBlogs, totalViews, totalComments] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Blog.countDocuments({ status: 'published' }),
      Blog.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Blog.aggregate([
        { $match: { status: 'published' } },
        { $project: { commentsCount: { $size: '$comments' } } },
        { $group: { _id: null, totalComments: { $sum: '$commentsCount' } } }
      ])
    ]);

    const stats = {
      totalUsers,
      totalBlogs,
      totalViews: totalViews[0]?.totalViews || 0,
      totalComments: totalComments[0]?.totalComments || 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
});

// Get all users for admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select('username email role createdAt lastLogin')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ isActive: true });

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get all blogs for admin
router.get('/blogs', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let query = {};
    if (status) {
      query.status = status;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username email')
      .select('title author status createdAt views comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
});

// Update user role
router.patch('/users/:userId/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change your own admin role' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Delete user (soft delete)
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Soft delete user
    user.isActive = false;
    await user.save();

    // Optionally, you can also hide their blogs
    await Blog.updateMany(
      { author: user._id },
      { status: 'archived' }
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
});

// Update blog status
router.patch('/blogs/:blogId/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      { status },
      { new: true, runValidators: true }
    ).populate('author', 'username email');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({
      message: 'Blog status updated successfully',
      blog
    });
  } catch (error) {
    console.error('Update blog status error:', error);
    res.status(500).json({ message: 'Failed to update blog status' });
  }
});

// Feature/unfeature blog
router.patch('/blogs/:blogId/featured', adminAuth, async (req, res) => {
  try {
    const { featured } = req.body;

    const blog = await Blog.findByIdAndUpdate(
      req.params.blogId,
      { featured: Boolean(featured) },
      { new: true }
    ).populate('author', 'username email');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({
      message: `Blog ${featured ? 'featured' : 'unfeatured'} successfully`,
      blog
    });
  } catch (error) {
    console.error('Update blog featured status error:', error);
    res.status(500).json({ message: 'Failed to update blog featured status' });
  }
});

// Get recent activities (for admin dashboard)
router.get('/activities', adminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [recentUsers, recentBlogs, recentComments] = await Promise.all([
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('username email createdAt'),
      
      Blog.find({ status: 'published' })
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title author createdAt views'),
      
      Blog.aggregate([
        { $unwind: '$comments' },
        { $sort: { 'comments.createdAt': -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'comments.author',
            foreignField: '_id',
            as: 'commentAuthor'
          }
        },
        {
          $project: {
            title: 1,
            'comments.content': 1,
            'comments.createdAt': 1,
            'commentAuthor.username': 1
          }
        }
      ])
    ]);

    res.json({
      recentUsers,
      recentBlogs,
      recentComments
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Failed to fetch recent activities' });
  }
});

module.exports = router;