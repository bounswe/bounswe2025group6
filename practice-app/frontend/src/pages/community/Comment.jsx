// src/components/community/Comment.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import VoteButtons from './VoteButtons';
import '../../styles/Comment.css';

const Comment = ({ comment, onDelete, onVote, onRemoveVote }) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatContent = (content) =>
    content.split('\n').map((line, i) => (
      <React.Fragment key={i}>{line}<br /></React.Fragment>
    ));

  const handleDelete = () => {
    if (!currentUser) {
      toast.info('Please log in to delete comments');
      return;
    }

    if (currentUser.id !== comment.author) {
      toast.warning('You can only delete your own comments');
      return;
    }

    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
  };

  const handleVote = (voteType) => {
    if (!currentUser) {
      toast.info('Please log in to vote');
      return;
    }

    onVote(comment.id, voteType);
  };

  const handleRemoveVote = () => {
    if (!currentUser) {
      toast.info('Please log in to manage your votes');
      return;
    }

    onRemoveVote(comment.id);
  };

  return (
    <div className="comment">
      <div className="comment-header">
        <div className="comment-meta">
          <span className="comment-author">{t("User")} #{comment.author}</span>
          <span className="comment-time">{formatDate(comment.created_at)}</span>
        </div>
        {currentUser && currentUser.id === comment.author && (
          <Button 
            variant="danger" 
            size="sm" 
            onClick={handleDelete}
          >
            {t("Delete")}
          </Button>
        )}
      </div>
      <div className="comment-content">
        {formatContent(comment.content)}
      </div>
      <div className="comment-footer">
        <VoteButtons 
          upvotes={comment.upvote_count || 0}
          downvotes={comment.downvote_count || 0}
          onUpvote={() => handleVote('up')}
          onDownvote={() => handleVote('down')}
          onRemoveVote={handleRemoveVote}
          userVote={comment.user_vote}
          size="small"
        />
      </div>
    </div>
  );
};

export default Comment;