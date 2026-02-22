const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Blog = require('../models/Blog');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all blogs (public)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sort').optional().isIn(['latest', 'oldest', 'popular', 'featured']).withMessage('Invalid sort option'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sort || 'latest';
    const search = req.query.search;

    // Build query
    let query = { status: 'published' };
    
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'popular':
        sort = { views: -1, createdAt: -1 };
        break;
      case 'featured':
        sort = { featured: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const blogs = await Blog.find(query)
      .populate('author', 'username avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title excerpt image author createdAt views readTime featured tags');

    const total = await Blog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalBlogs: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ message: 'Server error while fetching blogs' });
  }
});
// Get user's blogs
router.get('/my-blogs', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title excerpt image createdAt views status readTime');

    const total = await Blog.countDocuments({ author: req.user._id });

    res.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBlogs: total
      }
    });
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ message: 'Server error while fetching your blogs' });
  }
});

// Get single blog (public)
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('comments.author', 'username avatar');

    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json({ blog });
  } catch (error) {
    console.error('Get blog error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(500).json({ message: 'Server error while fetching blog' });
  }
});

// Create blog (authenticated)
router.post('/', auth, [
  body('title')
    .trim()
    .notEmpty()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .notEmpty()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Excerpt cannot exceed 300 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Each tag must be between 2 and 20 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, excerpt, image, tags, category, featured } = req.body;

    // Generate excerpt if not provided
    const autoExcerpt = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';

    const blog = new Blog({
      title,
      content,
      excerpt: autoExcerpt,
      image,
      author: req.user._id,
      tags: tags || [],
      category: category || 'General',
      featured: req.user.role === 'admin' ? featured : false
    });

    await blog.save();
    await blog.populate('author', 'username avatar');

    res.status(201).json({
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ message: 'Server error while creating blog' });
  }
});

// Update blog (author or admin)
router.put('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 50 }),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 300 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this blog' });
    }

    const updateData = { ...req.body };
    
    // Only admin can change featured status
    if (req.user.role !== 'admin') {
      delete updateData.featured;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'username avatar');

    res.json({
      message: 'Blog updated successfully',
      blog: updatedBlog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ message: 'Server error while updating blog' });
  }
});

// Delete blog (author or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is author or admin
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this blog' });
    }

    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Server error while deleting blog' });
  }
});



// Add comment to blog
router.post('/:id/comments', auth, [
  body('content')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const blog = await Blog.findById(req.params.id);
    
    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const newComment = {
      content: req.body.content,
      author: req.user._id,
      parentId: req.body.parentId || null
    };

    blog.comments.push(newComment);
    await blog.save();

    await blog.populate('comments.author', 'username avatar');
    
    const addedComment = blog.comments[blog.comments.length - 1];

    res.status(201).json({
      message: 'Comment added successfully',
      comment: addedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// Update comment
router.put('/:blogId/comments/:commentId', auth, [
  body('content')
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const blog = await Blog.findById(req.params.blogId);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = blog.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.content = req.body.content;
    comment.updatedAt = new Date();
    
    await blog.save();
    await blog.populate('comments.author', 'username avatar');
    
    const updatedComment = blog.comments.id(req.params.commentId);

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error while updating comment' });
  }
});

// Delete comment (comment author or admin)
router.delete('/:blogId/comments/:commentId', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = blog.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    blog.comments.pull(req.params.commentId);
    await blog.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error while deleting comment' });
  }
});

// Toggle like on blog
router.post('/:id/like', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog || blog.status !== 'published') {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const userIndex = blog.likes.indexOf(req.user._id);
    
    if (userIndex > -1) {
      blog.likes.splice(userIndex, 1);
    } else {
      blog.likes.push(req.user._id);
    }

    await blog.save();

    res.json({
      message: userIndex > -1 ? 'Blog unliked' : 'Blog liked',
      likesCount: blog.likes.length,
      isLiked: userIndex === -1
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error while toggling like' });
  }
});

module.exports = router;