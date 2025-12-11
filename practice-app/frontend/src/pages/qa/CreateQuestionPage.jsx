// src/pages/qa/CreateQuestionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import qaService from '../../services/qaService';
import '../../styles/CreateQuestionPage.css';
import { useTranslation } from "react-i18next";

const CreateQuestionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_commentable: true,
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available tags from API documentation
  const availableTags = [
    'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
    'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
    'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
  ];

  useEffect(() => {
    document.title = t('createQuestionPageTitle', 'Ask a Question - FitHub');
  }, [t]);

  useEffect(() => {
    if (!currentUser) {
      toast.error(t('createQuestionPageLoginRequired', 'Please login to ask a question'));
      navigate('/login');
      return;
    }
  }, [currentUser, navigate, toast, t]);

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
      toast.error(t('createQuestionPageTitleRequired', 'Question title is required'));
      return;
    }

    if (!formData.content.trim()) {
      toast.error(t('createQuestionPageContentRequired', 'Question content is required'));
      return;
    }

    if (formData.content.trim().length < 20) {
      toast.error(t('createQuestionPageContentTooShort', 'Question content must be at least 20 characters long'));
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

      console.log('Submitting question:', questionData);
      const response = await qaService.createQuestion(questionData);
      console.log('Question created:', response);

      toast.success(t('createQuestionPageSuccess', 'Question asked successfully!'));
      navigate(`/qa/question/${response.id}`);
    } catch (error) {
      console.error('Error creating question:', error);
      
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else if (error.response?.data?.tags) {
        toast.error(`Invalid tags: ${error.response.data.tags}`);
      } else {
        toast.error(t('createQuestionPageError', 'Failed to ask question. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/qa');
  };

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="create-question-container">
      <Card className="create-question-card">
        <div className="create-question-header">
          <h1 className="create-question-title">
            {t('createQuestionPageHeading', 'Ask a Nutrition Question')}
          </h1>
          <p className="create-question-subtitle">
            {t('createQuestionPageSubtitle', 'Get professional answers from verified dietitians')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="create-question-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              {t('createQuestionPageTitleLabel', 'Question Title')} *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('createQuestionPageTitlePlaceholder', 'What nutrition question do you have?')}
              className="form-input"
              maxLength={200}
              required
            />
            <div className="form-hint">
              {t('createQuestionPageTitleHint', 'Be specific and clear about what you want to know')}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              {t('createQuestionPageContentLabel', 'Question Details')} *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder={t('createQuestionPageContentPlaceholder', 'Provide more details about your nutrition question, including any relevant health conditions, dietary preferences, or specific concerns...')}
              className="form-textarea"
              rows={6}
              minLength={20}
              required
            />
            <div className="form-hint">
              {t('createQuestionPageContentHint', 'Minimum 20 characters. Include relevant details for better answers.')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('createQuestionPageTagsLabel', 'Tags')}
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
              {t('createQuestionPageTagsHint', 'Select relevant tags to help categorize your question')}
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
                {t('createQuestionPageAllowAnswers', 'Allow dietitians to answer this question')}
              </label>
            </div>
            <div className="form-hint">
              {t('createQuestionPageAllowAnswersHint', 'Uncheck only if you want to share information without seeking answers')}
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
              {t('createQuestionPageCancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('createQuestionPageSubmitting', 'Asking...') : t('createQuestionPageSubmit', 'Ask Question')}
            </Button>
          </div>
        </form>

        {/* Guidelines Section */}
        <Card className="guidelines-card">
          <h3 className="guidelines-title">
            {t('createQuestionPageGuidelinesTitle', 'Question Guidelines')}
          </h3>
          <ul className="guidelines-list">
            <li>{t('createQuestionPageGuideline1', 'Be specific and clear about your nutrition question')}</li>
            <li>{t('createQuestionPageGuideline2', 'Include relevant health conditions or dietary restrictions')}</li>
            <li>{t('createQuestionPageGuideline3', 'Avoid asking for specific medical diagnoses')}</li>
            <li>{t('createQuestionPageGuideline4', 'Only verified dietitians can provide answers')}</li>
            <li>{t('createQuestionPageGuideline5', 'Questions are subject to community moderation')}</li>
          </ul>
        </Card>
      </Card>
    </div>
  );
};

export default CreateQuestionPage;
