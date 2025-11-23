// src/pages/community/EditPostPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import forumService from '../../services/forumService';
import '../../styles/CreatePostPage.css'; // Reuse the same CSS
import { useTranslation } from "react-i18next";

const EditPostPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_commentable: true,
    tags: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available tags from API documentation
  const availableTags = [
    'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
    'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
    'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
  ];

  useEffect(() => {
    loadPost();
  }, [id]);

  useEffect(() => {
    document.title = t('editPostPageTitle');
  }, [t]);

  const loadPost = async () => {
    setIsLoading(true);
    try {
      const post = await forumService.getPostById(id);
      
      // Check if the user is the author
      if (currentUser && post.author !== currentUser.id) {
        toast.error(t('editPostPageOnlyAuthor'));
        navigate(`/community/post/${id}`);
        return;
      }

      setFormData({
        title: post.title,
        content: post.content,
        is_commentable: post.is_commentable,
        tags: post.tags
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error(t('editPostPageFailedLoad'));
      navigate('/community');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      }
      // Maximum 5 tags allowed
      if (prev.tags.length < 5) {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
      toast.info(t('editPostPageMaxTags'));
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.warning(t('editPostPagePleaseLogIn'));
      navigate('/login');
      return;
    }

    if (!formData.title.trim()) {
      toast.warning(t('createPostPageEnterTitle'));
      return;
    }
    
    if (!formData.content.trim()) {
      toast.warning(t('createPostPageEnterContent'));
      return;
    }
    
    if (formData.tags.length === 0) {
      toast.warning(t('createPostPageSelectTag'));
      return;
    }

    setIsSubmitting(true);

    try {
      await forumService.updatePost(id, {
        title: formData.title,
        content: formData.content,
        is_commentable: formData.is_commentable,
        tags: formData.tags
      });

      toast.success(t('editPostPageSuccess'));
      navigate(`/community/post/${id}`);
    } catch (error) {
      console.error('Error updating post:', error);
      setIsSubmitting(false);
      
      if (error.response?.data) {
        const errorMsg = typeof error.response.data === 'object' ? 
          Object.values(error.response.data).flat().join(' ') : 
          error.response.data;
        toast.error(t('editPostPageFailedWithError', { error: errorMsg }));
      } else {
        toast.error(t('editPostPageFailedGeneric'));
      }
    }
  };

  if (isLoading) {
    return <div className="create-post-loading">{t('editPostPageisLoading')}</div>;
  }

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <h1 className="create-post-title">{t("editPostPageTitle")}</h1>
        <p className="create-post-subtitle">{t("editPostPageSubtitle")}</p>
      </div>

      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title" className="form-label">{t("Title")} *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder={t('editPostPageTitlePlaceholder')}
                maxLength={100}
                required
              />
              <p className="form-helper">{t('createPostPageCharacterCount', { count: formData.title.length })}</p>
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">{t("Content")} *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="form-input"
                placeholder={t('editPostPageContentPlaceholder')}
                rows="8"
                required
              />
            </div>

            <div className="form-group">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="is_commentable"
                  name="is_commentable"
                  checked={formData.is_commentable}
                  onChange={handleChange}
                />
                <label htmlFor="is_commentable">{t("createPostPoageAllowComments")}</label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("createPostPageTags")}</label>
              <div className="tag-selector">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`tag-button ${formData.tags.includes(tag) ? 'selected' : ''}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <p className="form-helper">{t('createPostPageTagsCount', { count: formData.tags.length })}</p>
            </div>

            <div className="form-actions">
              <Button 
                type="button"
                variant="secondary"
                onClick={() => navigate(`/community/post/${id}`)}
                disabled={isSubmitting}
              >
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('editPostPageUpdating') : t('editPostPageUpdate')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditPostPage;