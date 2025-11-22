// src/pages/community/CommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import ReportButton from '../../components/report/ReportButton';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import forumService from '../../services/forumService';
import userService, { getUsername } from '../../services/userService.js';
import { formatDate } from '../../utils/dateFormatter';
import { getCurrentUser } from '../../services/authService';
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
  const [userDateFormat, setUserDateFormat] = useState('DD/MM/YYYY');

  // Available tags from API documentation
  const availableTags = [
    'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
    'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
    'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
  ];

  useEffect(() => {
    loadPosts();
    // Load user's preferred date format
    const loadUserDateFormat = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.id) {
          const userData = await userService.getUserById(user.id);
          setUserDateFormat(userData.preferredDateFormat || 'DD/MM/YYYY');
        }
      } catch (error) {
        console.error('Error loading user date format:', error);
      }
    };
    loadUserDateFormat();
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
        // Fetch user details and badges in parallel
        const userPromises = idsToFetch.map(async (userId) => {
          try {
            const userData = await userService.getUserById(userId);
            const badgeData = await userService.getUserRecipeCount(userId);
            return {
              id: userId,
              user: userData,
              badge: badgeData.badge
            };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return { id: userId, user: null, badge: null };
          }
        });
        
        const userResults = await Promise.all(userPromises);
        
        // Process users and fetch missing usernames
        const processedUsers = await Promise.all(
          userResults.map(async ({ id, user, badge }) => {
            if (user) {
              // If user exists but username is missing, try to fetch it separately
              if (!user.username || !user.username.trim()) {
                try {
                  const username = await getUsername(id);
                  if (username && username !== 'Unknown') {
                    user.username = username;
                  }
                } catch (error) {
                  console.error(`Error fetching username for user ${id}:`, error);
                }
              }
              
              return {
                id,
                userData: {
                  ...user,
                  badge: badge,
                  usertype: user.usertype || null
                }
              };
            } else {
              // Try to fetch username even if user fetch failed
              try {
                const username = await getUsername(id);
                return {
                  id,
                  userData: { 
                    id: id, 
                    username: username && username !== 'Unknown' ? username : `User ${id}`, 
                    badge: null, 
                    usertype: null 
                  }
                };
              } catch (error) {
                return {
                  id,
                  userData: { id: id, username: `User ${id}`, badge: null, usertype: null }
                };
              }
            }
          })
        );
        
        // Update userMap with processed users
        processedUsers.forEach(({ id, userData }) => {
          newUserMap[id] = userData;
        });
        
        setUserMap(newUserMap);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Function to get user's name/username from userMap
  const getUserName = (userId) => {
    if (!userMap[userId]) {
      // Try to fetch user if not in map
      fetchUserDetails([userId]);
      return `User #${userId}`;  // Temporary fallback while fetching
    }
    
    const user = userMap[userId];
    // Return username if available and not empty
    if (user.username && user.username.trim()) {
      return user.username;
    }
    
    // Try full name if username not available
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    // Last resort: try to fetch again if username is missing
    if (!user.username) {
      fetchUserDetails([userId]);
    }
    
    return `User #${userId}`;  // Fallback if username still not available
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

  const goToPostDetail = (postId) => {
    navigate(`/community/post/${postId}`);
  };

  const formatDateDisplay = (dateString) => {
    return formatDate(dateString, userDateFormat);
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
                            navigate(`/profile/${post.author}`);
                          }}
                          className="author-link"
                        >
                          {getUserName(post.author)}
                          <Badge badge={userMap[post.author]?.badge} size="small" usertype={userMap[post.author]?.usertype} />
                        </span>
                      </span>
                      <span>{formatDateDisplay(post.created_at)}</span>
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