// src/components/community/Comment.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import VoteButtons from './VoteButtons';
import '../../styles/Comment.css';
import { useTranslation } from "react-i18next";

const Comment = ({ comment, onDelete, onVote, onRemoveVote }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const toast = useToast();

  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return t('timeJustNow');
    if (diff < 3600) return t('timeMinutesAgo', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('timeHoursAgo', { count: Math.floor(diff / 3600) });
    if (diff < 604800) return t('timeDaysAgo', { count: Math.floor(diff / 86400) });
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatContent = (content) =>
    content.split('\n').map((line, i) => (
      <React.Fragment key={i}>{line}<br /></React.Fragment>
    ));

  const handleDelete = () => {
    if (!currentUser) {
      toast.info(t('commentPleaseLogInToDelete'));
      return;
    }

    if (currentUser.id !== comment.author) {
      toast.warning(t('commentCanOnlyDeleteOwn'));
      return;
    }

    if (window.confirm(t('commentConfirmDelete'))) {
      onDelete(comment.id);
    }
  };

  const handleVote = (voteType) => {
    if (!currentUser) {
      toast.info(t('commentPleaseLogInToVote'));
      return;
    }

    onVote(comment.id, voteType);
  };

  const handleRemoveVote = () => {
    if (!currentUser) {
      toast.info(t('commentPleaseLogInToManageVotes'));
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