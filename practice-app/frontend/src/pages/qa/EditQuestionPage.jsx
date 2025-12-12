// src/pages/qa/EditQuestionPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import qaService from '../../services/qaService';
import '../../styles/CreateQuestionPage.css'; // Reuse the same CSS
import { useTranslation } from "react-i18next";

const EditQuestionPage = () => {
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
    loadQuestion();
  }, [id]);

  useEffect(() => {
    document.title = t('editQuestionPageTitle', 'Edit Question - FitHub');
  }, [t]);

  const loadQuestion = async () => {
    setIsLoading(true);
    try {
      const question = await qaService.getQuestionById(id);
      
      // Check if the user is the author
      if (currentUser && question.author !== currentUser.id) {
        toast.error(t('editQuestionPageOnlyAuthor', 'You can only edit your own questions'));
        navigate(`/qa/question/${id}`);
        return;
      }

      setFormData({
        title: question.title,
        content: question.content,
        is_commentable: question.is_commentable,
        tags: question.tags || []
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading question:', error);
      toast.error(t('editQuestionPageFailedLoad', 'Failed to load question'));
      navigate('/qa');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error(t('editQuestionPageTitleRequired', 'Question title is required'));
      return;
    }

    if (!formData.content.trim()) {
      toast.error(t('editQuestionPageContentRequired', 'Question content is required'));
      return;
    }

    if (formData.content.trim().length < 20) {
      toast.error(t('editQuestionPageContentTooShort', 'Question content must be at least 20 characters long'));
      return;
    }

    setIsSubmitting(true);
    try {
      const questionData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        is_commentable: formData.is_commentable,
        tags: formData.tags
      };

      console.log('Updating question:', questionData);
      const response = await qaService.updateQuestion(id, questionData);
      console.log('Question updated:', response);

      toast.success(t('editQuestionPageSuccess', 'Question updated successfully!'));
      navigate(`/qa/question/${id}`);
    } catch (error) {
      console.error('Error updating question:', error);
      
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.tags) {
        toast.error(`Invalid tags: ${error.response.data.tags}`);
      } else {
        toast.error(t('editQuestionPageError', 'Failed to update question. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/qa/question/${id}`);
  };

  if (!currentUser) {
    toast.error(t('editQuestionPageLoginRequired', 'Please login to edit questions'));
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="create-question-container">
        <Card className="create-question-card">
          <div className="create-question-header">
            <h1 className="create-question-title">
              {t('editQuestionPageLoading', 'Loading Question...')}
            </h1>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="create-question-container">
      <Card className="create-question-card">
        <div className="create-question-header">
          <h1 className="create-question-title">
            {t('editQuestionPageHeading', 'Edit Question')}
          </h1>
          <p className="create-question-subtitle">
            {t('editQuestionPageSubtitle', 'Update your nutrition question details')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="create-question-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              {t('editQuestionPageTitleLabel', 'Question Title')} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('editQuestionPageTitlePlaceholder', 'What nutrition question do you have?')}
              className="form-input"
              maxLength={200}
              required
            />
            <div className="form-hint">
              {t('editQuestionPageTitleHint', 'Be specific and clear about what you want to know')}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              {t('editQuestionPageContentLabel', 'Question Details')} *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder={t('editQuestionPageContentPlaceholder', 'Provide more details about your nutrition question, including any relevant health conditions, dietary preferences, or specific concerns...')}
              className="form-textarea"
              rows={6}
              minLength={20}
              required
            />
            <div className="form-hint">
              {t('editQuestionPageContentHint', 'Minimum 20 characters. Include relevant details for better answers.')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('editQuestionPageTagsLabel', 'Tags')}
            </label>
            <div className="tags-container">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`tag-button ${formData.tags.includes(tag) ? 'selected' : ''}`}
                >
                  {t(`tag${tag.replace(/\s+/g, '')}`, tag)}
                </button>
              ))}
            </div>
            <div className="form-hint">
              {t('editQuestionPageTagsHint', 'Select relevant tags to help categorize your question')}
            </div>
          </div>

          <div className="form-group">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="is_commentable"
                name="is_commentable"
                checked={formData.is_commentable}
                onChange={handleChange}
                className="form-checkbox"
              />
              <label htmlFor="is_commentable" className="checkbox-label">
                {t('editQuestionPageAllowAnswers', 'Allow dietitians to answer this question')}
              </label>
            </div>
            <div className="form-hint">
              {t('editQuestionPageAllowAnswersHint', 'Uncheck only if you want to share information without seeking answers')}
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="cancel-button"
              disabled={isSubmitting}
            >
              {t('editQuestionPageCancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('editQuestionPageSubmitting', 'Updating...') : t('editQuestionPageSubmit', 'Update Question')}
            </Button>
          </div>
        </form>

        {/* Guidelines Section */}
        <Card className="guidelines-card">
          <h3 className="guidelines-title">
            {t('editQuestionPageGuidelinesTitle', 'Question Guidelines')}
          </h3>
          <ul className="guidelines-list">
            <li>{t('editQuestionPageGuideline1', 'Be specific and clear about your nutrition question')}</li>
            <li>{t('editQuestionPageGuideline2', 'Include relevant health conditions or dietary restrictions')}</li>
            <li>{t('editQuestionPageGuideline3', 'Avoid asking for specific medical diagnoses')}</li>
            <li>{t('editQuestionPageGuideline4', 'Only verified dietitians can provide answers')}</li>
            <li>{t('editQuestionPageGuideline5', 'Questions are subject to community moderation')}</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default EditQuestionPage;
