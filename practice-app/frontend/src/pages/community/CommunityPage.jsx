// src/pages/community/CommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import ReportButton from '../../components/report/ReportButton';
import Card from '../../components/ui/Card';
import forumService from '../../services/forumService';
import userService from '../../services/userService.js';
import '../../styles/CommunityPage.css';
import { useTranslation } from "react-i18next";

const CommunityPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [userMap, setUserMap] = useState({});
  const [userVotes, setUserVotes] = useState({});  // { postId: 'up' | 'down' }

  // Available tags from API documentation
  const availableTags = [
    'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
    'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
    'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
  ];

  useEffect(() => {
    loadPosts();
  }, [pagination.page]);

  // Apply filters when the Apply Filters button is clicked
  const applyFilters = () => {
    const filtered = posts.filter(post => {
      const matchSearch = searchTerm 
        ? post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) 
        : true;
      const matchTag = selectedTag ? post.tags.includes(selectedTag) : true;
      return matchSearch && matchTag;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.created_at) - new Date(a.created_at);
        case 'popular': return b.upvote_count - a.upvote_count;
        case 'comments': return (b.comments_count || 0) - (a.comments_count || 0);
        default: return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    
    setFilteredPosts(filtered);
  };

  // Reset filters to default state
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTag('');
    setSortBy('recent');
    setFilteredPosts(posts); // Reset to original posts
  };

  // Initialize filtered posts when posts are loaded
  useEffect(() => {
    setFilteredPosts(posts);
  }, [posts]);

  const loadPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching posts with page:", pagination.page, "page_size:", pagination.page_size);
      const data = await forumService.getPosts(pagination.page, pagination.page_size);
      console.log("Response data:", data);
      
      // Set the posts
      setPosts(data.results || []);
      setFilteredPosts(data.results || []); // Initialize filtered posts too
      setPagination({
        page: data.page || 1,
        page_size: data.page_size || 10,
        total: data.total || 0
      });
      
      // Get unique author IDs to fetch their details
      const authorIds = [...new Set((data.results || []).map(post => post.author))];
      fetchUserDetails(authorIds);
      
      // Load user votes for the current posts
      if (currentUser) {
        await loadUserVotes(data.results || []);
      }
      
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load forum posts');
      toast.error('Failed to load forum posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Load vote status for all visible posts
  const loadUserVotes = async (postsList) => {
    if (!currentUser || !postsList.length) return;
    
    const newVotes = { ...userVotes };
    
    for (const post of postsList) {
      try {
        const voteStatus = await forumService.checkPostVoteStatus(post.id);
        if (voteStatus.hasVoted) {
          newVotes[post.id] = voteStatus.voteType;
        }
      } catch (error) {
        console.error(`Error checking vote for post ${post.id}:`, error);
      }
    }
    
    setUserVotes(newVotes);
  };

  // Function to fetch user details and store them in userMap
  const fetchUserDetails = async (userIds) => {
    try {
      const newUserMap = { ...userMap };
      
      // Fetch only users that aren't already in our map
      const idsToFetch = userIds.filter(id => !newUserMap[id]);
      
      if (idsToFetch.length > 0) {
        // This would be your actual API call to get user details
        for (const userId of idsToFetch) {
          try {
            const userDetails = await userService.getUserById(userId);
            newUserMap[userId] = userDetails;
          } catch (error) {
            console.error(`Error fetching details for user ${userId}:`, error);
            // Use a placeholder for users we couldn't fetch
            newUserMap[userId] = { id: userId, username: `User ${userId}` };
          }
        }
        
        setUserMap(newUserMap);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Function to get user's name/username from userMap
  const getUserName = (userId) => {
    if (!userMap[userId]) {
      return `User #${userId}`;  // Fallback if user details not available
    }
    
    // Return username or full name depending on what's available
    return userMap[userId].username || 
           (userMap[userId].first_name && userMap[userId].last_name ? 
            `${userMap[userId].first_name} ${userMap[userId].last_name}` : 
            `User #${userId}`);
  };

  // Updated CommunityPage handleVote function to match the fixed endpoints

  const handleVote = async (postId, voteType) => {
    if (!currentUser) {
      toast.info('Please log in to vote on posts');
      return;
    }

    try {
      // Check if user has already voted on this post
      const currentVote = userVotes[postId];
      
      // If already voted with same type, remove the vote
      if (currentVote === voteType) {
        // Optimistic update
        setUserVotes(prev => {
          const updated = { ...prev };
          delete updated[postId];
          return updated;
        });
        
        // Update post counts
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            if (voteType === 'up') {
              return { ...post, upvote_count: Math.max(0, post.upvote_count - 1) };
            } else {
              return { ...post, downvote_count: Math.max(0, post.downvote_count - 1) };
            }
          }
          return post;
        }));
        
        // Also update filtered posts
        setFilteredPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            if (voteType === 'up') {
              return { ...post, upvote_count: Math.max(0, post.upvote_count - 1) };
            } else {
              return { ...post, downvote_count: Math.max(0, post.downvote_count - 1) };
            }
          }
          return post;
        }));
        
        await forumService.deleteVotePost(postId);
        toast.success('Vote removed!');
      } 
      // If already voted but with different type, remove old vote first then create new one
      else if (currentVote) {
        // Optimistic update
        setUserVotes(prev => ({
          ...prev,
          [postId]: voteType
        }));
        
        // Update post counts
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            if (voteType === 'up') {
              return { 
                ...post, 
                upvote_count: Math.max(0, post.upvote_count + 1),
                downvote_count: Math.max(0, post.downvote_count - 1) 
              };
            } else {
              return { 
                ...post, 
                upvote_count: Math.max(0, post.upvote_count - 1),
                downvote_count: Math.max(0, post.downvote_count + 1) 
              };
            }
          }
          return post;
        }));
        
        // Also update filtered posts
        setFilteredPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            if (voteType === 'up') {
              return { 
                ...post, 
                upvote_count: Math.max(0, post.upvote_count + 1),
                downvote_count: Math.max(0, post.downvote_count - 1) 
              };
            } else {
              return { 
                ...post, 
                upvote_count: Math.max(0, post.upvote_count - 1),
                downvote_count: Math.max(0, post.downvote_count + 1) 
              };
            }
          }
          return post;
        }));
        
        // Delete old vote first
        try {
          await forumService.deleteVotePost(postId);
        } catch (err) {
          console.log("Error deleting vote, but will continue:", err);
          // Continue despite error - we'll still try to create the new vote
        }
        
        // Then create new vote
        await forumService.votePost(postId, voteType);
        toast.success(`Post ${voteType}voted!`);
      }
      // If not voted before, simply create vote
      else {
        // Optimistic update
        setUserVotes(prev => ({
          ...prev,
          [postId]: voteType
        }));
        
        // Update post counts
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            if (voteType === 'up') {
              return { ...post, upvote_count: post.upvote_count + 1 };
            } else {
              return { ...post, downvote_count: post.downvote_count + 1 };
            }
          }
          return post;
        }));
        
        // Also update filtered posts
        setFilteredPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            if (voteType === 'up') {
              return { ...post, upvote_count: post.upvote_count + 1 };
            } else {
              return { ...post, downvote_count: post.downvote_count + 1 };
            }
          }
          return post;
        }));
        
        await forumService.votePost(postId, voteType);
        toast.success(`Post ${voteType}voted!`);
      }
    } catch (error) {
      // Revert optimistic updates
      loadPosts();
      console.error('Error voting on post:', error);
      toast.error('Failed to vote on post');
    }
  };

  const handleRemoveVote = async (postId) => {
    if (!currentUser) {
      toast.info('Please log in to manage your votes');
      return;
    }

    if (!userVotes[postId]) {
      toast.info('You have not voted on this post');
      return;
    }

    try {
      const voteType = userVotes[postId];
      
      // Optimistic update
      setUserVotes(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });
      
      // Update post counts
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          if (voteType === 'up') {
            return { ...post, upvote_count: Math.max(0, post.upvote_count - 1) };
          } else {
            return { ...post, downvote_count: Math.max(0, post.downvote_count - 1) };
          }
        }
        return post;
      }));
      
      // Also update filtered posts
      setFilteredPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          if (voteType === 'up') {
            return { ...post, upvote_count: Math.max(0, post.upvote_count - 1) };
          } else {
            return { ...post, downvote_count: Math.max(0, post.downvote_count - 1) };
          }
        }
        return post;
      }));
      
      await forumService.deleteVotePost(postId);
      toast.success('Vote removed successfully!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.info('No vote found to remove');
      } else {
        toast.error('Failed to remove vote');
      }
      
      // Revert optimistic updates on error
      loadPosts();
    }
  };

  const goToPostDetail = (postId) => navigate(`/community/post/${postId}`);

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

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(pagination.total / pagination.page_size)) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  useEffect(() => {
    document.title = "Community";
  }, []);

  return (
    <div className="forum-container">
      <div className="forum-header">
        <div>
          <h1 className="forum-title">{t("communityPageTitle")}</h1>
          <p className="forum-subtitle">{t("communityPageSubTitle")}</p>
        </div>
        <Button className="forum-create-button" onClick={() => navigate('/community/create')}>{t("communityPageCreatePost")}</Button>
      </div>

      <Card className="forum-filters">
        <Card.Body>
          <div className="forum-filter-row">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="forum-input"
            />
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="forum-select">
              <option value="">{t("communityPageAllTags")}</option>
              {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="forum-select">
              <option value="recent">{t("communityPageMostRecent")}</option>
              <option value="popular">{t("communityPageMostPopular")}</option>
              <option value="comments">{t("communityPageMostComments")}</option>
            </select>
          </div>
          
          {/* Filter action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button 
              onClick={applyFilters} 
              className="apply-filters-btn"
            >
              {t("communityPageApplyFilters")}
            </button>
            <button 
              onClick={resetFilters} 
              className="reset-filters-btn"
            >
              {t("communityPageResetFilters")}
            </button>
          </div>
        </Card.Body>
      </Card>

      {error && (
        <Card className="forum-error">
          <Card.Body>
            <h2>{t("communityPageErrorLoading")}</h2>
            <p>{error}</p>
            <Button onClick={loadPosts}>{t("TryAgain")}</Button>
          </Card.Body>
        </Card>
      )}

      {isLoading ? (
        <div className="forum-loading">{t("communityPageLoadingPosts")}</div>
      ) : filteredPosts.length > 0 ? (
        <div className="forum-posts">
          {filteredPosts.map(post => (
            <Card key={post.id} className="forum-post-card" onClick={() => goToPostDetail(post.id)}>
              <Card.Body>
                <div className="forum-post">
                  <div className="forum-post-content">
                    <div className="forum-post-header">
                      <span className="post-author-wrapper">
                        Posted by{" "}
                        <span 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent post detail navigation
                            navigate(`/community/profile/${post.author}`);
                          }}
                          className="author-link"
                        >
                          {getUserName(post.author)}
                        </span>
                      </span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    <h2>{post.title}</h2>
                    <p>{post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}</p>
                    <div className="forum-tags">
                      {post.tags.map((tag, idx) => <span key={idx}>#{tag}</span>)}
                    </div>
                    <div className="forum-actions">
                      <div className="vote-buttons">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleVote(post.id, 'up'); 
                          }}
                          className={`vote-button ${userVotes[post.id] === 'up' ? 'voted-up' : ''}`}
                          aria-label="Upvote"
                        >
                          ▲ {post.upvote_count}
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleVote(post.id, 'down'); 
                          }}
                          className={`vote-button ${userVotes[post.id] === 'down' ? 'voted-down' : ''}`}
                          aria-label="Downvote"
                        >
                          ▼ {post.downvote_count}
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleRemoveVote(post.id); 
                          }}
                          className={`vote-button ${!userVotes[post.id] ? 'disabled' : ''}`}
                          aria-label="Remove vote"
                          disabled={!userVotes[post.id]}
                        >
                          {t("communityPageRemoveVote")}
                        </button>
                      </div>
                      <div className="post-stats">
                        <span>👁️ {post.view_count} {t("communityPageViews")}</span>
                      </div>
                      {/* Report button for posts - only if not owner */}
                      {currentUser && post.author !== currentUser.id && (
                        <div style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                          <ReportButton targetType="post" targetId={post.id} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.total > pagination.page_size && (
            <div className="forum-pagination">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-button"
              >
                {t("previous")}
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.page_size)}
              </span>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
                className="pagination-button"
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <Card.Body className="forum-empty">
            <h2>{t("communityPageForumEmpty")}</h2>
            <p>{searchTerm || selectedTag ? 'Try adjusting your search criteria' : 'Be the first to start a discussion!'}</p>
            {(searchTerm || selectedTag) && <Button onClick={resetFilters}>{t("ClearFilters")}</Button>}
            <Button onClick={loadPosts} className="edit-button">{t("Refresh")}</Button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default CommunityPage;