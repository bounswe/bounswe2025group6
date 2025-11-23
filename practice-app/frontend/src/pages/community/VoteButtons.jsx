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
  const { t } = useTranslation();

  const handleVote = (voteType) => {
    if (!currentUser) {
      toast.info(t('votePleaseLogIn'));
      return;
    }

    if (voteType === 'up') {
      onUpvote();
    } else {
      onDownvote();
    }
  };

  const handleRemoveVote = () => {
    if (!currentUser) {
      toast.info(t('votePleaseLogInManage'));
      return;
    }

    onRemoveVote();
  };

  return (
    <div className={`vote-buttons vote-buttons-${size}`}>
      <button 
        onClick={() => handleVote('up')} 
        className={`vote-button ${userVote === 'up' ? 'vote-active' : ''}`}
        aria-label={t('voteUpvote')}
      >
        ▲ {upvotes || 0}
      </button>
      
      <button 
        onClick={() => handleVote('down')} 
        className={`vote-button ${userVote === 'down' ? 'vote-active' : ''}`}
        aria-label={t('voteDownvote')}
      >
        ▼ {downvotes || 0}
      </button>
      
      {showRemoveButton && (
        <button 
          onClick={handleRemoveVote} 
          className="vote-button vote-button-remove"
          aria-label={t('voteRemove')}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default VoteButtons;