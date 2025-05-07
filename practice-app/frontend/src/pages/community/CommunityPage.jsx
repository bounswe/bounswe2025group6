import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/CommunityPage.css';

const CommunityPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const mockPosts = [
    {
      id: 1,
      userId: 101,
      username: "HealthyEater",
      title: "Weekly Meal Prep Under ₺100 Per Person",
      content: "I've been meal prepping for a family of 4 on a budget...",
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      likes: 15,
      comments: 8,
      tags: ["Budget", "MealPrep", "Family"],
      userAvatar: "https://via.placeholder.com/40"
    },
    {
      id: 2,
      userId: 102,
      username: "VeganChef",
      title: "Creative Ways to Use Stale Bread?",
      content: "I often have leftover bread that goes stale...",
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      likes: 23,
      comments: 14,
      tags: ["NoWaste", "Sustainability", "Tips"],
      userAvatar: "https://via.placeholder.com/40"
    },
    {
      id: 3,
      userId: 103,
      username: "MeatLover",
      title: "Affordable Gluten-Free Snack Ideas",
      content: "Finding affordable gluten-free snacks can be challenging...",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      likes: 7,
      comments: 3,
      tags: ["GlutenFree", "Budget", "Snacks"],
      userAvatar: "https://via.placeholder.com/40"
    },
    {
      id: 4,
      userId: 104,
      username: "NutritionExpert",
      title: "How to Balance Macros on a Budget",
      content: "Balancing your macros doesn't have to be expensive...",
      timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
      likes: 31,
      comments: 12,
      tags: ["Nutrition", "Budget", "HealthyEating"],
      userAvatar: "https://via.placeholder.com/40"
    },
    {
      id: 5,
      userId: 105,
      username: "StudentCook",
      title: "Quick Meals for Busy Students",
      content: "As a student, I'm always short on time...",
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      likes: 42,
      comments: 18,
      tags: ["Student", "Quick", "Budget"],
      userAvatar: "https://via.placeholder.com/40"
    }
  ];

  const allTags = [...new Set(mockPosts.flatMap(post => post.tags))];

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        setTimeout(() => {
          setPosts(mockPosts);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error loading posts:', error);
        toast.error('Failed to load community posts');
        setIsLoading(false);
      }
    };
    loadPosts();
  }, [toast]);

  const handleLike = (postId) => {
    if (!currentUser) {
      toast.info('Please log in to like posts');
      return;
    }
    setPosts(prevPosts => prevPosts.map(post => post.id === postId ? { ...post, likes: post.likes + 1 } : post));
    toast.success('Post liked!');
  };

  const goToPostDetail = (postId) => navigate(`/community/post/${postId}`);

  const goToUserProfile = (e, userId, username) => {
    e.stopPropagation();
    navigate(`/community/profile/${userId}`, { state: { username } });
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredAndSortedPosts = posts.filter(post => {
    const matchSearch = searchTerm ? post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchTag = selectedTag ? post.tags.includes(selectedTag) : true;
    return matchSearch && matchTag;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'recent': return new Date(b.timestamp) - new Date(a.timestamp);
      case 'popular': return b.likes - a.likes;
      case 'comments': return b.comments - a.comments;
      default: return new Date(b.timestamp) - new Date(a.timestamp);
    }
  });

  return (
    <div className="community-container">
      <div className="community-header">
        <div>
          <h1 className="community-title">Community</h1>
          <p className="community-subtitle">Join discussions, share ideas, and connect with others</p>
        </div>
        <Button onClick={() => navigate('/community/create')}>Create Post</Button>
      </div>

      <Card className="community-filters">
        <Card.Body>
          <div className="community-filter-row">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="community-input"
            />
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="community-select">
              <option value="">All Tags</option>
              {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="community-select">
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="comments">Most Comments</option>
            </select>
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <div className="community-loading">Loading posts...</div>
      ) : filteredAndSortedPosts.length > 0 ? (
        <div className="community-posts">
          {filteredAndSortedPosts.map(post => (
            <Card key={post.id} className="community-post-card" onClick={() => goToPostDetail(post.id)}>
              <Card.Body>
                <div className="community-post">
                  <div className="community-avatar" onClick={(e) => goToUserProfile(e, post.userId, post.username)}>
                    <img src={post.userAvatar} alt={post.username} />
                  </div>
                  <div className="community-post-content">
                    <div className="community-post-header">
                      <span onClick={(e) => goToUserProfile(e, post.userId, post.username)}>{post.username}</span>
                      <span>{formatDate(post.timestamp)}</span>
                    </div>
                    <h2>{post.title}</h2>
                    <p>{post.content}</p>
                    <div className="community-tags">
                      {post.tags.map((tag, idx) => <span key={idx}>#{tag}</span>)}
                    </div>
                    <div className="community-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}>❤️ {post.likes}</button>
                      <button onClick={(e) => { e.stopPropagation(); goToPostDetail(post.id); }}>💬 {post.comments}</button>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Card.Body className="community-empty">
            <h2>No posts found</h2>
            <p>{searchTerm || selectedTag ? 'Try adjusting your search criteria' : 'Be the first to start a discussion!'}</p>
            {(searchTerm || selectedTag) && <Button onClick={() => { setSearchTerm(''); setSelectedTag(''); }}>Clear Filters</Button>}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CommunityPage;
