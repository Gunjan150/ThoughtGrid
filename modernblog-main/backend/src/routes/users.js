const express = require('express');
const Blog = require('../models/Blog');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalBlogs, totalViews, totalComments] = await Promise.all([
      Blog.countDocuments({ author: userId }),
      Blog.aggregate([
        { $match: { author: userId } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Blog.aggregate([
        { $match: { author: userId } },
        { $project: { commentsCount: { $size: '$comments' } } },
        { $group: { _id: null, totalComments: { $sum: '$commentsCount' } } }
      ])
    ]);

    const stats = {
      totalBlogs,
      totalViews: totalViews[0]?.totalViews || 0,
      totalComments: totalComments[0]?.totalComments || 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

// Get user profile by ID
router.get('/:userId/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username avatar bio createdAt')
      .where('isActive', true);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's published blogs
    const blogs = await Blog.find({ 
      author: req.params.userId, 
      status: 'published' 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title excerpt image createdAt views');

    // Get user stats
    const [totalBlogs, totalViews] = await Promise.all([
      Blog.countDocuments({ author: req.params.userId, status: 'published' }),
      Blog.aggregate([
        { $match: { author: req.params.userId, status: 'published' } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ])
    ]);

    res.json({
      user,
      blogs,
      stats: {
        totalBlogs,
        totalViews: totalViews[0]?.totalViews || 0
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

module.exports = router;