// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../services/authService";
import userService from "../../services/userService";
import recipeService from "../../services/recipeService";
import { getBookmarkedRecipes } from "../../services/bookmarkService";
import { getFollowers, getFollowing } from "../../services/followService";
import forumService from "../../services/forumService";
import { translateIngredient } from "../../utils/ingredientTranslations";
import RecipeCard from "../../components/recipe/RecipeCard";
import Badge, { getBadgeLabel, getBadgeColor } from "../../components/ui/Badge";
import { formatDate } from "../../utils/dateFormatter";
import "../../styles/ProfilePage.css";
import { useTranslation } from "react-i18next";
import { useCurrency } from "../../contexts/CurrencyContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setCurrency } = useCurrency();

  // Get current language for ingredient translation
  const currentLanguage = i18n.language.startsWith('tr') ? 'tr' : 'en';

  // State
  const [activeTab, setActiveTab] = useState("recipes");
  const [userProfile, setUserProfile] = useState(null);
  const [userBadge, setUserBadge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myRecipes, setMyRecipes] = useState([]);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [shoppingListHistory, setShoppingListHistory] = useState([]);
  
  // Settings form state
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [nationalityOther, setNationalityOther] = useState('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('none');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Common nationalities list
  const commonNationalities = [
    'American',
    'British',
    'Canadian',
    'French',
    'German',
    'Italian',
    'Spanish',
    'Turkish',
    'Chinese',
    'Japanese'
  ];
  
  // Popup states
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);
  const [showShoppingListPopup, setShowShoppingListPopup] = useState(false);
  const [selectedShoppingList, setSelectedShoppingList] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load user profile
  useEffect(() => {
    document.title = 'Profile';
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        if (!user || !user.id) {
          navigate("/login");
          return;
        }

        const userData = await userService.getUserById(user.id);
        setUserProfile(userData);
        
        // Fetch user badge
        const badgeData = await userService.getUserRecipeCount(user.id);
        setUserBadge(badgeData.badge);
        
        // Initialize settings form fields
        if (userData.date_of_birth) {
          // Format date for input (YYYY-MM-DD)
          const dob = new Date(userData.date_of_birth);
          setDateOfBirth(dob.toISOString().split('T')[0]);
        }
        // Initialize nationality - check if it's in the common list or set to "Other"
        if (userData.nationality) {
          if (commonNationalities.includes(userData.nationality)) {
            setNationality(userData.nationality);
            setNationalityOther('');
          } else {
            setNationality('Other');
            setNationalityOther(userData.nationality);
          }
        } else {
          setNationality('');
          setNationalityOther('');
        }
        // Initialize accessibility needs
        setAccessibilityNeeds(userData.accessibilityNeeds || 'none');

        // Load all user data in parallel
        await Promise.all([
          loadMyRecipes(user.id),
          loadBookmarks(),
          loadFollowersAndFollowing(),
          loadMyPostsAndComments(user.id),
          loadShoppingListHistory()
        ]);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const loadMyRecipes = async (userId) => {
    try {
      const allRecipes = await recipeService.getRecipesByCreator(userId);
      // Filter to ensure only recipes belonging to this user are included
      const userRecipes = (allRecipes || []).filter(recipe => {
        const recipeCreatorId = recipe.creator || recipe.creator_id || recipe.created_by;
        return String(recipeCreatorId) === String(userId);
      });
      setMyRecipes(userRecipes);
    } catch (error) {
      console.error("Error loading recipes:", error);
      setMyRecipes([]);
    }
  };

  const loadBookmarks = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) return;
      
      const bookmarkIds = await getBookmarkedRecipes(user.id);
      if (!bookmarkIds || bookmarkIds.length === 0) {
        setBookmarkedRecipes([]);
        return;
      }
      
      // Convert IDs to recipe objects
      const recipePromises = bookmarkIds.map(id => {
        const recipeId = typeof id === 'object' ? id.id || id : id;
        return recipeService.getRecipeById(Number(recipeId)).catch(err => {
          console.error(`Error loading recipe ${recipeId}:`, err);
          return null;
        });
      });
      
      const recipes = await Promise.all(recipePromises);
      const validRecipes = recipes.filter(recipe => recipe !== null);
      setBookmarkedRecipes(validRecipes);
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      setBookmarkedRecipes([]);
    }
  };

  const loadFollowersAndFollowing = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) return;
      
      const [followersData, followingData] = await Promise.all([
        getFollowers(user.id),
        getFollowing(user.id)
      ]);
      setFollowers(followersData || []);
      setFollowing(followingData || []);
    } catch (error) {
      console.error("Error loading followers/following:", error);
    }
  };

  const loadMyPostsAndComments = async (userId) => {
    try {
      const userIdNum = Number(userId);
      
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
      setMyPosts(userPosts);

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
      setMyComments(allComments);
    } catch (error) {
      console.error("Error loading posts/comments:", error);
    }
  };

  const loadShoppingListHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('shoppingListHistory') || '[]');
      setShoppingListHistory(history);
    } catch (error) {
      console.error("Error loading shopping list history:", error);
      setShoppingListHistory([]);
    }
  };

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    try {
      await userService.updateUserById(userProfile.id, {
        preferredCurrency: newCurrency,
      });
      setUserProfile({ ...userProfile, preferredCurrency: newCurrency });
      setCurrency(newCurrency);
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  const handleDateChange = async (e) => {
    const newDatePref = e.target.value;
    try {
      await userService.updateUserById(userProfile.id, {
      preferredDateFormat: newDatePref,
      });
      setUserProfile({ ...userProfile, preferredDateFormat: newDatePref });
    } catch (error) {
      console.error('Error updating date preference:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updateData = {
        preferredCurrency: userProfile.preferredCurrency || 'USD',
        preferredDateFormat: userProfile.preferredDateFormat || 'DD/MM/YYYY',
      };
      
      // Add date of birth if provided
      if (dateOfBirth) {
        updateData.date_of_birth = dateOfBirth;
      } else {
        updateData.date_of_birth = null;
      }
      
      // Add nationality if provided (or null if "Do not specify")
      if (nationality && nationality.trim() !== '' && nationality !== 'Do not specify') {
        if (nationality === 'Other' && nationalityOther && nationalityOther.trim() !== '') {
          updateData.nationality = nationalityOther.trim();
        } else if (nationality !== 'Other') {
          updateData.nationality = nationality.trim();
        } else {
          updateData.nationality = null;
        }
      } else {
        updateData.nationality = null;
      }
      
      // Add accessibility needs
      updateData.accessibilityNeeds = accessibilityNeeds || 'none';
      
      const updatedUser = await userService.updateUserById(userProfile.id, updateData);
      setUserProfile(updatedUser);
      
      // Update currency context if currency changed
      if (updateData.preferredCurrency !== userProfile.preferredCurrency) {
        setCurrency(updateData.preferredCurrency);
      }
      
      // Show saved state
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteShoppingList = (listId) => {
    try {
      const updatedHistory = shoppingListHistory.filter(list => list.id !== listId);
      localStorage.setItem('shoppingListHistory', JSON.stringify(updatedHistory));
      setShoppingListHistory(updatedHistory);
      if (selectedShoppingList?.id === listId) {
        setShowShoppingListPopup(false);
        setSelectedShoppingList(null);
      }
    } catch (error) {
      console.error('Error deleting shopping list:', error);
    }
  };

  const copyShoppingListToClipboard = async (list) => {
    try {
      const text = `
Shopping List - ${formatDate(list.date, userProfile.preferredDateFormat || 'DD/MM/YYYY')}

Recipes:
${list.recipeNames.join(', ')}

Ingredients:
${list.ingredients.map(ing => {
      const translatedName = translateIngredient(ing.name, currentLanguage);
      return `- ${translatedName}: ${ing.quantity}${ing.unit || ''}`;
    }).join('\n')}

Total Cost: ${list.currency}${list.totalCost.toFixed(2)}
Best Market: ${list.marketCosts.reduce((best, market) => market.totalCost < best.totalCost ? market : best).marketName}
      `.trim();

      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } catch (err) {
          console.error('Fallback copy failed:', err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
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
    return <div>Error loading profile</div>;
  }

  return (
    <div className="modern-profile-page">
      {/* Header with profile info */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-info">
          <div className="profile-avatar">
            {userProfile.profilePhoto ? (
              <img src={userProfile.profilePhoto} alt={userProfile.username} />
            ) : (
              <div className="profile-avatar-placeholder">{userProfile.username?.[0]?.toUpperCase() || 'U'}</div>
            )}
          </div>
            <h1 className="profile-username">
              <span className="profile-username-wrapper">
                <span className="profile-username-text">{userProfile.username}</span>
                <Badge badge={userBadge} size="large" usertype={userProfile.usertype} />
              </span>
            </h1>
              <p 
                className="profile-badge-label"
              style={{ color: getBadgeColor(userBadge, userProfile.usertype) }}
              >
              {getBadgeLabel(userBadge, userProfile.usertype)}
              </p>
            <p className="profile-email">{userProfile.email}</p>
            <div className="profile-stats">
              <div className="stat-item" onClick={() => setShowFollowersPopup(true)}>
                <span className="stat-count">{followers.length}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item" onClick={() => setShowFollowingPopup(true)}>
                <span className="stat-count">{following.length}</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="stat-item">
                <span className="stat-count">{myRecipes.length}</span>
                <span className="stat-label">Recipes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          Recipes
        </button>
        <button
          className={`profile-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          Bookmarks
        </button>
        <button
          className={`profile-tab ${activeTab === 'shopping-lists' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping-lists')}
        >
          Shopping Lists
        </button>
        <button
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={`profile-tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          Comments
        </button>
        <button
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Preferences
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'recipes' && (
          <div className="recipes-grid">
            {myRecipes.length === 0 ? (
              <p className="empty-message">You haven't created any recipes yet.</p>
            ) : (
              myRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="recipes-grid">
            {bookmarkedRecipes.length === 0 ? (
              <p className="empty-message">You haven't bookmarked any recipes yet.</p>
            ) : (
              bookmarkedRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            )}
          </div>
        )}

        {activeTab === 'shopping-lists' && (
          <div className="shopping-lists-container">
            {shoppingListHistory.length === 0 ? (
              <p className="empty-message">You haven't created any shopping lists yet.</p>
            ) : (
              <div className="shopping-lists-grid">
                {shoppingListHistory.map(list => (
                  <div key={list.id} className="shopping-list-card">
                    <div className="shopping-list-header">
                      <h3>{formatDate(list.date, userProfile.preferredDateFormat || 'DD/MM/YYYY')}</h3>
                      <span className="shopping-list-cost">{list.currency}{list.totalCost.toFixed(2)}</span>
                    </div>
                    <p className="shopping-list-recipes">{list.recipeNames.join(', ')}</p>
                    <div className="shopping-list-actions">
                <button
                        className="view-btn"
                        onClick={() => {
                          setSelectedShoppingList(list);
                          setShowShoppingListPopup(true);
                        }}
                      >
                        View
                </button>
                <button
                        className="delete-btn"
                        onClick={() => handleDeleteShoppingList(list.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-container">
            {myPosts.length === 0 ? (
              <p className="empty-message">You haven't created any posts yet.</p>
            ) : (
              myPosts.map(post => (
                <div
                  key={post.id}
                  className="post-item"
                  onClick={() => navigate(`/community/post/${post.id}`)}
                >
                  <h3>{post.title}</h3>
                  <p>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
                  <span className="post-date">{formatDate(post.created_at, userProfile.preferredDateFormat || 'DD/MM/YYYY')}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="comments-container">
            {myComments.length === 0 ? (
              <p className="empty-message">You haven't made any comments yet.</p>
            ) : (
              myComments.map(comment => (
                <div
                  key={comment.id}
                  className="comment-item"
                  onClick={() => navigate(`/community/post/${comment.postId}`)}
                >
                  <p className="comment-on">On: <strong>{comment.postTitle}</strong></p>
                  <p className="comment-content">{comment.content}</p>
                  <span className="comment-date">{formatDate(comment.created_at, userProfile.preferredDateFormat || 'DD/MM/YYYY')}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-container">
            <h2 className="settings-title">Profile Preferences</h2>
            
            <div className="settings-form">
              <div className="settings-group">
                <label className="settings-label">Currency</label>
                <select 
                  className="settings-input"
                  value={userProfile.preferredCurrency || 'USD'} 
                  onChange={handleCurrencyChange}
                >
                  <option value="USD">USD</option>
                  <option value="TRY">TRY</option>
                </select>
              </div>

              <div className="settings-group">
                <label className="settings-label">Date Format</label>
                <select 
                  className="settings-input"
                  value={userProfile.preferredDateFormat || 'DD/MM/YYYY'} 
                  onChange={handleDateChange}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="settings-group">
                <label className="settings-label">Date of Birth</label>
                <input
                  type="date"
                  className="settings-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>

              <div className="settings-group">
                <label className="settings-label">Nationality</label>
                <select
                  className="settings-input"
                  value={nationality}
                  onChange={(e) => {
                    setNationality(e.target.value);
                    if (e.target.value !== 'Other') {
                      setNationalityOther('');
                    }
                  }}
                >
                  <option value="">Select nationality...</option>
                  <option value="Do not specify">Do not specify</option>
                  {commonNationalities.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {nationality === 'Other' && (
                  <input
                    type="text"
                    className="settings-input"
                    style={{ marginTop: '0.5rem' }}
                    value={nationalityOther}
                    onChange={(e) => setNationalityOther(e.target.value)}
                    placeholder="Enter your nationality"
                  />
                )}
                <small className="settings-hint">
                  {nationality === 'Other' 
                    ? 'Please enter your nationality below'
                    : 'Select your nationality or choose "Do not specify"'}
                </small>
              </div>

              <div className="settings-group">
                <label className="settings-label">Accessibility Needs</label>
                <select
                  className="settings-input"
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="colorblind">Colorblind</option>
                  <option value="visual">Visual</option>
                  <option value="hearing">Hearing</option>
                </select>
                <small className="settings-hint">
                  Select any accessibility needs you may have
                </small>
              </div>

              <button
                className="settings-save-btn"
                onClick={handleSaveSettings}
                disabled={isSavingSettings || isSaved}
              >
                {isSavingSettings ? 'Saving...' : isSaved ? 'Saved' : 'Save Preferences'}
              </button>
            </div>
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
                      if (userProfile && String(user.id) === String(userProfile.id)) {
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
                      // Navigate to profile (if currentUser, go to /profile, else /profile/:id)
                      if (userProfile && String(user.id) === String(userProfile.id)) {
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

      {/* Shopping List Popup */}
      {showShoppingListPopup && selectedShoppingList && (
        <div className="popup-overlay" onClick={() => setShowShoppingListPopup(false)}>
          <div className="popup-content shopping-list-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Shopping List - {formatDate(selectedShoppingList.date, userProfile.preferredDateFormat || 'DD/MM/YYYY')}</h2>
              <button className="close-btn" onClick={() => setShowShoppingListPopup(false)}>×</button>
            </div>
            <div className="popup-body">
              {selectedShoppingList && (
                <div className="shopping-list-detail">
                  <div className="recipes-section">
                    <h3>Recipes</h3>
                    <p>{selectedShoppingList.recipeNames?.join(', ') || 'No recipes'}</p>
                  </div>
                  <div className="ingredients-section">
                    <h3>Ingredients</h3>
                    {selectedShoppingList.ingredients && selectedShoppingList.ingredients.length > 0 ? (
                      <ul>
                        {selectedShoppingList.ingredients.map((ing, idx) => (
                          <li key={idx}>
                            {translateIngredient(ing.name || '', currentLanguage)}: {ing.quantity || 0}{ing.unit || ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No ingredients</p>
                    )}
                  </div>
                  <div className="total-section">
                    <h3>Total Cost: {selectedShoppingList.currency || 'USD'}{(selectedShoppingList.totalCost || 0).toFixed(2)}</h3>
                    {selectedShoppingList.marketCosts && selectedShoppingList.marketCosts.length > 0 && (
                      <p>Best Market: {selectedShoppingList.marketCosts.reduce((best, market) => market.totalCost < best.totalCost ? market : best).marketName}</p>
                    )}
                  </div>
                  <button
                    className="copy-btn"
                    onClick={() => copyShoppingListToClipboard(selectedShoppingList)}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
