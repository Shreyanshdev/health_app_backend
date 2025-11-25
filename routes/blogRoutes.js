const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getPublicBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Public endpoint for non-authenticated users (must come before /:slug)
router.get('/public', getPublicBlogs);
// Main blogs route - public, but controller checks for admin to show all blogs
router.get('/', async (req, res, next) => {
  // Try to authenticate, but don't fail if not authenticated
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Token invalid or expired, continue as public user
      req.user = null;
    }
  }
  getBlogs(req, res);
});
router.get('/:slug', getBlog);
router.post('/', protect, admin, createBlog);
router.put('/:id', protect, admin, updateBlog);
router.delete('/:id', protect, admin, deleteBlog);

module.exports = router;

