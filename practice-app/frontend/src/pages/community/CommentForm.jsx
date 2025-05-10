// src/components/community/CommentForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import '../../styles/CommentForm.css';

const CommentForm = ({ postId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.info('Please log in to comment');
      return;
    }
    
    if (!content.trim()) {
      toast.warning('Comment cannot be empty');
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
      
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 403) {
        toast.warning('Comments are disabled for this post');
      } else {
        toast.error('Failed to add comment');
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
          placeholder="Write a comment..."
          disabled={isSubmitting}
          required
        />
        <div className="comment-form-actions">
          <Button 
            type="submit" 
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CommentForm;