// src/pages/qa/QAPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import ReportButton from '../../components/report/ReportButton';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import qaService from '../../services/qaService';
import userService, { getUsername } from '../../services/userService.js';
import { formatDate } from '../../utils/dateFormatter';
import { getCurrentUser } from '../../services/authService';
import '../../styles/QAPage.css';
import { useTranslation } from "react-i18next";

const QAPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 2,
    total: 0
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  const [userMap, setUserMap] = useState({});
  const [userVotes, setUserVotes] = useState({}); // { questionId: 'up' | 'down' }
  const [userDateFormat, setUserDateFormat] = useState('DD/MM/YYYY');
  const [isModerationExpanded, setIsModerationExpanded] = useState(false);

  // Available tags from API documentation
  const availableTags = [
    'Budget', 'Meal Prep', 'Family', 'No Waste', 'Sustainability', 
    'Tips', 'Gluten Free', 'Vegan', 'Vegetarian', 'Quick',
    'Healthy', 'Student', 'Nutrition', 'Healthy Eating', 'Snacks'
  ];

  useEffect(() => {
    loadQuestions();
    // Load user's preferred date format
    const loadUserDateFormat = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.id) {
          const userData = await userService.getUserById(user.id);
          setUserDateFormat(userData.preferredDateFormat || 'DD/MM/YYYY');
        }
      } catch (error) {
        // Error loading user date format
      }
    };
    loadUserDateFormat();
  }, [pagination.page]);

  // Apply filters when the Apply Filters button is clicked
  const applyFilters = () => {
    // Update URL with current filters
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedTag) params.set('tag', selectedTag);
    if (sortBy && sortBy !== 'recent') params.set('sort', sortBy);
    setSearchParams(params);
    
    const filtered = questions.filter(question => {
      const matchSearch = searchTerm 
        ? question.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          question.content.toLowerCase().includes(searchTerm.toLowerCase()) 
        : true;
      const matchTag = selectedTag ? question.tags.includes(selectedTag) : true;
      return matchSearch && matchTag;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'recent': return new Date(b.created_at) - new Date(a.created_at);
        case 'popular': return b.upvote_count - a.upvote_count;
        case 'answers': return (b.answers_count || 0) - (a.answers_count || 0);
        default: return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    
    setFilteredQuestions(filtered);
  };

  // Reset filters to default state
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTag('');
    setSortBy('recent');
    setSearchParams({}); // Clear URL params
    setFilteredQuestions(questions); // Reset to original questions
  };

  // Initialize filtered questions when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      // Apply filters from URL on initial load
      const filtered = questions.filter(question => {
        const matchSearch = searchTerm 
          ? question.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            question.content.toLowerCase().includes(searchTerm.toLowerCase()) 
          : true;
        const matchTag = selectedTag ? question.tags.includes(selectedTag) : true;
        return matchSearch && matchTag;
      }).sort((a, b) => {
        switch (sortBy) {
          case 'recent': return new Date(b.created_at) - new Date(a.created_at);
          case 'popular': return b.upvote_count - a.upvote_count;
          case 'answers': return (b.answers_count || 0) - (a.answers_count || 0);
          default: return new Date(b.created_at) - new Date(a.created_at);
        }
      });
      setFilteredQuestions(filtered);
    } else {
      setFilteredQuestions(questions);
    }
  }, [questions, searchTerm, selectedTag, sortBy]);

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await qaService.getQuestions(pagination.page, pagination.page_size);
      
      // Update pagination info
      setPagination(prev => ({
        ...prev,
        total: response.count || response.total || 0
      }));

      const questionsData = response.results || response;
      
      // Collect unique author IDs
      const authorIds = [...new Set(questionsData.map(q => q.author).filter(id => id))];
      
      // Load author data with full user details
      const authorPromises = authorIds.map(async (authorId) => {
        try {
          const userData = await userService.getUserById(authorId);
          return {
            id: authorId,
            userData: {
              ...userData,
              username: userData.username || 'Unknown User',
              profilePhoto: userData.profilePhoto || null,
              typeOfCook: userData.typeOfCook || null,
              usertype: userData.usertype || null
            }
          };
        } catch (error) {
          // Error loading user data, try to get at least username
          try {
            const username = await getUsername(authorId);
            return {
              id: authorId,
              userData: {
                id: authorId,
                username: username || 'Unknown User',
                profilePhoto: null,
                typeOfCook: null,
                usertype: null
              }
            };
          } catch (err) {
            return {
              id: authorId,
              userData: {
                id: authorId,
                username: 'Unknown User',
                profilePhoto: null,
                typeOfCook: null,
                usertype: null
              }
            };
          }
        }
      });
      
      const authors = await Promise.all(authorPromises);
      const authorMap = {};
      authors.forEach(author => {
        authorMap[author.id] = author.userData;
      });
      
      setUserMap(prev => ({...prev, ...authorMap}));
      
      // Load user vote statuses for all questions if user is authenticated
      if (currentUser) {
        const votePromises = questionsData.map(async (question) => {
          try {
            const voteStatus = await qaService.checkQuestionVoteStatus(question.id);
            return { questionId: question.id, voteType: voteStatus.voteType };
          } catch (error) {
            return { questionId: question.id, voteType: null };
          }
        });
        
        const voteResults = await Promise.all(votePromises);
        const voteMap = {};
        voteResults.forEach(result => {
          if (result.voteType) {
            voteMap[result.questionId] = result.voteType;
          }
        });
        setUserVotes(voteMap);
      }

      setQuestions(questionsData);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load questions. Please try again later.');
      setIsLoading(false);
      toast.error('Failed to load questions');
    }
  };

  const handleVote = async (questionId, voteType) => {
    if (!currentUser) {
      toast.error('Please login to vote');
      return;
    }

    try {
      // Check if user already voted
      const currentVote = userVotes[questionId];

      if (currentVote === voteType) {
        // Remove vote if clicking same vote type
        await qaService.deleteVoteQuestion(questionId);
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[questionId];
          return newVotes;
        });
        
        // Update question vote count in state
        setQuestions(prev => prev.map(question => {
          if (question.id === questionId) {
            return {
              ...question,
              [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                Math.max(0, question[voteType === 'up' ? 'upvote_count' : 'downvote_count'] - 1)
            };
          }
          return question;
        }));
      } else if (currentVote) {
        // If user had different vote, delete old vote and create new one
        const oldVoteType = currentVote;
        try {
          await qaService.deleteVoteQuestion(questionId);
        } catch (deleteError) {
          // If delete fails, still try to create new vote (might already be deleted)
          // This handles race conditions where vote was already deleted
        }
        await qaService.voteQuestion(questionId, voteType);
        setUserVotes(prev => ({ ...prev, [questionId]: voteType }));
        
        // Update question vote count in state
        setQuestions(prev => prev.map(question => {
          if (question.id === questionId) {
            return {
              ...question,
              // Decrement old vote
              [oldVoteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                Math.max(0, question[oldVoteType === 'up' ? 'upvote_count' : 'downvote_count'] - 1),
              // Increment new vote
              [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                question[voteType === 'up' ? 'upvote_count' : 'downvote_count'] + 1
            };
          }
          return question;
        }));
      } else {
        // No existing vote, create new one
        await qaService.voteQuestion(questionId, voteType);
        setUserVotes(prev => ({ ...prev, [questionId]: voteType }));
        
        // Update question vote count in state
        setQuestions(prev => prev.map(question => {
          if (question.id === questionId) {
            return {
              ...question,
              [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                question[voteType === 'up' ? 'upvote_count' : 'downvote_count'] + 1
            };
          }
          return question;
        }));
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('You have already voted on this question');
      } else {
        toast.error('Failed to vote. Please try again.');
      }
    }
  };

  const handleCreateQuestion = () => {
    if (!currentUser) {
      toast.error('Please login to ask a question');
      return;
    }
    navigate('/qa/create-question');
  };

  const goToQuestionDetail = (questionId, event) => {
    // Prevent navigation if clicking on interactive elements
    if (event.target.closest('.vote-button') || 
        event.target.closest('.report-button') || 
        event.target.closest('.author-link')) {
      return;
    }
    // Build URL with current filters
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedTag) params.set('tag', selectedTag);
    if (sortBy && sortBy !== 'recent') params.set('sort', sortBy);
    const queryString = params.toString();
    navigate(`/qa/question/${questionId}${queryString ? `?from=qa&${queryString}` : '?from=qa'}`);
  };

  const goToUserProfile = (authorId, event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/profile/${authorId}`);
  };

  if (isLoading) {
    return (
      <div className="qa-container">
        <div className="qa-loading">
          <h2>Loading Questions...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qa-container">
        <Card className="qa-error">
          <h2>Error Loading Questions</h2>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="qa-container">
      {/* Header Section */}
      <div className="qa-header">
        <div>
          <h1 className="qa-title">{t('qaPageTitle', 'Q&A Community')}</h1>
          <p className="qa-subtitle">
            {t('qaPageSubtitle', 'Ask nutrition questions and get answers from verified dietitians')}
          </p>
        </div>
        <Button 
          onClick={handleCreateQuestion}
          className="qa-create-button"
        >
          {t('qaPageCreateQuestion', 'Ask Question')}
        </Button>
      </div>

      {/* Moderation Rules Section */}
      <Card className="qa-moderation-rules">
        <div className="qa-moderation-header">
          <Button
            onClick={() => setIsModerationExpanded(!isModerationExpanded)}
            variant="outline"
            className="qa-moderation-toggle"
          >
            {isModerationExpanded ? '▼' : '▶'} {t('qaModerationRulesTitle', 'Moderation Rules')}
          </Button>
        </div>
        {isModerationExpanded && (
          <div className="qa-moderation-content">
            <div className="qa-rule">
              <h3>{t('qaRuleVerifiedDietitiansTitle', '✅ Verified Dietitians Only')}</h3>
              <p>{t('qaRuleVerifiedDietitiansDesc', 'Only verified dietitians with appropriate certifications can provide answers to ensure professional, reliable nutrition advice.')}</p>
            </div>
            <div className="qa-rule">
              <h3>{t('qaRuleModerationTitle', '🛡️ Content Moderation')}</h3>
              <p>{t('qaRuleModerationDesc', 'All questions and answers are subject to moderation. Content that violates our community guidelines will be removed. Users can report inappropriate content for review.')}</p>
            </div>
            <div className="qa-rule">
              <h3>{t('qaRuleFairnessTitle', '⚖️ Fair & Non-Discriminatory')}</h3>
              <p>{t('qaRuleFairnessDesc', 'Our moderation is based on clear, transparent guidelines ensuring fair treatment of all users regardless of background, dietary preferences, or health conditions.')}</p>
            </div>
            <div className="qa-rule">
              <h3>{t('qaRuleLanguageTitle', '🌍 Multilingual Support')}</h3>
              <p>{t('qaRuleLanguageDesc', 'Questions and answers are available in multiple languages with proper localization to ensure accessible nutrition information for all users.')}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Filters Section */}
      <Card className="qa-filters">
        <div className="qa-filter-row">
          <input
            type="text"
            placeholder={t('qaPageSearchPlaceholder', 'Search questions...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="qa-input"
          />
          
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="qa-select"
          >
            <option value="">{t('qaPageAllTags', 'All Tags')}</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>
                {t(`tag${tag.replace(/\s+/g, '')}`, tag)}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="qa-select"
          >
            <option value="recent">{t('qaPageSortRecent', 'Most Recent')}</option>
            <option value="popular">{t('qaPageSortPopular', 'Most Popular')}</option>
            <option value="answers">{t('qaPageSortAnswers', 'Most Answers')}</option>
          </select>
          
          <Button 
            onClick={applyFilters}
            className="apply-filters-btn"
          >
            {t('qaPageApplyFilters', 'Apply Filters')}
          </Button>
          
          <Button 
            onClick={resetFilters}
            variant="secondary"
            className="reset-filters-btn"
          >
            {t('qaPageResetFilters', 'Reset')}
          </Button>
        </div>
      </Card>

      {/* Questions Section */}
      <div className="qa-questions">
        {filteredQuestions.length === 0 ? (
          <Card className="qa-empty">
            <h2>{t('qaPageNoQuestions', 'No Questions Found')}</h2>
            <p>{t('qaPageNoQuestionsDesc', 'Be the first to ask a nutrition question!')}</p>
            <Button onClick={handleCreateQuestion}>
              {t('qaPageCreateQuestion', 'Ask Question')}
            </Button>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card 
              key={question.id} 
              className="qa-question-card"
              onClick={(e) => goToQuestionDetail(question.id, e)}
            >
              <div className="qa-question">
                <div className="qa-question-content">
                  <div className="qa-question-header">
                    <div className="question-author-wrapper">
                      <div className="author-info">
                        {userMap[question.author]?.profilePhoto || question.author_profile_image ? (
                          <img 
                            src={userMap[question.author]?.profilePhoto || question.author_profile_image} 
                            alt={userMap[question.author]?.username || 'User'}
                            className="author-avatar"
                            onClick={(e) => goToUserProfile(question.author, e)}
                          />
                        ) : (
                          <div 
                            className="author-avatar-placeholder"
                            onClick={(e) => goToUserProfile(question.author, e)}
                          >
                            {(userMap[question.author]?.username || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <span 
                          className="author-link"
                          onClick={(e) => goToUserProfile(question.author, e)}
                        >
                          {userMap[question.author]?.username || t('qaPageUnknownUser', 'Unknown User')}
                          <Badge 
                            badge={userMap[question.author]?.typeOfCook} 
                            size="small" 
                            usertype={userMap[question.author]?.usertype} 
                          />
                        </span>
                      </div>
                    </div>
                    <div className="question-date">
                      {formatDate(question.created_at, userDateFormat, t)}
                    </div>
                  </div>

                  <h2>{question.title}</h2>
                  <p>{question.content?.substring(0, 200)}
                    {question.content?.length > 200 && '...'}
                  </p>

                  {question.tags && question.tags.length > 0 && (
                    <div className="qa-tags">
                      {question.tags.map((tag, index) => (
                        <span key={index}>
                          {t(`tag${tag.replace(/\s+/g, '')}`, tag)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="qa-actions">
                    <div className="vote-buttons">
                      <button
                        className={`vote-button ${userVotes[question.id] === 'up' ? 'voted-up' : ''}`}
                        data-vote-type="up"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(question.id, 'up');
                        }}
                      >
                        👍 {question.upvote_count || 0}
                      </button>
                      <button
                        className={`vote-button ${userVotes[question.id] === 'down' ? 'voted-down' : ''}`}
                        data-vote-type="down"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(question.id, 'down');
                        }}
                      >
                        👎 {question.downvote_count || 0}
                      </button>
                    </div>

                    <div className="question-stats">
                      <span>
                        {question.answers_count || 0} {(question.answers_count || 0) === 1
                          ? t('qaPageAnswer', 'answer')
                          : t('qaPageAnswers', 'answers')}
                      </span>
                      <span>
                        {question.view_count || 0} {(question.view_count || 0) === 1
                          ? t('qaPageView', 'view')
                          : t('qaPageViews', 'views')}
                      </span>
                    </div>

                    <div className="question-report">
                      <ReportButton 
                        contentType="question"
                        objectId={question.id}
                        variant="icon"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredQuestions.length > 0 && (() => {
        const total = pagination.total || 0;
        const pageSize = pagination.page_size || 10;
        const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;
        const currentPage = pagination.page || 1;
        const hasNextPage = currentPage < totalPages;
        const hasPreviousPage = currentPage > 1;
        
        // Format: "1" if only 1 page, "1/3" if multiple pages
        const pageInfo = totalPages === 1 
          ? `${currentPage}` 
          : `${currentPage} / ${totalPages}`;
        
        return (
          <div className="qa-pagination">
            <Button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={!hasPreviousPage}
              className="pagination-button"
            >
              {t('qaPagePrevious', 'Previous')}
            </Button>
            
            <span className="pagination-info">
              {pageInfo}
            </span>
            
            <Button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!hasNextPage}
              className="pagination-button"
            >
              {t('qaPageNext', 'Next')}
            </Button>
          </div>
        );
      })()}
    </div>
  );
};

export default QAPage;
