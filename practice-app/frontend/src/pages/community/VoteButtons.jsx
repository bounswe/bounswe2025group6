// src/components/community/VoteButtons.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import '../../styles/VoteButtons.css';
import { useTranslation } from "react-i18next";

const VoteButtons = ({ 
  upvotes, 
  downvotes, 
  onUpvote, 
  onDownvote, 
  onRemoveVote,
  userVote, // 'up', 'down', or null
  showRemoveButton = true,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const handleVote = (voteType) => {
    if (!currentUser) {
      toast.info('Please log in to vote');
      return;
    }

    if (voteType === 'up') {
      onUpvote();
    } else {
      onDownvote();
    }
  };

  const { t } = useTranslation();

  const handleRemoveVote = () => {
    if (!currentUser) {
      toast.info('Please log in to manage your votes');
      return;
    }

    onRemoveVote();
  };

  return (
    <div className={`vote-buttons vote-buttons-${size}`}>
      <button 
        onClick={() => handleVote('up')} 
        className={`vote-button ${userVote === 'up' ? 'vote-active' : ''}`}
        aria-label="Upvote"
      >
        ▲ {upvotes || 0}
      </button>
      
      <button 
        onClick={() => handleVote('down')} 
        className={`vote-button ${userVote === 'down' ? 'vote-active' : ''}`}
        aria-label="Downvote"
      >
        ▼ {downvotes || 0}
      </button>
      
      {showRemoveButton && (
        <button 
          onClick={handleRemoveVote} 
          className="vote-button vote-button-remove"
          aria-label="Remove vote"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default VoteButtons;