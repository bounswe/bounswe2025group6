// src/pages/community/UserProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/UserProfilePage.css';
import { useTranslation } from "react-i18next";

const UserProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const username = location.state?.username || t('User');

  const [userProfile, setUserProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        setTimeout(() => {
          const mockProfile = {
            id: parseInt(id),
            username: username,
            bio: "Food enthusiast and budget-conscious cook.",
            joinedDate: "2023-01-15",
            postsCount: 12,
            commentsCount: 45,
            avatarUrl: "https://via.placeholder.com/150",
            badges: ["Top Contributor", "Recipe Expert"]
          };

          const mockPosts = [
            {
              id: 1,
              title: "Weekly Meal Prep Under ₺100 Per Person",
              timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
              likes: 15,
              comments: 8
            },
            {
              id: 2,
              title: "Creative Ways to Use Stale Bread?",
              timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
              likes: 23,
              comments: 14
            },
            {
              id: 3,
              title: "Budget-Friendly Protein Sources",
              timestamp: new Date(Date.now() - 86400000 * 21).toISOString(),
              likes: 31,
              comments: 9
            }
          ];

          setUserProfile(mockProfile);
          setUserPosts(mockPosts);
          setIsLoading(false);
        }, 800);
        } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error(t('userProfileFailedToLoad'));
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id, username, toast]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="user-profile-container">
        <div className="user-profile-loading">{t('userProfileLoading')}</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="user-profile-container">
        <Card>
          <Card.Body className="text-center py-8">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-xl font-semibold mb-2">{t('userProfileNotFoundTitle')}</h2>
            <p className="text-gray-600 mb-4">{t('userProfileNotFoundMessage')}</p>
            <Button variant="secondary" onClick={() => navigate('/community')} size="sm">
              {t('userProfileBackToCommunity')}
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-back-button">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          {t('Back')}
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="user-profile-content">
            <div className="user-profile-avatar-section">
              <div className="user-profile-avatar">
                <img src={userProfile.avatarUrl} alt={userProfile.username} className="w-full h-full object-cover" />
              </div>
              <div className="user-profile-badges">
                {userProfile.badges.map((badge, idx) => (
                  <div key={idx} className="badge">
                    {badge}
                  </div>
                ))}
              </div>
            </div>

            <div className="user-profile-info">
              <h1 className="text-2xl font-bold mb-2">{userProfile.username}</h1>
              <p className="text-gray-600 mb-4">{userProfile.bio}</p>
              <div className="text-sm text-gray-500 mb-4">
                {t('userProfileJoined')} {formatDate(userProfile.joinedDate)}
              </div>
              <div className="user-profile-stats">
                <div className="text-center">
                  <div className="font-semibold">{userProfile.postsCount}</div>
                  <div className="text-xs text-gray-500">{t('userProfilePosts')}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{userProfile.commentsCount}</div>
                  <div className="text-xs text-gray-500">{t('userProfileComments')}</div>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="user-profile-tabs">
        <button className={activeTab === 'posts' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('posts')}>{t('userProfilePosts')}</button>
        <button className={activeTab === 'comments' ? 'tab-active' : 'tab'} onClick={() => setActiveTab('comments')}>{t('userProfileComments')}</button>
      </div>

      {activeTab === 'posts' && (
        <div className="space-y-4">
            {userPosts.length > 0 ? (
            userPosts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/community/post/${post.id}`)}>
                <Card.Body>
                  <h3 className="font-semibold">{post.title}</h3>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <div>{formatDate(post.timestamp)}</div>
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">❤️ {post.likes}</span>
                      <span className="flex items-center gap-1">💬 {post.comments}</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))
          ) : (
            <Card>
              <Card.Body className="text-center py-6">
                <p className="text-gray-600">{t('userProfileNoPosts')}</p>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <Card>
          <Card.Body className="text-center py-6">
            <p className="text-gray-600">{t('userProfileCommentsPlaceholder')}</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default UserProfilePage;
