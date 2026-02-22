import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BlogCard } from '../components/BlogCard';
import { SearchBar } from '../components/SearchBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Filter, TrendingUp, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export const Home = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [featuredBlogs, setFeaturedBlogs] = useState([]);

  useEffect(() => {
    fetchBlogs();
  }, [sortBy]);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(`/blogs?sort=${sortBy}&search=${searchTerm}`);
      setBlogs(response.data.blogs || []);
      
      // Get featured blogs
      const featuredResponse = await axios.get('/blogs?sort=featured&limit=3');
      setFeaturedBlogs(featuredResponse.data.blogs || []);
    } catch (error) {
      console.error('Fetch blogs error:', error);
      toast.error('Failed to fetch blogs');
      setBlogs([]);
      setFeaturedBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    fetchBlogs();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Welcome to ModernBlog
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover amazing stories, insights, and ideas from our community of writers.
            Share your thoughts and connect with like-minded individuals.
          </p>
          
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search for articles, authors, or topics..."
            />
          </div>
        </div>
      </section>

      {/* Featured Blogs */}
      {featuredBlogs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-12">
          <div className="flex items-center space-x-2 mb-6">
            <Star className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBlogs.map((blog) => (
              <div key={blog._id} className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </span>
                </div>
                <BlogCard blog={blog} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter and Sort */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <span className="text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
              <option value="oldest">Oldest</option>
              <option value="featured">Featured</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <TrendingUp className="h-5 w-5" />
            <span>{blogs.length} articles found</span>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {blogs?.length === 0 ? (
          <div className="text-center py-16">
            <div className="space-y-4">
              <p className="text-xl text-gray-600">
                {searchTerm ? `No blogs found for "${searchTerm}"` : 'No blogs found. Be the first to create one!'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};