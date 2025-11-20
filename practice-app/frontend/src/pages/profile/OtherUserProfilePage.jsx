// src/pages/profile/OtherUserProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import userService from "../../services/userService";
import recipeService from "../../services/recipeService";
import { getFollowers, getFollowing, toggleFollow } from "../../services/followService";
import forumService from "../../services/forumService";
import RecipeCard from "../../components/recipe/RecipeCard";
import Badge, { getBadgeLabel, getBadgeColor } from "../../components/ui/Badge";
import { formatDate } from "../../utils/dateFormatter";
import { getCurrentUser as getCurrentUserService } from "../../services/authService";
import "../../styles/OtherUserProfilePage.css";

const OtherUserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState("recipes");
  const [userProfile, setUserProfile] = useState(null);
  const [userBadge, setUserBadge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [userDateFormat, setUserDateFormat] = useState('DD/MM/YYYY');
  
  // Popup states
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);

  // Load user profile
  useEffect(() => {
    document.title = 'Profile';
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        // Redirect to own profile if userId is "me" or matches current user ID
        if (userId === "me" || (currentUser && String(currentUser.id) === String(userId))) {
          navigate("/profile");
          return;
        }

        const userData = await userService.getUserById(userId);
        setUserProfile(userData);
        
        // Fetch user badge
        const badgeData = await userService.getUserRecipeCount(userId);
        setUserBadge(badgeData.badge);

        // Load all user data in parallel
        await Promise.all([
          loadRecipes(userId),
          loadFollowersAndFollowing(userId),
          loadPostsAndComments(userId),
          checkFollowStatus(userId)
        ]);
        
        // Load current user's preferred date format
        try {
          const currentUserData = await getCurrentUserService();
          if (currentUserData && currentUserData.id) {
            const currentUserProfile = await userService.getUserById(currentUserData.id);
            setUserDateFormat(currentUserProfile.preferredDateFormat || 'DD/MM/YYYY');
          }
        } catch (error) {
          console.error('Error loading user date format:', error);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, currentUser, navigate]);

  const loadRecipes = async (uid) => {
    try {
      const allRecipes = await recipeService.getRecipesByCreator(uid);
      // Filter to ensure only recipes belonging to this user are included
      const userRecipes = (allRecipes || []).filter(recipe => {
        const recipeCreatorId = recipe.creator || recipe.creator_id || recipe.created_by;
        return String(recipeCreatorId) === String(uid);
      });
      setRecipes(userRecipes);
    } catch (error) {
      console.error("Error loading recipes:", error);
      setRecipes([]);
    }
  };

  const loadFollowersAndFollowing = async (uid) => {
    try {
      const [followersData, followingData] = await Promise.all([
        getFollowers(uid),
        getFollowing(uid)
      ]);
      setFollowers(followersData || []);
      setFollowing(followingData || []);
    } catch (error) {
      console.error("Error loading followers/following:", error);
    }
  };

  const loadPostsAndComments = async (uid) => {
    try {
      const userIdNum = Number(uid);
      
      // Fetch user's posts - get all pages
      let allPosts = [];
      let page = 1;
      let total = null;
      const pageSize = 100;
      
      while (true) {
        try {
          const postsResponse = await forumService.getPosts(page, pageSize);
        const posts = postsResponse.results || [];
          
          if (!posts || posts.length === 0) {
            break;
          }
          
          allPosts.push(...posts);
          
          // Get total from first response
          if (total === null) {
            total = postsResponse.total || 0;
          }
        
        // Check if there are more pages
          const currentTotal = allPosts.length;
          if (posts.length < pageSize || (total > 0 && currentTotal >= total)) {
            break;
          }
          
        page++;
        
        // Safety limit
          if (page > 100) break;
        } catch (error) {
          // If 404 error, it means no more pages
          if (error.response?.status === 404) {
            break;
          }
          throw error;
        }
      }
      
      // Filter user's posts
      const userPosts = allPosts.filter(post => Number(post.author) === userIdNum);
      setPosts(userPosts);

      // Fetch user's comments from all posts - handle pagination for each post
      const allComments = [];
      for (const post of allPosts) {
        try {
          let commentPage = 1;
          let commentTotal = null;
          const commentPageSize = 100;
          const postComments = []; // Track comments for this specific post
          
          while (true) {
            try {
              const commentsResponse = await forumService.getCommentsByPostId(post.id, commentPage, commentPageSize);
              const comments = commentsResponse.results || [];
              
              if (!comments || comments.length === 0) {
                break;
              }
              
              // Filter user's comments
          const userComments = comments.filter(comment => Number(comment.author) === userIdNum);
              const mappedComments = userComments.map(c => ({ ...c, postId: post.id, postTitle: post.title }));
              postComments.push(...mappedComments);
              
              // Get total from first response
              if (commentTotal === null) {
                commentTotal = commentsResponse.total || 0;
              }
              
              // Check if there are more pages
              // If we got fewer comments than pageSize, we're on the last page
              // Or if we've fetched all comments for this post
              if (comments.length < commentPageSize || (commentTotal > 0 && postComments.length >= commentTotal)) {
                break;
              }
              
              commentPage++;
              
              // Safety limit
              if (commentPage > 100) break;
            } catch (error) {
              // If 404 error, it means no more pages
              if (error.response?.status === 404) {
                break;
              }
              throw error;
            }
          }
          
          // Add this post's comments to the overall list
          allComments.push(...postComments);
        } catch (error) {
          console.error(`Error fetching comments for post ${post.id}:`, error);
          // Continue with next post
        }
      }
      setComments(allComments);
    } catch (error) {
      console.error("Error loading posts/comments:", error);
    }
  };

  const checkFollowStatus = async (uid) => {
    if (!currentUser) return;
    
    try {
      // Get current user's following list - use currentUser.id instead of 'me'
      const followingData = await getFollowing(currentUser.id);
      
      // Debug: Log the data to see what we're getting
      console.log('Current user ID:', currentUser.id);
      console.log('Target user ID:', uid);
      console.log('Following data:', followingData);
      
      // Check if target user is in following list
      // Backend returns array of user IDs or user objects
      const following = followingData.some(user => {
        const userIdToCheck = typeof user === 'object' ? user.id : user;
        const matches = String(userIdToCheck) === String(uid);
        if (matches) {
          console.log('Match found!', userIdToCheck, '===', uid);
        }
        return matches;
      });
      
      console.log('Is following?', following);
      setIsFollowing(following);
    } catch (error) {
      console.error("Error checking follow status:", error);
      setIsFollowing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert('Please login to follow users');
      navigate('/login');
      return;
    }

    try {
      setIsFollowLoading(true);
      const response = await toggleFollow(Number(userId));
      
      // Update follow status based on response
      const newFollowStatus = response.status === 'followed';
      setIsFollowing(newFollowStatus);
      
      // Refresh followers and following lists for the target user
      await loadFollowersAndFollowing(userId);
      
      // Also refresh follow status check
      await checkFollowStatus(userId);
    } catch (error) {
      console.error('Error toggling follow:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to follow/unfollow user. Please try again.';
      alert(errorMessage);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  if (!userProfile) {
    return <div>User not found</div>;
  }

  return (
    <div className="other-user-profile-page">
      {/* Header with profile info */}
      <div className="other-profile-header">
        <div className="other-profile-header-content">
          <div className="other-profile-avatar">
            {userProfile.profilePhoto ? (
              <img src={userProfile.profilePhoto} alt={userProfile.username} />
            ) : (
              <div className="other-profile-avatar-placeholder">{userProfile.username?.[0]?.toUpperCase() || 'U'}</div>
            )}
          </div>
          <div className="other-profile-info">
            <h1 className="other-profile-username">
              {userProfile.username}
              <Badge badge={userBadge} size="large" usertype={userProfile.usertype} />
            </h1>
            <p 
              className="other-profile-badge-label"
              style={{ color: getBadgeColor(userBadge, userProfile.usertype) }}
            >
              {getBadgeLabel(userBadge, userProfile.usertype)}
            </p>
            <div className="other-profile-stats">
              <div className="other-stat-item" onClick={() => setShowFollowersPopup(true)}>
                <span className="other-stat-count">{followers.length}</span>
                <span className="other-stat-label">Followers</span>
              </div>
              <div className="other-stat-item" onClick={() => setShowFollowingPopup(true)}>
                <span className="other-stat-count">{following.length}</span>
                <span className="other-stat-label">Following</span>
              </div>
              <div className="other-stat-item">
                <span className="other-stat-count">{recipes.length}</span>
                <span className="other-stat-label">Recipes</span>
              </div>
            </div>
          </div>
          {currentUser && (
            <button
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="other-profile-tabs">
        <button
          className={`other-profile-tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          Recipes
        </button>
        <button
          className={`other-profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={`other-profile-tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments
        </button>
      </div>

      {/* Tab Content */}
      <div className="other-profile-tab-content">
        {activeTab === 'recipes' && (
          <div className="other-recipes-grid">
            {recipes.length === 0 ? (
              <p className="other-empty-message">No recipes yet.</p>
            ) : (
              recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="other-posts-container">
            {posts.length === 0 ? (
              <p className="other-empty-message">No posts yet.</p>
            ) : (
              posts.map(post => (
                <div
                  key={post.id}
                  className="other-post-item"
                  onClick={() => navigate(`/community/post/${post.id}`)}
                >
                  <h3>{post.title}</h3>
                  <p>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
                  <span className="other-post-date">{formatDate(post.created_at, userDateFormat)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="other-comments-container">
            {comments.length === 0 ? (
              <p className="other-empty-message">No comments yet.</p>
            ) : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  className="other-comment-item"
                  onClick={() => navigate(`/community/post/${comment.postId}`)}
                >
                  <p className="other-comment-on">On: <strong>{comment.postTitle}</strong></p>
                  <p className="other-comment-content">{comment.content}</p>
                  <span className="other-comment-date">{formatDate(comment.created_at, userDateFormat)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Followers Popup */}
      {showFollowersPopup && (
        <div className="other-popup-overlay" onClick={() => setShowFollowersPopup(false)}>
          <div className="other-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="other-popup-header">
              <h2>Followers</h2>
              <button className="other-close-btn" onClick={() => setShowFollowersPopup(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="other-popup-body">
              {followers.length === 0 ? (
                <div className="other-popup-empty">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                <p>No followers yet</p>
                </div>
              ) : (
                followers.map(user => (
                  <div
                    key={user.id}
                    className="other-user-list-item"
                    onClick={() => {
                      setShowFollowersPopup(false);
                      // Navigate to profile (if currentUser, go to /profile, else /profile/:id)
                      if (currentUser && String(user.id) === String(currentUser.id)) {
                        navigate('/profile');
                      } else {
                        navigate(`/profile/${user.id}`);
                      }
                    }}
                  >
                    <div className="other-user-avatar">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.username} />
                      ) : (
                        <div className="other-user-avatar-placeholder">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="other-user-info">
                      <span className="other-user-name">{user.username}</span>
                      <Badge badge={user.badge} size="small" usertype={user.usertype} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Popup */}
      {showFollowingPopup && (
        <div className="other-popup-overlay" onClick={() => setShowFollowingPopup(false)}>
          <div className="other-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="other-popup-header">
              <h2>Following</h2>
              <button className="other-close-btn" onClick={() => setShowFollowingPopup(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="other-popup-body">
              {following.length === 0 ? (
                <div className="other-popup-empty">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                <p>Not following anyone yet</p>
                </div>
              ) : (
                following.map(user => (
                  <div
                    key={user.id}
                    className="other-user-list-item"
                    onClick={() => {
                      setShowFollowingPopup(false);
                      if (currentUser && String(user.id) === String(currentUser.id)) {
                        navigate('/profile');
                      } else {
                        navigate(`/profile/${user.id}`);
                      }
                    }}
                  >
                    <div className="other-user-avatar">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.username} />
                      ) : (
                        <div className="other-user-avatar-placeholder">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="other-user-info">
                      <span className="other-user-name">{user.username}</span>
                      <Badge badge={user.badge} size="small" usertype={user.usertype} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherUserProfilePage;

