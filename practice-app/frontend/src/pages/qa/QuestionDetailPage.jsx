// src/pages/qa/QuestionDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import qaService from '../../services/qaService';
import userService, { getUsername } from '../../services/userService.js';
import { formatDate } from '../../utils/dateFormatter';
import { getCurrentUser } from '../../services/authService';
import '../../styles/QuestionDetailPage.css';
import ReportButton from '../../components/report/ReportButton';
import { useTranslation } from "react-i18next";
import { shareContent } from '../../utils/shareUtils';
import reportService from '../../services/reportService';

const QuestionDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const toast = useToast();

  // Admin report handling
  const fromAdmin = searchParams.get('fromAdmin') === 'true';
  const reportId = searchParams.get('reportId');
  const highlightAnswerId = searchParams.get('answerId');
  const [isProcessingReport, setIsProcessingReport] = useState(false);

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnswers, setIsLoadingAnswers] = useState(true);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const [answerPagination, setAnswerPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0
  });
  
  // Track if user has voted and what type of vote
  const [userQuestionVote, setUserQuestionVote] = useState({
    hasVoted: false,
    voteType: null // 'up' or 'down'
  });
  const [userAnswerVotes, setUserAnswerVotes] = useState({}); // { answerId: voteType }
  const [isVoting, setIsVoting] = useState(false);
  
  // Add state for storing user details
  const [userMap, setUserMap] = useState({});
  const [userDateFormat, setUserDateFormat] = useState('DD/MM/YYYY');

  // Admin report actions
  const handleReportResolve = async (action) => {
    if (!reportId) return;
    setIsProcessingReport(true);
    try {
      if (action === 'keep') {
        await reportService.resolveReportKeep(reportId);
        toast.success(t('reportResolvedKeep', 'Report resolved - content kept'));
      } else if (action === 'delete') {
        await reportService.resolveReportDelete(reportId);
        toast.success(t('reportResolvedDelete', 'Report resolved - content deleted'));
      }
      navigate('/admin-reports');
    } catch (error) {
      toast.error(t('reportResolveFailed', 'Failed to resolve report'));
    } finally {
      setIsProcessingReport(false);
    }
  };

  useEffect(() => {
    // Scroll to top instantly when component mounts or id changes to prevent flickering
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    loadQuestionAndVoteStatus();
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
  }, [id]);

  const loadQuestionAndVoteStatus = async () => {
    setIsLoading(true);
    try {
      const questionData = await qaService.getQuestionById(id);
      setQuestion(questionData);
      
      // Update document title with question title
      if (questionData.title) {
        document.title = `${questionData.title} - ${t('qaPageTitle', 'Q&A Community')} - FitHub`;
      } else {
        document.title = t('questionDetailPageTitle', 'Question Details - FitHub');
      }

      // Load author data with full user details
      try {
        const userData = await userService.getUserById(questionData.author);
        setUserMap(prev => ({
          ...prev,
          [questionData.author]: {
            ...userData,
            username: userData.username || 'Unknown User',
            profilePhoto: userData.profilePhoto || null,
            typeOfCook: userData.typeOfCook || null,
            usertype: userData.usertype || null
          }
        }));
      } catch (error) {
        // Error loading question author data, fallback to username only
        try {
          const username = await getUsername(questionData.author);
          setUserMap(prev => ({
            ...prev,
            [questionData.author]: {
              id: questionData.author,
              username: username || 'Unknown User',
              profilePhoto: null,
              typeOfCook: null,
              usertype: null
            }
          }));
        } catch (err) {
          setUserMap(prev => ({
            ...prev,
            [questionData.author]: {
              id: questionData.author,
              username: 'Unknown User',
              profilePhoto: null,
              typeOfCook: null,
              usertype: null
            }
          }));
        }
      }

      // Load user vote status if authenticated
      if (currentUser) {
        try {
          const voteStatus = await qaService.checkQuestionVoteStatus(id);
          setUserQuestionVote(voteStatus);
        } catch (error) {
          setUserQuestionVote({ hasVoted: false, voteType: null });
        }
      }

      setIsLoading(false);
      loadAnswers();
    } catch (error) {
      setIsLoading(false);
      toast.error(t('questionDetailPageErrorLoading', 'Error loading question'));
    }
  };

  const loadAnswers = async () => {
    setIsLoadingAnswers(true);
    try {
      const response = await qaService.getAnswersByQuestionId(
        id, 
        answerPagination.page, 
        answerPagination.page_size
      );
      
      setAnswerPagination(prev => ({
        ...prev,
        total: response.count
      }));

      const answersData = response.results || response;
      
      // Collect unique author IDs
      const authorIds = [...new Set(answersData.map(a => a.author).filter(aid => aid))];
      
      // Load author data for answers with full user details
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

      // Load user vote statuses for all answers if user is authenticated
      if (currentUser) {
        const votePromises = answersData.map(async (answer) => {
          try {
            const voteStatus = await qaService.checkAnswerVoteStatus(answer.id);
            return { answerId: answer.id, voteType: voteStatus.voteType };
          } catch (error) {
            return { answerId: answer.id, voteType: null };
          }
        });
        
        const voteResults = await Promise.all(votePromises);
        const voteMap = {};
        voteResults.forEach(result => {
          if (result.voteType) {
            voteMap[result.answerId] = result.voteType;
          }
        });
        setUserAnswerVotes(voteMap);
      }

      setAnswers(answersData);
      setIsLoadingAnswers(false);
    } catch (error) {
      setIsLoadingAnswers(false);
      toast.error(t('questionDetailPageErrorLoadingAnswers', 'Error loading answers'));
    }
  };

  const handleQuestionVote = async (voteType) => {
    if (!currentUser) {
      toast.error(t('questionDetailPageLoginToVote', 'Please login to vote'));
      return;
    }

    setIsVoting(true);
    try {
      if (userQuestionVote.voteType === voteType) {
        // Remove vote if clicking same vote type
        await qaService.deleteVoteQuestion(id);
        setUserQuestionVote({ hasVoted: false, voteType: null });
        
        // Update question vote count in state
        setQuestion(prev => ({
          ...prev,
          [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
            Math.max(0, prev[voteType === 'up' ? 'upvote_count' : 'downvote_count'] - 1)
        }));
      } else if (userQuestionVote.hasVoted) {
        // If user had different vote, delete old vote and create new one
        const oldVoteType = userQuestionVote.voteType;
        try {
          await qaService.deleteVoteQuestion(id);
        } catch (deleteError) {
          // If delete fails, still try to create new vote (might already be deleted)
          // This handles race conditions where vote was already deleted
        }
        await qaService.voteQuestion(id, voteType);
        setUserQuestionVote({ hasVoted: true, voteType: voteType });
        
        // Update question vote count in state
        setQuestion(prev => ({
          ...prev,
          // Decrement old vote
          [oldVoteType === 'up' ? 'upvote_count' : 'downvote_count']: 
            Math.max(0, prev[oldVoteType === 'up' ? 'upvote_count' : 'downvote_count'] - 1),
          // Increment new vote
          [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
            prev[voteType === 'up' ? 'upvote_count' : 'downvote_count'] + 1
        }));
      } else {
        // No existing vote, create new one
        await qaService.voteQuestion(id, voteType);
        setUserQuestionVote({ hasVoted: true, voteType: voteType });
        
        // Update question vote count in state
        setQuestion(prev => ({
          ...prev,
          [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
            prev[voteType === 'up' ? 'upvote_count' : 'downvote_count'] + 1
        }));
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(t('questionDetailPageAlreadyVoted', 'You have already voted on this question'));
      } else {
        toast.error(t('questionDetailPageVoteError', 'Failed to vote. Please try again.'));
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleAnswerVote = async (answerId, voteType) => {
    if (!currentUser) {
      toast.error(t('questionDetailPageLoginToVote', 'Please login to vote'));
      return;
    }

    try {
      const currentVote = userAnswerVotes[answerId];

      if (currentVote === voteType) {
        // Remove vote if clicking same vote type
        await qaService.deleteVoteAnswer(answerId);
        setUserAnswerVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[answerId];
          return newVotes;
        });
        
        // Update answer vote count in state
        setAnswers(prev => prev.map(answer => {
          if (answer.id === answerId) {
            return {
              ...answer,
              [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                Math.max(0, answer[voteType === 'up' ? 'upvote_count' : 'downvote_count'] - 1)
            };
          }
          return answer;
        }));
      } else if (currentVote) {
        // If user had different vote, delete old vote and create new one
        const oldVoteType = currentVote;
        try {
          await qaService.deleteVoteAnswer(answerId);
        } catch (deleteError) {
          // If delete fails, still try to create new vote (might already be deleted)
          // This handles race conditions where vote was already deleted
        }
        await qaService.voteAnswer(answerId, voteType);
        setUserAnswerVotes(prev => ({ ...prev, [answerId]: voteType }));
        
        // Update answer vote count in state
        setAnswers(prev => prev.map(answer => {
          if (answer.id === answerId) {
            return {
              ...answer,
              // Decrement old vote
              [oldVoteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                Math.max(0, answer[oldVoteType === 'up' ? 'upvote_count' : 'downvote_count'] - 1),
              // Increment new vote
              [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                answer[voteType === 'up' ? 'upvote_count' : 'downvote_count'] + 1
            };
          }
          return answer;
        }));
      } else {
        // No existing vote, create new one
        await qaService.voteAnswer(answerId, voteType);
        setUserAnswerVotes(prev => ({ ...prev, [answerId]: voteType }));
        
        // Update answer vote count in state
        setAnswers(prev => prev.map(answer => {
          if (answer.id === answerId) {
            return {
              ...answer,
              [voteType === 'up' ? 'upvote_count' : 'downvote_count']: 
                answer[voteType === 'up' ? 'upvote_count' : 'downvote_count'] + 1
            };
          }
          return answer;
        }));
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(t('questionDetailPageAnswerAlreadyVoted', 'You have already voted on this answer'));
      } else {
        toast.error(t('questionDetailPageAnswerVoteError', 'Failed to vote on answer. Please try again.'));
      }
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error(t('questionDetailPageLoginToAnswer', 'Please login to answer'));
      return;
    }

    // Check if user is a dietitian
    const userType = currentUser.userType || currentUser.usertype || '';
    if (userType.toLowerCase() !== 'dietitian') {
      toast.error(t('questionDetailPageOnlyDietitians', 'Only verified dietitians can answer questions'));
      return;
    }

    if (!newAnswer.trim()) {
      toast.error(t('questionDetailPageAnswerRequired', 'Answer content is required'));
      return;
    }

    if (newAnswer.trim().length < 20) {
      toast.error(t('questionDetailPageAnswerTooShort', 'Answer must be at least 20 characters long'));
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      const response = await qaService.createAnswer(id, newAnswer.trim());
      
      // Add new answer to the list and load its author data
      try {
        const userData = await userService.getUserById(response.author);
        setUserMap(prev => ({
          ...prev,
          [response.author]: {
            ...userData,
            username: userData.username || 'Unknown User',
            profilePhoto: userData.profilePhoto || null,
            typeOfCook: userData.typeOfCook || null,
            usertype: userData.usertype || null
          }
        }));
      } catch (error) {
        // Error loading answer author data, fallback to username only
        try {
          const username = await getUsername(response.author);
          setUserMap(prev => ({
            ...prev,
            [response.author]: {
              id: response.author,
              username: username || 'Unknown User',
              profilePhoto: null,
              typeOfCook: null,
              usertype: null
            }
          }));
        } catch (err) {
          setUserMap(prev => ({
            ...prev,
            [response.author]: {
              id: response.author,
              username: 'Unknown User',
              profilePhoto: null,
              typeOfCook: null,
              usertype: null
            }
          }));
        }
      }
      
      setAnswers(prev => [response, ...prev]);
      setNewAnswer('');
      toast.success(t('questionDetailPageAnswerSuccess', 'Answer submitted successfully!'));
      
      // Scroll to the new answer
      setTimeout(() => {
        const answersSection = document.querySelector('.question-answers');
        if (answersSection) {
          answersSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error(t('questionDetailPageOnlyDietitians', 'Only verified dietitians can answer questions'));
      } else if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(t('questionDetailPageAnswerError', 'Failed to submit answer. Please try again.'));
      }
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const goToUserProfile = (authorId, event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/profile/${authorId}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = question?.title || 'Question';
    const text = `Check out this nutrition question: ${title}`;
    
    try {
      await shareContent({ title, text, url });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url);
      toast.success(t('questionDetailPageLinkCopied', 'Link copied to clipboard'));
    }
  };

  if (isLoading) {
    return (
      <div className="question-detail-container">
        <div className="question-detail-loading">
          <h2>{t('questionDetailPageLoading', 'Loading Question...')}</h2>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="question-detail-container">
        <Card className="question-detail-error">
          <h2>{t('questionDetailPageNotFound', 'Question Not Found')}</h2>
          <p>{t('questionDetailPageNotFoundDesc', 'The question you are looking for does not exist or has been removed.')}</p>
          <Button onClick={() => navigate('/qa')}>
            {t('questionDetailPageBackToQA', 'Back to Q&A')}
          </Button>
        </Card>
      </div>
    );
  }

  // Check if current user is a dietitian
  const userType = currentUser?.userType || currentUser?.usertype || '';
  const isDietitian = currentUser && userType.toLowerCase() === 'dietitian';

  return (
    <div className="question-detail-container">
      {/* Admin Report Bar */}
      {fromAdmin && reportId && (
        <div className="admin-report-bar" style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => navigate('/admin-reports')}
              style={{ background: '#4a5568', border: 'none' }}
            >
              ← {t('backToAdminPanel', 'Back to Admin Panel')}
            </Button>
            <span style={{ color: '#fff', fontWeight: '500' }}>
              {t('reviewingReport', 'Reviewing Report')} #{reportId}
              {highlightAnswerId && ` - ${t('answer', 'Answer')} #${highlightAnswerId}`}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              onClick={() => handleReportResolve('keep')}
              disabled={isProcessingReport}
              style={{ background: '#38a169', border: 'none', color: '#fff' }}
              size="sm"
            >
              {isProcessingReport ? '...' : t('resolveKeep', 'Resolve - Keep')}
            </Button>
            <Button 
              onClick={() => handleReportResolve('delete')}
              disabled={isProcessingReport}
              style={{ background: '#e53e3e', border: 'none', color: '#fff' }}
              size="sm"
            >
              {isProcessingReport ? '...' : t('resolveDelete', 'Resolve - Delete')}
            </Button>
          </div>
        </div>
      )}

      {/* Back to Q&A Button */}
      <div className="back-to-qa">
        <Button
          variant="outline"
          onClick={() => {
            // Preserve filters from URL if coming from Q&A page
            const searchParams = new URLSearchParams(location.search);
            const from = searchParams.get('from');
            if (from === 'qa') {
              // Extract filter params from URL
              const filterParams = new URLSearchParams();
              if (searchParams.get('search')) filterParams.set('search', searchParams.get('search'));
              if (searchParams.get('tag')) filterParams.set('tag', searchParams.get('tag'));
              if (searchParams.get('sort')) filterParams.set('sort', searchParams.get('sort'));
              const queryString = filterParams.toString();
              navigate(`/qa${queryString ? `?${queryString}` : ''}`);
            } else {
              navigate('/qa');
            }
          }}
          className="back-button"
        >
          ← {t('questionDetailPageBackToQA', 'Back to Q&A')}
        </Button>
      </div>

      {/* Question Section */}
      <Card className="question-detail-card">
        <div className="question-detail-header">
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
              <div>
                <span 
                  className="author-link"
                  onClick={(e) => goToUserProfile(question.author, e)}
                >
                  {userMap[question.author]?.username || t('questionDetailPageUnknownUser', 'Unknown User')}
                  <Badge 
                    badge={userMap[question.author]?.typeOfCook} 
                    size="small" 
                    usertype={userMap[question.author]?.usertype} 
                  />
                </span>
                <div className="question-meta">
                  {formatDate(question.created_at, userDateFormat, t)}
                </div>
              </div>
            </div>
            <div className="question-actions-top">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="share-button"
              >
                {t('questionDetailPageShare', 'Share')}
              </Button>
              <ReportButton 
                contentType="question"
                objectId={question.id}
                variant="icon"
              />
            </div>
          </div>
        </div>

        <div className="question-content">
          <h1 className="question-title">{question.title}</h1>
          
          <div className="question-body">
            {question.content?.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {question.tags && question.tags.length > 0 && (
            <div className="question-tags">
              {question.tags.map((tag, index) => (
                <span key={index}>
                  {t(`tag${tag.replace(/\s+/g, '')}`, tag)}
                </span>
              ))}
            </div>
          )}

          <div className="question-stats-section">
            <div className="vote-section">
              <button
                className={`vote-button ${userQuestionVote.voteType === 'up' ? 'voted-up' : ''}`}
                data-vote-type="up"
                onClick={() => handleQuestionVote('up')}
                disabled={isVoting}
              >
                👍 {question.upvote_count || 0}
              </button>
              <button
                className={`vote-button ${userQuestionVote.voteType === 'down' ? 'voted-down' : ''}`}
                data-vote-type="down"
                onClick={() => handleQuestionVote('down')}
                disabled={isVoting}
              >
                👎 {question.downvote_count || 0}
              </button>
            </div>

            <div className="question-stats">
              <span>
                {answers.length} {answers.length === 1 
                  ? t('questionDetailPageAnswer', 'answer') 
                  : t('questionDetailPageAnswers', 'answers')}
              </span>
              <span>
                {question.view_count || 0} {(question.view_count || 0) === 1
                  ? t('questionDetailPageView', 'view')
                  : t('questionDetailPageViews', 'views')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Answer Form - Only for dietitians */}
      {question.is_commentable && isDietitian && (
        <Card className="answer-form-card">
          <h3 className="answer-form-title">
            {t('questionDetailPageYourAnswer', 'Your Answer')}
          </h3>
          
          <form onSubmit={handleAnswerSubmit} className="answer-form">
            <div className="dietitian-badge-indicator">
              <Badge 
                badge={null} 
                size="small" 
                usertype="dietitian"
              />
              <span className="dietitian-label">
                {t('questionDetailPageVerifiedDietitian', 'Verified Dietitian')}
              </span>
            </div>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder={t('questionDetailPageAnswerPlaceholder', 'Provide a professional, helpful answer to this nutrition question...')}
              className="answer-textarea"
              rows={6}
              minLength={20}
              required
            />
            <div className="answer-form-actions">
              <div className="answer-form-hint">
                {t('questionDetailPageAnswerHint', 'Minimum 20 characters. Provide professional nutrition advice.')}
              </div>
              <Button
                type="submit"
                disabled={isSubmittingAnswer || !newAnswer.trim() || newAnswer.trim().length < 20}
                className="submit-answer-button"
              >
                {isSubmittingAnswer ? t('questionDetailPageSubmittingAnswer', 'Submitting...') : t('questionDetailPageSubmitAnswer', 'Submit Answer')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Answers Section */}
      <div className="question-answers">
        <div className="answers-header">
          <h2 className="answers-title">
            {answers.length > 0 
              ? t('questionDetailPageAnswersCount', '{{count}} Answer', '{{count}} Answers', { count: answers.length })
              : t('questionDetailPageNoAnswers', 'No Answers Yet')
            }
          </h2>
          {answers.length > 0 && (
            <div className="answers-sort">
              <select className="answers-sort-select">
                <option value="recent">{t('questionDetailPageSortRecent', 'Most Recent')}</option>
                <option value="popular">{t('questionDetailPageSortPopular', 'Most Popular')}</option>
              </select>
            </div>
          )}
        </div>

        {isLoadingAnswers ? (
          <div className="answers-loading">
            <p>{t('questionDetailPageLoadingAnswers', 'Loading answers...')}</p>
          </div>
        ) : answers.length === 0 ? (
          <Card className="no-answers">
            <h3>{t('questionDetailPageNoAnswersTitle', 'No Answers Yet')}</h3>
            <p>
              {isDietitian 
                ? t('questionDetailPageNoAnswersDieticianDesc', 'Be the first verified dietitian to answer this question!')
                : t('questionDetailPageNoAnswersDesc', 'This question is waiting for answers from verified dietitians.')
              }
            </p>
          </Card>
        ) : (
          <div className="answers-list">
            {answers.map((answer) => (
              <Card key={answer.id} className="answer-card">
                <div className="answer-header">
                  <div className="answer-author-wrapper">
                    <div className="author-info">
                      {userMap[answer.author]?.profilePhoto || answer.author_profile_image ? (
                        <img 
                          src={userMap[answer.author]?.profilePhoto || answer.author_profile_image} 
                          alt={userMap[answer.author]?.username || 'Dietitian'}
                          className="author-avatar"
                          onClick={(e) => goToUserProfile(answer.author, e)}
                        />
                      ) : (
                        <div 
                          className="author-avatar-placeholder"
                          onClick={(e) => goToUserProfile(answer.author, e)}
                        >
                          {(userMap[answer.author]?.username || 'D')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="author-name-wrapper">
                          <span 
                            className="author-link"
                            onClick={(e) => goToUserProfile(answer.author, e)}
                          >
                            {userMap[answer.author]?.username || t('questionDetailPageUnknownUser', 'Unknown User')}
                            <Badge 
                              badge={userMap[answer.author]?.typeOfCook} 
                              size="small" 
                              usertype={userMap[answer.author]?.usertype} 
                            />
                          </span>
                        </div>
                        <div className="answer-meta">
                          {formatDate(answer.created_at, userDateFormat, t)}
                        </div>
                      </div>
                    </div>
                    <div className="answer-actions-top">
                      <ReportButton 
                        contentType="answer"
                        objectId={answer.id}
                        variant="icon"
                      />
                    </div>
                  </div>
                </div>

                <div className="answer-content">
                  <div className="answer-body">
                    {answer.content?.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="answer-actions">
                    <div className="vote-section">
                      <button
                        className={`vote-button ${userAnswerVotes[answer.id] === 'up' ? 'voted-up' : ''}`}
                        data-vote-type="up"
                        onClick={() => handleAnswerVote(answer.id, 'up')}
                      >
                        👍 {answer.upvote_count || 0}
                      </button>
                      <button
                        className={`vote-button ${userAnswerVotes[answer.id] === 'down' ? 'voted-down' : ''}`}
                        data-vote-type="down"
                        onClick={() => handleAnswerVote(answer.id, 'down')}
                      >
                        👎 {answer.downvote_count || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Answer Pagination */}
        {answers.length > 0 && answerPagination.total > answerPagination.page_size && (
          <div className="answers-pagination">
            <Button
              onClick={() => setAnswerPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={answerPagination.page === 1}
              variant="outline"
              size="sm"
            >
              {t('questionDetailPagePrevious', 'Previous')}
            </Button>
            
            <span className="pagination-info">
              {t('questionDetailPagePaginationInfo', 'Page {{current}} of {{total}}', {
                current: answerPagination.page,
                total: Math.ceil(answerPagination.total / answerPagination.page_size)
              })}
            </span>
            
            <Button
              onClick={() => setAnswerPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={answerPagination.page >= Math.ceil(answerPagination.total / answerPagination.page_size)}
              variant="outline"
              size="sm"
            >
              {t('questionDetailPageNext', 'Next')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailPage;
