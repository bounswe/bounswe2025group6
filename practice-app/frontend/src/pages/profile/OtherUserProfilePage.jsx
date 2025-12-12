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
import { useTranslation } from "react-i18next";

const OtherUserProfilePage = () => {
  const { t } = useTranslation();
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState("recipes");
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [creatorMap, setCreatorMap] = useState({}); // Map of creator_id -> creator data
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
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);

  // Load user profile
  useEffect(() => {
    let isMounted = true;
    document.title = t('profile');
    
    const fetchUserData = async () => {
      try {
        setIsLoading(true);

        // Redirect to own profile if userId is "me" or matches current user ID
        if (userId === "me" || (currentUser && String(currentUser.id) === String(userId))) {
          if (isMounted) {
            navigate("/profile");
          }
          return;
        }

        const userData = await userService.getUserById(userId);
        if (!isMounted) return;
        
        setUserProfile(userData);

        // Load all user data in parallel
        await Promise.all([
          loadRecipes(userId),
          loadFollowersAndFollowing(userId),
          loadPostsAndComments(userId),
          checkFollowStatus(userId)
        ]);
        
        if (!isMounted) return;
        
        // Load current user's preferred date format
        try {
          const currentUserData = await getCurrentUserService();
          if (currentUserData && currentUserData.id && isMounted) {
            const currentUserProfile = await userService.getUserById(currentUserData.id);
            setUserDateFormat(currentUserProfile.preferredDateFormat || 'DD/MM/YYYY');
          }
        } catch (error) {
          if (isMounted) {
            console.error('Error loading user date format:', error);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching user data:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (userId) {
      fetchUserData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userId, t]); // Only depend on userId and t, currentUser and navigate are stable

  const loadRecipes = async (uid) => {
    try {
      // Use new optimized endpoint - returns array of recipe objects
      const userRecipes = await userService.getUserRecipes(uid);
      setRecipes(userRecipes || []);
      
      // Pre-load creator data for all recipes
      if (userRecipes && userRecipes.length > 0) {
        const creatorIds = [...new Set(userRecipes.map(r => r.creator_id).filter(Boolean))];
        await loadCreatorsData(creatorIds);
      }
    } catch (error) {
      console.error("Error loading recipes:", error);
      setRecipes([]);
    }
  };
  
  // Load creator data for multiple creator IDs
  const loadCreatorsData = async (creatorIds) => {
    if (!creatorIds || creatorIds.length === 0) return;
    
    // Get current state to filter out creators we already have
    let idsToFetch = [];
    setCreatorMap(prevMap => {
      idsToFetch = creatorIds.filter(id => !prevMap[id]);
      return prevMap; // Don't update yet
    });
    
    if (idsToFetch.length === 0) return; // All creators already loaded
    
    // Fetch in parallel (cache is handled in getUserById)
    const results = await Promise.all(
      idsToFetch.map(async (creatorId) => {
        try {
          const userData = await userService.getUserById(creatorId);
          return { id: creatorId, data: userData };
        } catch (error) {
          console.error(`Error loading creator ${creatorId}:`, error);
          return { id: creatorId, data: null };
        }
      })
    );
    
    // Update state with all results at once
    setCreatorMap(prevMap => {
      const newMap = { ...prevMap };
      results.forEach(({ id, data }) => {
        if (data && !newMap[id]) { // Double check to avoid duplicates
          newMap[id] = {
            username: data.username || 'Unknown',
            typeOfCook: data.typeOfCook || null,
            usertype: data.usertype || null
          };
        }
      });
      return newMap;
    });
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
      // Use new optimized endpoints - fetch in parallel
      const [userPosts, userComments] = await Promise.all([
        userService.getUserPosts(uid),
        userService.getUserComments(uid)
      ]);

      // Both functions return arrays directly
      setPosts(userPosts || []);
      setComments(userComments || []);
    } catch (error) {
      console.error("Error loading posts/comments:", error);
      setPosts([]);
      setComments([]);
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
      alert(t('otherUserProfilePleaseLogin'));
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
        <div>{t('profilePageLoadingProfile')}</div>
      </div>
    );
  }

  if (!userProfile) {
    return <div>{t('otherUserProfileUserNotFound')}</div>;
  }

  return (
    <div className="other-user-profile-page">
      {/* Header with profile info */}
      <div className="other-profile-header">
        <div className="other-profile-header-content">
          <div className="other-profile-avatar" onClick={() => setShowPhotoPopup(true)} style={{ cursor: 'pointer' }}>
            {userProfile.profilePhoto ? (
              <img src={userProfile.profilePhoto} alt={userProfile.username} />
            ) : (
              <div className="other-profile-avatar-placeholder">{userProfile.username?.[0]?.toUpperCase() || 'U'}</div>
            )}
          </div>
          <div className="other-profile-info">
            <h1 className="other-profile-username">
              {userProfile.username}
              <Badge badge={userProfile.typeOfCook} size="large" usertype={userProfile.usertype} />
            </h1>
            <p 
              className="other-profile-badge-label"
              style={{ color: getBadgeColor(userProfile.typeOfCook, userProfile.usertype) }}
            >
              {getBadgeLabel(userProfile.typeOfCook, userProfile.usertype, t)}
            </p>
            <div className="other-profile-stats">
              <div className="other-stat-item" onClick={() => setShowFollowersPopup(true)}>
                <span className="other-stat-count">{followers.length}</span>
                <span className="other-stat-label">{t('otherUserProfileFollowers')}</span>
              </div>
              <div className="other-stat-item" onClick={() => setShowFollowingPopup(true)}>
                <span className="other-stat-count">{following.length}</span>
                <span className="other-stat-label">{t('otherUserProfileFollowing')}</span>
              </div>
              <div className="other-stat-item">
                <span className="other-stat-count">{recipes.length}</span>
                <span className="other-stat-label">{t('otherUserProfileRecipes')}</span>
              </div>
            </div>
          </div>
          {currentUser && (
            <button
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? t('otherUserProfileLoading') : isFollowing ? t('otherUserProfileFollowingState') : t('otherUserProfileFollow')}
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
          {t('otherUserProfileRecipes')}
        </button>
        <button
          className={`other-profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          {t('otherUserProfilePosts')}
        </button>
        <button
          className={`other-profile-tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          {t('otherUserProfileComments')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="other-profile-tab-content">
        {activeTab === 'recipes' && (
          <div className="other-recipes-grid">
            {recipes.length === 0 ? (
              <p className="other-empty-message">{t('otherUserProfileNoRecipes')}</p>
            ) : (
              recipes.map(recipe => {
                const creator = recipe.creator_id ? creatorMap[recipe.creator_id] : null;
                return (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                    creatorName={creator?.username}
                    creatorBadge={creator?.typeOfCook}
                    creatorUsertype={creator?.usertype}
                  />
                );
              })
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="other-posts-container">
            {posts.length === 0 ? (
              <p className="other-empty-message">{t('otherUserProfileNoPosts')}</p>
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
              <p className="other-empty-message">{t('otherUserProfileNoComments')}</p>
            ) : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  className="other-comment-item"
                  onClick={() => navigate(`/community/post/${comment.postId}`)}
                >
                  <p className="other-comment-on">{t('otherUserProfileCommentOn')} <strong>{comment.postTitle}</strong></p>
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
              <h2>{t('otherUserProfileFollowers')}</h2>
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
                <p>{t('otherUserProfileNoFollowers')}</p>
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
                      <Badge badge={user.typeOfCook} size="small" usertype={user.usertype} />
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
              <h2>{t('otherUserProfileFollowingList')}</h2>
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
                <p>{t('otherUserProfileNoFollowing')}</p>
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
                      <Badge badge={user.typeOfCook} size="small" usertype={user.usertype} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Photo Popup */}
      {showPhotoPopup && (
        <div className="profile-photo-popup-overlay" onClick={() => setShowPhotoPopup(false)}>
          <div className="profile-photo-popup-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="profile-photo-popup-close"
              onClick={() => setShowPhotoPopup(false)}
            >
              ✕
            </button>
            <div className="profile-photo-popup-image-container">
              {userProfile.profilePhoto ? (
                <img src={userProfile.profilePhoto} alt={userProfile.username} />
              ) : (
                <div className="profile-photo-popup-placeholder">
                  {userProfile.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherUserProfilePage;

