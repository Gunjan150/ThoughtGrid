import React from 'react';
import { Eye, Heart, MessageCircle, Share2, Clock } from 'lucide-react';

export const BlogStats = ({ blog, showReadTime = true }) => {
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-500">
      <div className="flex items-center space-x-1">
        <Eye className="h-4 w-4" />
        <span>{formatNumber(blog.views || 0)}</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <Heart className="h-4 w-4" />
        <span>{formatNumber(blog.likes?.length || 0)}</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <MessageCircle className="h-4 w-4" />
        <span>{formatNumber(blog.comments?.length || 0)}</span>
      </div>
      
      {showReadTime && blog.readTime && (
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4" />
          <span>{blog.readTime} min read</span>
        </div>
      )}
    </div>
  );
};