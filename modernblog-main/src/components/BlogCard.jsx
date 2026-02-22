import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { User, Calendar, Eye, Heart, MessageCircle, Clock } from 'lucide-react';
import { BlogStats } from './BlogStats';

export const BlogCard = ({ blog }) => {
  if (!blog || !blog.author) {
    return null;
  }

  return (
    <article className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden group">
      {blog.image && (
        <div className="h-48 overflow-hidden">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {blog.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
            {blog.tags.length > 3 && (
              <span className="text-gray-500 text-xs">+{blog.tags.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex items-center space-x-3 text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{blog.author.username}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          {blog.title}
        </h3>
        
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {blog.excerpt || blog.content?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'}
        </p>
        
        {/* Blog Stats */}
        <div className="mb-4">
          <BlogStats blog={blog} />
        </div>
        
        <div className="flex justify-between items-center">
          <Link
            to={`/blog/${blog._id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Read More
          </Link>
          
          {blog.featured && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
              Featured
            </span>
          )}
        </div>
      </div>
    </article>
  );
};