// Blog content, tags, SEO meta
const mongoose = require('mongoose');

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
    },
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    tags: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
    },
    author: {
      type: String,
    },
    featuredImage: {
      type: String,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to auto-generate slug if not provided
blogSchema.pre('save', async function (next) {
  if (!this.slug && this.title) {
    let baseSlug = generateSlug(this.title);
    this.slug = baseSlug;
    
    // Check if slug exists and append number if needed
    const Blog = mongoose.model('Blog');
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingBlog = await Blog.findOne({ slug, _id: { $ne: this._id } });
      if (!existingBlog) {
        this.slug = slug;
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);

