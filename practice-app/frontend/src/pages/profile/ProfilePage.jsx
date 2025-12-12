// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect, useRef } from "react";
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
import { shareContent } from "../../utils/shareUtils";
import { useToast } from "../../components/ui/Toast";
import ImageUploader from "../../components/ui/ImageUploader";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setCurrency } = useCurrency();
  const toast = useToast();

  // Get current language for ingredient translation
  const currentLanguage = i18n.language.startsWith('tr') ? 'tr' : 'en';

  // State
  const [activeTab, setActiveTab] = useState("recipes");
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myRecipes, setMyRecipes] = useState([]);
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState([]);
  const [creatorMap, setCreatorMap] = useState({}); // Map of creator_id -> creator data
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
  
  // Profile photo and username state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [showPhotoPopup, setShowPhotoPopup] = useState(false);
  const fileInputRef = useRef(null);
  
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

  // Load user profile
  useEffect(() => {
    let isMounted = true;
    document.title = t('profile');
    
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        if (!user || !user.id) {
          if (isMounted) {
            navigate("/login");
          }
          return;
        }

        const userData = await userService.getUserById(user.id);
        if (!isMounted) return;
        
        setUserProfile(userData);
        
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
        const [recipesResult, bookmarksResult] = await Promise.all([
          loadMyRecipes(user.id),
          loadBookmarks(),
          loadFollowersAndFollowing(),
          loadMyPostsAndComments(user.id),
          loadShoppingListHistory()
        ]);
        
        // Load all creators at once after all recipes are loaded
        const allRecipes = [...(recipesResult || []), ...(bookmarksResult || [])];
        if (allRecipes.length > 0) {
          const allCreatorIds = [...new Set(allRecipes.map(r => r.creator_id).filter(Boolean))];
          await loadCreatorsData(allCreatorIds);
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

    fetchUserData();
    
    return () => {
      isMounted = false;
    };
  }, [t]); // Only depend on t, navigate is stable

  const loadMyRecipes = async (userId) => {
    try {
      // Use new optimized endpoint - returns array of recipe objects
      const recipes = await userService.getUserRecipes(userId);
      setMyRecipes(recipes || []);
      return recipes || [];
    } catch (error) {
      console.error("Error loading recipes:", error);
      setMyRecipes([]);
      return [];
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
      return validRecipes;
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
      // Use new optimized endpoints - fetch in parallel
      const [posts, comments] = await Promise.all([
        userService.getUserPosts(userId),
        userService.getUserComments(userId)
      ]);

      // Both functions return arrays directly
      setMyPosts(posts || []);
      setMyComments(comments || []);
    } catch (error) {
      console.error("Error loading posts/comments:", error);
      setMyPosts([]);
      setMyComments([]);
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

  // Profile photo handlers
  const handlePhotoUpload = async (file) => {
    if (!userProfile || !userProfile.id || !file) return;
    
    setIsUploadingPhoto(true);
    try {
      const updatedUser = await userService.uploadProfilePhoto(userProfile.id, file);
      setUserProfile(updatedUser);
      setPhotoPreview(null);
      setSelectedPhotoFile(null);
      toast.success(t('profilePagePhotoUploadSuccess') || 'Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      const errorMessage = error.response?.data?.profilePhoto?.[0] || 
                          error.response?.data?.error ||
                          t('profilePagePhotoUploadError') || 
                          'Failed to upload profile photo';
      toast.error(errorMessage);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!userProfile || !userProfile.id) return;
    
    if (!window.confirm(t('profilePagePhotoDeleteConfirm') || 'Are you sure you want to delete your profile photo?')) {
      return;
    }
    
    setIsDeletingPhoto(true);
    try {
      const updatedUser = await userService.deleteProfilePhoto(userProfile.id);
      setUserProfile(updatedUser);
      toast.success(t('profilePagePhotoDeleteSuccess') || 'Profile photo deleted successfully');
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      toast.error(t('profilePagePhotoDeleteError') || 'Failed to delete profile photo');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  // Username change handlers
  const handleUsernameChange = async () => {
    if (!userProfile || !userProfile.id) return;
    
    const trimmedUsername = newUsername.trim();
    if (!trimmedUsername) {
      toast.error(t('profilePageUsernameEmpty') || 'Username cannot be empty');
      return;
    }
    
    if (trimmedUsername === userProfile.username) {
      toast.info(t('profilePageUsernameSame') || 'This is already your username');
      setNewUsername('');
      return;
    }
    
    // Check availability
    try {
      const isAvailable = await userService.checkUsernameAvailability(trimmedUsername);
      if (!isAvailable) {
        toast.error(t('profilePageUsernameTaken') || 'This username is already taken');
        return;
      }
      
      // Show confirmation dialog
      setShowUsernameConfirm(true);
    } catch (error) {
      console.error('Error checking username availability:', error);
      toast.error(t('profilePageUsernameCheckError') || 'Error checking username availability');
    }
  };

  const confirmUsernameChange = async () => {
    if (!userProfile || !userProfile.id) return;
    
    setIsChangingUsername(true);
    try {
      const updatedUser = await userService.updateUsername(userProfile.id, newUsername.trim());
      setUserProfile(updatedUser);
      setNewUsername('');
      setShowUsernameConfirm(false);
      toast.success(t('profilePageUsernameChangeSuccess') || 'Username changed successfully');
    } catch (error) {
      console.error('Error changing username:', error);
      const errorMessage = error.response?.data?.username?.[0] || 
                          error.response?.data?.error ||
                          t('profilePageUsernameChangeError') || 
                          'Failed to change username';
      toast.error(errorMessage);
    } finally {
      setIsChangingUsername(false);
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

  const handleShareShoppingList = async (list) => {
    let text = `
Shopping List - ${formatDate(list.date, userProfile.preferredDateFormat || 'DD/MM/YYYY')}

Recipes:
${(list.recipeNames || []).join(', ')}

Ingredients:
${(list.ingredients || []).map(ing => {
      const translatedName = translateIngredient(ing.name, currentLanguage);
      return `- ${translatedName}: ${ing.quantity}${ing.unit || ''}`;
    }).join('\n')}`;

    // Add total cost if available
    if (list.totalCost !== null && list.totalCost !== undefined) {
      text += `\n\nTotal Cost: ${list.currency || ''}${list.totalCost.toFixed(2)}`;
    }

    // Add best market if available
    if (list.marketCosts && list.marketCosts.length > 0) {
      const bestMarket = list.marketCosts.reduce((best, market) => {
        const bestCost = best.totalCost || 0;
        const marketCost = market.totalCost || 0;
        return marketCost < bestCost ? market : best;
      });
      if (bestMarket && bestMarket.marketName) {
        text += `\nBest Market: ${bestMarket.marketName}`;
      }
    }

    text = text.trim();

    await shareContent({
      title: t('shoppingListPageTitle'),
      text: text,
      url: window.location.href
    }, t);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div>{t('profilePageLoadingProfile')}</div>
      </div>
    );
  }

  if (!userProfile) {
    return <div>{t('profilePageErrorLoading')}</div>;
  }

  return (
    <div className="modern-profile-page">
      {/* Header with profile info */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-info">
          <div className="profile-avatar" onClick={() => setShowPhotoPopup(true)}>
            {userProfile.profilePhoto ? (
              <img src={userProfile.profilePhoto} alt={userProfile.username} />
            ) : (
              <div className="profile-avatar-placeholder">{userProfile.username?.[0]?.toUpperCase() || 'U'}</div>
            )}
            <input
              ref={fileInputRef}
              id="photo-upload-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                if (!file.type.match('image.*')) {
                  toast.error(t('profilePagePhotoInvalid') || 'Please select an image file');
                  return;
                }
                
                if (file.size > 5 * 1024 * 1024) {
                  toast.error(t('profilePagePhotoTooLarge') || 'Image must be less than 5MB');
                  return;
                }
                
                setSelectedPhotoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                  setPhotoPreview(reader.result);
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>
            <h1 className="profile-username">
              <span className="profile-username-wrapper">
                <span className="profile-username-text">{userProfile.username}</span>
                <Badge badge={userProfile.typeOfCook} size="large" usertype={userProfile.usertype} />
              </span>
            </h1>
              <p 
                className="profile-badge-label"
              style={{ color: getBadgeColor(userProfile.typeOfCook, userProfile.usertype) }}
              >
              {getBadgeLabel(userProfile.typeOfCook, userProfile.usertype, t)}
              </p>
            <p className="profile-email">{userProfile.email}</p>
            <div className="profile-stats">
              <div className="stat-item" onClick={() => setShowFollowersPopup(true)}>
                <span className="stat-count">{followers.length}</span>
                <span className="stat-label">{t('profilePageFollowers')}</span>
              </div>
              <div className="stat-item" onClick={() => setShowFollowingPopup(true)}>
                <span className="stat-count">{following.length}</span>
                <span className="stat-label">{t('profilePageFollowing')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-count">{myRecipes.length}</span>
                <span className="stat-label">{t('profilePageRecipes')}</span>
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
          {t('profilePageRecipes')}
        </button>
        <button
          className={`profile-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          {t('profilePageBookmarks')}
        </button>
        <button
          className={`profile-tab ${activeTab === 'shopping-lists' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping-lists')}
        >
          {t('profilePageShoppingLists')}
        </button>
        <button
          className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          {t('profilePagePosts')}
        </button>
        <button
          className={`profile-tab ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          {t('profilePageComments')}
        </button>
        <button
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          {t('profilePagePreferences')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'recipes' && (
          <div className={`recipes-grid ${myRecipes.length === 0 ? 'empty-state' : ''}`}>
            {myRecipes.length === 0 ? (
              <p className="empty-message">{t('profilePageNoRecipesCreated')}</p>
            ) : (
              myRecipes.map(recipe => {
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

        {activeTab === 'bookmarks' && (
          <div className={`recipes-grid ${bookmarkedRecipes.length === 0 ? 'empty-state' : ''}`}>
            {bookmarkedRecipes.length === 0 ? (
              <p className="empty-message">{t('profilePageNoRecipesBookmarked')}</p>
            ) : (
              bookmarkedRecipes.map(recipe => {
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

        {activeTab === 'shopping-lists' && (
          <div className={`shopping-lists-container ${shoppingListHistory.length === 0 ? 'empty-state' : ''}`}>
            {shoppingListHistory.length === 0 ? (
              <p className="empty-message">{t('profilePageNoShoppingLists')}</p>
            ) : (
              <div className="shopping-lists-grid">
                {shoppingListHistory.map(list => (
                  <div key={list.id} className="shopping-list-card">
                    <div className="shopping-list-header">
                      <h3>{formatDate(list.date, userProfile.preferredDateFormat || 'DD/MM/YYYY', t)}</h3>
                      <span className="shopping-list-cost">
                        {list.currency || ''}{list.totalCost !== null && list.totalCost !== undefined ? list.totalCost.toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <p className="shopping-list-recipes">{(list.recipeNames || []).join(', ')}</p>
                    <div className="shopping-list-actions">
                <button
                        className="view-btn"
                        onClick={() => {
                          setSelectedShoppingList(list);
                          setShowShoppingListPopup(true);
                        }}
                      >
                        {t('profilePageView')}
                </button>
                <button
                        className="delete-btn"
                        onClick={() => handleDeleteShoppingList(list.id)}
                      >
                        {t('profilePageDelete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className={`posts-container ${myPosts.length === 0 ? 'empty-state' : ''}`}>
            {myPosts.length === 0 ? (
              <p className="empty-message">{t('profilePageNoPosts')}</p>
            ) : (
              myPosts.map(post => (
                <div
                  key={post.id}
                  className="post-item"
                  onClick={() => navigate(`/community/post/${post.id}`)}
                >
                  <h3>{post.title}</h3>
                  <p>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
                  <span className="post-date">{formatDate(post.created_at, userProfile.preferredDateFormat || 'DD/MM/YYYY', t)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className={`comments-container ${myComments.length === 0 ? 'empty-state' : ''}`}>
            {myComments.length === 0 ? (
              <p className="empty-message">{t('profilePageNoComments')}</p>
            ) : (
              myComments.map(comment => (
                <div
                  key={comment.id}
                  className="comment-item"
                  onClick={() => navigate(`/community/post/${comment.postId}`)}
                >
                  <p className="comment-on">{t('profilePageCommentOn')} <strong>{comment.postTitle}</strong></p>
                  <p className="comment-content">{comment.content}</p>
                  <span className="comment-date">{formatDate(comment.created_at, userProfile.preferredDateFormat || 'DD/MM/YYYY', t)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-container">
            <h2 className="settings-title">{t('profilePageSettingsTitle')}</h2>
            
            <div className="settings-form">
              {/* Username Change Section */}
              <div className="settings-group">
                <label className="settings-label">{t('profilePageChangeUsername') || 'Change Username'}</label>
                <div className="username-change-container">
                  <input
                    type="text"
                    className="settings-input"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={userProfile.username || t('profilePageCurrentUsername') || 'Current username'}
                    disabled={isChangingUsername}
                  />
                  <button
                    className="username-change-btn"
                    onClick={handleUsernameChange}
                    disabled={isChangingUsername || !newUsername.trim() || newUsername.trim() === userProfile.username}
                  >
                    {isChangingUsername ? t('profilePageChanging') || 'Changing...' : t('profilePageChange') || 'Change'}
                  </button>
                </div>
                {showUsernameConfirm && (
                  <div className="username-confirm-dialog">
                    <p>{t('profilePageUsernameConfirmMessage') || `Are you sure you want to change your username to "${newUsername.trim()}"?`}</p>
                    <div className="username-confirm-actions">
                      <button
                        className="username-confirm-btn"
                        onClick={confirmUsernameChange}
                        disabled={isChangingUsername}
                      >
                        {isChangingUsername ? t('profilePageChanging') || 'Changing...' : t('profilePageConfirm') || 'Confirm'}
                      </button>
                      <button
                        className="username-cancel-btn"
                        onClick={() => {
                          setShowUsernameConfirm(false);
                          setNewUsername('');
                        }}
                        disabled={isChangingUsername}
                      >
                        {t('profilePageCancel') || 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="settings-group">
                <label className="settings-label">{t('profilePageCurrency')}</label>
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
                <label className="settings-label">{t('profilePageDateFormat')}</label>
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
                <label className="settings-label">{t('profilePageDateOfBirth')}</label>
                <input
                  type="date"
                  className="settings-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>

              <div className="settings-group">
                <label className="settings-label">{t('profilePageNationality')}</label>
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
                  <option value="">{t('profilePageSelectNationality')}</option>
                  <option value="Do not specify">{t('profilePageDoNotSpecify')}</option>
                  {commonNationalities.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                  <option value="Other">{t('profilePageOther')}</option>
                </select>
                {nationality === 'Other' && (
                  <input
                    type="text"
                    className="settings-input"
                    style={{ marginTop: '0.5rem' }}
                    value={nationalityOther}
                    onChange={(e) => setNationalityOther(e.target.value)}
                    placeholder={t('profilePageEnterNationality')}
                  />
                )}
                <small className="settings-hint">
                  {nationality === 'Other' 
                    ? t('profilePageNationalityOtherHint')
                    : t('profilePageNationalityHint')}
                </small>
              </div>

              <div className="settings-group">
                <label className="settings-label">{t('profilePageAccessibilityNeeds')}</label>
                <select
                  className="settings-input"
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                >
                  <option value="none">{t('profilePageAccessibilityNone')}</option>
                  <option value="colorblind">{t('profilePageAccessibilityColorblind')}</option>
                  <option value="visual">{t('profilePageAccessibilityVisual')}</option>
                  <option value="hearing">{t('profilePageAccessibilityHearing')}</option>
                </select>
                <small className="settings-hint">
                  {t('profilePageAccessibilityHint')}
                </small>
              </div>

              <button
                className="settings-save-btn"
                onClick={handleSaveSettings}
                disabled={isSavingSettings || isSaved}
              >
                {isSavingSettings ? t('profilePageSaving') : isSaved ? t('profilePageSaved') : t('profilePageSavePreferences')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo Preview/Upload Modal */}
      {photoPreview && (
        <div className="photo-preview-overlay" onClick={() => {
          setPhotoPreview(null);
          setSelectedPhotoFile(null);
        }}>
          <div className="photo-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="photo-preview-header">
              <h3>{t('profilePagePhotoPreview') || 'Photo Preview'}</h3>
              <button 
                className="photo-preview-close"
                onClick={() => {
                  setPhotoPreview(null);
                  setSelectedPhotoFile(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="photo-preview-content">
              <img src={photoPreview} alt="Preview" />
            </div>
            <div className="photo-preview-actions">
              <button
                className="photo-preview-confirm"
                onClick={() => {
                  if (selectedPhotoFile) {
                    handlePhotoUpload(selectedPhotoFile);
                  }
                }}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (t('profilePageUploading') || 'Uploading...') : (t('profilePageConfirm') || 'Confirm')}
              </button>
              <button
                className="photo-preview-cancel"
                onClick={() => {
                  setPhotoPreview(null);
                  setSelectedPhotoFile(null);
                }}
                disabled={isUploadingPhoto}
              >
                {t('profilePageCancel') || 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Popup */}
      {showFollowersPopup && (
        <div className="other-popup-overlay" onClick={() => setShowFollowersPopup(false)}>
          <div className="other-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="other-popup-header">
              <h2>{t('profilePageFollowers')}</h2>
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
                <p>{t('profilePageNoFollowers')}</p>
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
              <h2>{t('profilePageFollowing')}</h2>
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
                <p>{t('profilePageNoFollowing')}</p>
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
                      <Badge badge={user.typeOfCook} size="small" usertype={user.usertype} />
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
                    <h3>{t('profilePageRecipes')}</h3>
                    <p>{selectedShoppingList.recipeNames?.join(', ') || t('profilePageNoRecipes')}</p>
                  </div>
                  <div className="ingredients-section">
                    <h3>{t('Ingredients')}</h3>
                    {selectedShoppingList.ingredients && selectedShoppingList.ingredients.length > 0 ? (
                      <ul>
                        {selectedShoppingList.ingredients.map((ing, idx) => (
                          <li key={idx}>
                            {translateIngredient(ing.name || '', currentLanguage)}: {ing.quantity || 0}{ing.unit || ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{t('profilePageNoIngredients')}</p>
                    )}
                  </div>
                  <div className="total-section">
                    <h3>
                      {t('profilePageTotalCost')} {selectedShoppingList.currency || 'USD'}
                      {selectedShoppingList.totalCost !== null && selectedShoppingList.totalCost !== undefined 
                        ? selectedShoppingList.totalCost.toFixed(2) 
                        : '0.00'}
                    </h3>
                    {selectedShoppingList.marketCosts && selectedShoppingList.marketCosts.length > 0 && (
                      <p>
                        {t('profilePageBestMarket')}{' '}
                        {selectedShoppingList.marketCosts
                          .filter(market => market.totalCost !== null && market.totalCost !== undefined)
                          .reduce((best, market) => {
                            const bestCost = best?.totalCost ?? Infinity;
                            const marketCost = market.totalCost ?? Infinity;
                            return marketCost < bestCost ? market : best;
                          }, null)?.marketName || 'N/A'}
                      </p>
                    )}
                  </div>
                  <button
                    className="copy-btn share-btn"
                    onClick={() => handleShareShoppingList(selectedShoppingList)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ marginRight: '6px', verticalAlign: 'middle' }}
                    >
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    {t('shareShoppingList')}
                  </button>
                </div>
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
            <div className="profile-photo-popup-actions">
              <button 
                className="profile-photo-popup-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhotoPopup(false);
                  fileInputRef.current?.click();
                }}
              >
                {t('profilePageChangePhoto') || 'Edit Photo'}
              </button>
              {userProfile.profilePhoto && (
                <button 
                  className="profile-photo-popup-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPhotoPopup(false);
                    handlePhotoDelete();
                  }}
                  disabled={isDeletingPhoto}
                >
                  {isDeletingPhoto ? (t('profilePageDeleting') || 'Deleting...') : (t('profilePageDeletePhoto') || 'Delete Photo')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
