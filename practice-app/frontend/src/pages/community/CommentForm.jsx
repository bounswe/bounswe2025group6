// src/components/community/CommentForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/CommentForm.css';
import { useTranslation } from "react-i18next";

const CommentForm = ({ postId, onCommentAdded }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.info(t('commentFormPleaseLogIn'));
      return;
    }
    
    if (!content.trim()) {
      toast.warning(t('commentFormCannotBeEmpty'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // You would call your API service here
      // Example: await forumService.createComment(postId, content);
      
      // For testing, let's simulate a successful comment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Clear form and notify parent
      setContent('');
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      toast.success(t('commentFormAddedSuccessfully'));
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 403) {
        toast.warning(t('commentFormDisabled'));
      } else {
        toast.error(t('commentFormFailedToAdd'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-form-container">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('commentFormPlaceholder')}
          disabled={isSubmitting}
          required
        />
        <div className="comment-form-actions">
          <Button 
            type="submit" 
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? t('commentFormPosting') : t('commentFormPostButton')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;