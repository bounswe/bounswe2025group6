import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/CreatePostPage.css';

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    'Budget', 'MealPrep', 'Family', 'NoWaste', 'Sustainability', 'Tips',
    'GlutenFree', 'Vegan', 'Vegetarian', 'Quick', 'Healthy', 'Student',
    'Nutrition', 'HealthyEating', 'Snacks'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      }
      if (prev.tags.length < 5) {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
      toast.info('You can select up to 5 tags');
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.warning('Please enter a title');
      return;
    }
    if (!formData.content.trim()) {
      toast.warning('Please enter content');
      return;
    }
    if (formData.tags.length === 0) {
      toast.warning('Please select at least one tag');
      return;
    }

    setIsSubmitting(true);

    try {
      setTimeout(() => {
        toast.success('Post created successfully!');
        navigate('/community');
      }, 1000);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-header">
        <h1 className="create-post-title">Create a Post</h1>
        <p className="create-post-subtitle">Share your thoughts, questions, or ideas with the community</p>
      </div>

      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title" className="form-label">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter a title for your post"
                maxLength={100}
                required
              />
              <p className="form-helper">{formData.title.length}/100 characters</p>
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">Content *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="form-input"
                placeholder="What do you want to share or ask?"
                rows="8"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags * (Select up to 5)</label>
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
              <p className="form-helper">{formData.tags.length}/5 tags selected</p>
            </div>

            <div className="form-actions">
              <Button 
                type="button"
                variant="secondary"
                onClick={() => navigate('/community')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreatePostPage;
