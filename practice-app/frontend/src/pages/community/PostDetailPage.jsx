// src/pages/community/PostDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import forumService from '../../services/forumService';
import userService from '../../services/userService.js'; // Import userService
import { formatDate } from '../../utils/dateFormatter';
import { getCurrentUser } from '../../services/authService';
import '../../styles/PostDetailPage.css';
import ReportButton from '../../components/report/ReportButton';
import { useTranslation } from "react-i18next";

const PostDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentPagination, setCommentPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0
  });
  // Track if user has voted and what type of vote
  const [userVote, setUserVote] = useState({
    hasVoted: false,
    voteType: null // 'up' or 'down'
  });
  const [isVoting, setIsVoting] = useState(false);
  // Add state for storing user details
  const [userMap, setUserMap] = useState({});
  const [userDateFormat, setUserDateFormat] = useState('DD/MM/YYYY');

  useEffect(() => {
    loadPostAndVoteStatus();
    // Load user's preferred date format
    const loadUserDateFormat = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.id) {
          const userData = await userService.getUserById(user.id);
          setUserDateFormat(userData.preferredDateFormat || 'DD/MM/YYYY');
        }
      } catch (error) {
        console.error('Error loading user date format:', error);
      }
    };
    loadUserDateFormat();
  }, [id, currentUser]);

  useEffect(() => {
    if (post && post.is_commentable) {
      loadComments();
    }
  }, [post, commentPagination.page]);

  // Updated loadPostAndVoteStatus function in PostDetailPage.jsx

  const loadPostAndVoteStatus = async () => {
    setIsLoading(true);
    try {
      // Load post details
      const postData = await forumService.getPostById(id);
      setPost(postData);
      
      // Fetch author details
      if (postData) {
        fetchUserDetails([postData.author]);
      }
      
      // Check vote status if user is logged in
      if (currentUser) {
        try {
          console.log("Checking vote status for user:", currentUser.id);
          const voteStatus = await forumService.checkPostVoteStatus(id);
          console.log("Vote status received:", voteStatus);
          
          // Only set hasVoted to true if we have a valid vote type
          if (voteStatus.hasVoted && !voteStatus.voteType) {
            console.log("Has voted is true but vote type is undefined - fixing this inconsistency");
            voteStatus.hasVoted = false;  // Reset hasVoted to false if no vote type
            voteStatus.voteType = null;
          }
          
          setUserVote(voteStatus);
          
          // Make sure the post data reflects the user's vote count
          if (voteStatus.hasVoted) {
            console.log("User has voted with type:", voteStatus.voteType);
          }
        } catch (error) {
          console.error('Error checking vote status:', error);
          // Set default vote status on error
          setUserVote({ hasVoted: false, voteType: null });
          
          // Don't show error to the user, just log it
          console.log("Could not get vote status, assuming no vote");
        }
      } else {
        // Reset user vote when no user is logged in
        setUserVote({ hasVoted: false, voteType: null });
      }
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated loadComments function for PostDetailPage.jsx

  const loadComments = async () => {
    if (!post || !post.is_commentable) return;
    
    setIsLoadingComments(true);
    try {
      const data = await forumService.getCommentsByPostId(
        id, 
        commentPagination.page, 
        commentPagination.page_size
      );
      
      // Get unique author IDs from comments
      const commentAuthorIds = [...new Set((data.results || []).map(comment => comment.author))];
      
      // Fetch user details for comment authors
      fetchUserDetails(commentAuthorIds);
      
      // Process comments to add vote status if user is logged in
      let processedComments = data.results || [];
      
      if (currentUser) {
        // Fetch vote status for each comment
        const commentsWithVoteStatus = await Promise.all(
          processedComments.map(async (comment) => {
            try {
              const voteStatus = await forumService.checkCommentVoteStatus(comment.id);
              
              // Validate vote status - ensure consistency
              if (voteStatus.hasVoted && !voteStatus.voteType) {
                console.log(`Comment ${comment.id} has invalid vote status - fixing`);
                voteStatus.hasVoted = false;
                voteStatus.voteType = null;
              }
              
              return { ...comment, userVote: voteStatus };
            } catch (error) {
              return { ...comment, userVote: { hasVoted: false, voteType: null } };
            }
          })
        );
        processedComments = commentsWithVoteStatus;
      }
      
      setComments(processedComments);
      setCommentPagination({
        page: data.page || 1,
        page_size: data.page_size || 10,
        total: data.total || 0
      });
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Function to fetch user details
  const fetchUserDetails = async (userIds) => {
    try {
      const newUserMap = { ...userMap };
      
      // Fetch only users that aren't already in our map
      const idsToFetch = userIds.filter(id => !newUserMap[id]);
      
      if (idsToFetch.length > 0) {
        // Fetch user details and badges in parallel
        const userPromises = idsToFetch.map(async (userId) => {
          try {
            const userData = await userService.getUserById(userId);
            const badgeData = await userService.getUserRecipeCount(userId);
            return {
              id: userId,
              user: userData,
              badge: badgeData.badge
            };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return { id: userId, user: null, badge: null };
          }
        });
        
        const userResults = await Promise.all(userPromises);
        
        userResults.forEach(({ id, user, badge }) => {
          if (user) {
            newUserMap[id] = {
              ...user,
              badge: badge,
              usertype: user.usertype || null
            };
          } else {
            newUserMap[id] = { id: id, username: `User ${id}`, badge: null, usertype: null };
          }
        });
        
        setUserMap(newUserMap);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Function to get user's name/username from userMap
  const getUserName = (userId) => {
    if (!userMap[userId]) {
      return `User #${userId}`;  // Fallback if user details not available
    }
    
    // Return username or full name depending on what's available
    return userMap[userId].username ;
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.info('Please log in to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.warning('Comment cannot be empty');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await forumService.createComment(id, newComment);
      setNewComment('');
      // Reload comments to show the new one
      loadComments();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 403) {
        toast.warning('Comments are disabled for this post');
      } else {
        toast.error('Failed to add comment');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Updated handleVote function in PostDetailPage.jsx

  const handleVote = async (voteType) => {
    if (!currentUser) {
      toast.info('Please log in to vote');
      return;
    }

    if (isVoting) {
      return; // Prevent multiple clicks
    }

    setIsVoting(true);
    console.log("Current vote status before voting:", userVote);
    console.log("Attempting to vote:", voteType);

    try {
      // If we're voting the same way we already voted, remove the vote
      if (userVote.hasVoted && userVote.voteType === voteType) {
        console.log("Removing vote because user clicked same vote type");
        
        // First update UI optimistically
        setUserVote({ hasVoted: false, voteType: null });
        
        // Update counts
        if (voteType === 'up') {
          setPost(prev => ({ ...prev, upvote_count: Math.max(0, prev.upvote_count - 1) }));
        } else {
          setPost(prev => ({ ...prev, downvote_count: Math.max(0, prev.downvote_count - 1) }));
        }
        
        // Send API request
        await forumService.deleteVotePost(id);
        toast.success('Vote removed');
      } 
      // Else if we're voting a different way than our current vote, or voting for the first time
      else {
        // Calculate vote count changes
        let upvoteChange = 0;
        let downvoteChange = 0;
        
        if (userVote.hasVoted) {
          console.log("Changing vote from", userVote.voteType, "to", voteType);
          // Changing vote
          if (userVote.voteType === 'up') {
            // Changing from upvote to downvote
            upvoteChange = -1;
            downvoteChange = 1;
          } else {
            // Changing from downvote to upvote
            upvoteChange = 1;
            downvoteChange = -1;
          }
          
          // Delete the old vote first
          console.log("Deleting old vote");
          try {
            await forumService.deleteVotePost(id);
          } catch (err) {
            console.log("Error deleting vote, but will continue:", err);
            // Continue despite error - we'll still try to create the new vote
          }
        } else {
          console.log("Adding new vote:", voteType);
          // New vote
          if (voteType === 'up') {
            upvoteChange = 1;
          } else {
            downvoteChange = 1;
          }
        }
        
        // Update UI optimistically
        console.log("Setting userVote to:", { hasVoted: true, voteType });
        setUserVote({ hasVoted: true, voteType });
        
        // Update post vote counts
        setPost(prev => ({
          ...prev,
          upvote_count: Math.max(0, prev.upvote_count + upvoteChange),
          downvote_count: Math.max(0, prev.downvote_count + downvoteChange)
        }));
        
        // Send API request for new vote
        console.log("Sending vote API request:", voteType);
        await forumService.votePost(id, voteType);
        toast.success(`Post ${voteType}voted`);
      }
    } catch (error) {
      console.error('Error voting on post:', error);
      
      // Handle specific error responses
      if (error.response?.status === 409 || 
          (error.response?.data?.message && error.response.data.message.includes("already voted"))) {
        toast.info('You have already voted on this post');
        
        try {
          // Refresh vote status to ensure UI is consistent
          console.log("Refreshing vote status after error");
          const voteStatus = await forumService.checkPostVoteStatus(id);
          console.log("Updated vote status:", voteStatus);
          setUserVote(voteStatus);
        } catch (statusError) {
          console.error("Error refreshing vote status:", statusError);
        }
      } else {
        toast.error('Failed to vote on post');
      }
      
      // Reload post and vote status to ensure UI is consistent
      console.log("Reloading post and vote status");
      await loadPostAndVoteStatus();
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!currentUser) {
      toast.info('Please log in to manage your votes');
      return;
    }

    if (!userVote.hasVoted) {
      toast.info('You have not voted on this post yet');
      return;
    }

    if (isVoting) {
      return; // Prevent multiple clicks
    }

    setIsVoting(true);
    console.log("Removing vote...");

    try {
      // Update UI optimistically
      const previousVoteType = userVote.voteType;
      setUserVote({ hasVoted: false, voteType: null });
      
      // Update counts
      if (previousVoteType === 'up') {
        setPost(prev => ({ ...prev, upvote_count: Math.max(0, prev.upvote_count - 1) }));
      } else {
        setPost(prev => ({ ...prev, downvote_count: Math.max(0, prev.downvote_count - 1) }));
      }
      
      // Send API request
      await forumService.deleteVotePost(id);
      toast.success('Vote removed successfully');
    } catch (error) {
      console.error('Error removing vote:', error);
      
      if (error.response?.status === 404) {
        toast.info('No vote found to remove');
      } else {
        toast.error('Failed to remove vote');
      }
      
      // Reload post and vote status to ensure UI is consistent
      await loadPostAndVoteStatus();
    } finally {
      setIsVoting(false);
    }
  };


  const handleVoteComment = async (commentId, voteType) => {
    if (!currentUser) {
      toast.info('Please log in to vote on comments');
      return;
    }

    // Find the comment
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    const comment = comments[commentIndex];
    
    try {
      // Check if comment already has this vote type from user
      const userVotedThisWay = comment.userVote?.hasVoted && comment.userVote.voteType === voteType;
      
      if (userVotedThisWay) {
        // Remove vote
        // Update UI optimistically
        const updatedComments = [...comments];
        updatedComments[commentIndex] = {
          ...comment,
          userVote: { hasVoted: false, voteType: null },
          upvote_count: voteType === 'up' ? Math.max(0, comment.upvote_count - 1) : comment.upvote_count,
          downvote_count: voteType === 'down' ? Math.max(0, comment.downvote_count - 1) : comment.downvote_count
        };
        setComments(updatedComments);
        
        // Send API request
        await forumService.deleteVoteComment(commentId);
        toast.success('Comment vote removed');
      } else {
        // Add or change vote
        // Calculate vote changes
        let upvoteChange = 0;
        let downvoteChange = 0;
        
        if (comment.userVote?.hasVoted) {
          // Changing vote
          if (comment.userVote.voteType === 'up') {
            upvoteChange = -1;
            downvoteChange = 1;
          } else {
            upvoteChange = 1;
            downvoteChange = -1;
          }
          
          // Remove old vote first
          try {
            await forumService.deleteVoteComment(commentId);
          } catch (err) {
            console.log("Error deleting comment vote, but will continue:", err);
            // Continue despite error - we'll still try to create the new vote
          }
        } else {
          // New vote
          if (voteType === 'up') {
            upvoteChange = 1;
          } else {
            downvoteChange = 1;
          }
        }
        
        // Update UI optimistically
        const updatedComments = [...comments];
        updatedComments[commentIndex] = {
          ...comment,
          userVote: { hasVoted: true, voteType },
          upvote_count: Math.max(0, comment.upvote_count + upvoteChange),
          downvote_count: Math.max(0, comment.downvote_count + downvoteChange)
        };
        setComments(updatedComments);
        
        // Send API request
        await forumService.voteComment(commentId, voteType);
        toast.success(`Comment ${voteType}voted`);
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      
      if (error.response?.status === 409 || 
          (error.response?.data?.message && error.response.data.message.includes("already voted"))) {
        toast.info('You have already voted on this comment');
        
        try {
          // Refresh vote status for this comment
          const voteStatus = await forumService.checkCommentVoteStatus(commentId);
          
          // Update just this comment with the new vote status
          const updatedComments = [...comments];
          updatedComments[commentIndex] = {
            ...comment,
            userVote: voteStatus
          };
          setComments(updatedComments);
        } catch (refreshError) {
          console.error('Error refreshing comment vote status:', refreshError);
        }
      } else {
        toast.error('Failed to vote on comment');
      }
      
      // Reload comments to ensure UI is consistent
      loadComments();
    }
  };

  // Updated handleRemoveCommentVote function for PostDetailPage.jsx

  const handleRemoveCommentVote = async (commentId) => {
    if (!currentUser) {
      toast.info('Please log in to manage your votes');
      return;
    }

    // Find the comment
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    const comment = comments[commentIndex];

    if (!comment.userVote?.hasVoted) {
      toast.info('You have not voted on this comment yet');
      return;
    }

    try {
      // Update UI optimistically
      const previousVoteType = comment.userVote.voteType;
      const updatedComments = [...comments];
      updatedComments[commentIndex] = {
        ...comment,
        userVote: { hasVoted: false, voteType: null },
        upvote_count: previousVoteType === 'up' ? Math.max(0, comment.upvote_count - 1) : comment.upvote_count,
        downvote_count: previousVoteType === 'down' ? Math.max(0, comment.downvote_count - 1) : comment.downvote_count
      };
      setComments(updatedComments);
      
      // Send API request
      await forumService.deleteVoteComment(commentId);
      toast.success('Comment vote removed successfully');
    } catch (error) {
      console.error('Error removing comment vote:', error);
      
      if (error.response?.status === 404) {
        toast.info('No comment vote found to remove');
      } else {
        toast.error('Failed to remove comment vote');
      }
      
      // Reload comments to ensure UI is consistent
      loadComments();
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) {
      toast.info('Please log in to delete comments');
      return;
    }

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await forumService.deleteComment(id, commentId);
        toast.success('Comment deleted');
        loadComments(); // Reload comments
      } catch (error) {
        if (error.response?.status === 403) {
          toast.warning('You can only delete your own comments');
        } else {
          toast.error('Failed to delete comment');
        }
      }
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser) {
      toast.info('Please log in to delete posts');
      return;
    }

    if (currentUser.id !== post.author) {
      toast.warning('You can only delete your own posts');
      return;
    }

    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await forumService.deletePost(id);
        toast.success('Post deleted');
        navigate('/community'); // Redirect to forum page
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  const handleEditPost = () => {
    navigate(`/community/edit/${id}`);
  };

  const formatDateDisplay = (dateString) => {
    return formatDate(dateString, userDateFormat);
  };

  const formatContent = (content) =>
    content.split('\n').map((line, i) => (
      <React.Fragment key={i}>{line}<br /></React.Fragment>
    ));

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(commentPagination.total / commentPagination.page_size)) {
      setCommentPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (isLoading) {
    return <div className="post-detail-loading">{t("editPostPageisLoading")}...</div>;
  }

  if (!post) {
    return <div className="post-detail-not-found">{t("postDetailPagePostNotFound")}</div>;
  }

  return (
    <div className="post-detail-container">
      <div className="post-detail-back">
        
        <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate('/community')}
                  className="edit-button"
                >
                  ← Back to Forum
        </Button>
      </div>

      <Card className="post-detail-card">
        <Card.Body>
          <div className="post-header">
            <div className="post-meta">
              <div className="post-author">
                Posted by{" "}
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${post.author}`);
                  }}
                  className="author-link"
                >
                  {getUserName(post.author)}
                  <Badge badge={userMap[post.author]?.badge} size="small" usertype={userMap[post.author]?.usertype} />
                </span>
              </div>
              <div className="post-timestamp">{formatDateDisplay(post.created_at)}</div>
            </div>
            {currentUser && post.author === currentUser.id && (
              <div className="post-actions-btn">
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleEditPost}
                  className="edit-button"
                >
                  {t("Edit")}
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleDeletePost}
                  className='delete-button'
                >
                  {t("Delete")}
                </Button>
              </div>
            )}
          </div>
          <h1 className="post-title">{post.title}</h1>
          <div className="post-content">{formatContent(post.content)}</div>
          <div className="post-tags">
            {post.tags && post.tags.map((tag, i) => (
              <span key={i} className="post-tag">#{tag}</span>
            ))}
          </div>
          <div className="post-actions">
            <div className="vote-buttons">
              <button 
                onClick={() => handleVote('up')} 
                className={`vote-button ${userVote.hasVoted && userVote.voteType === 'up' ? 'active-up' : ''}`}
                disabled={isVoting}
                aria-label="Upvote"
              >
                ▲ {post.upvote_count || 0}
              </button>
              <button 
                onClick={() => handleVote('down')} 
                className={`vote-button ${userVote.hasVoted && userVote.voteType === 'down' ? 'active-down' : ''}`}
                disabled={isVoting}
                aria-label="Downvote"
              >
                ▼ {post.downvote_count || 0}
              </button>
            </div>
            <div className="post-stats" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>👁️ {post.view_count} {t("Views")}</span>
              {/* Report button positioned at right of views */}
              {currentUser && post.author !== currentUser.id && (
                <div style={{ marginLeft: '16px' }}>
                  <ReportButton targetType="post" targetId={id} />
                </div>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {post.is_commentable ? (
        <div className="comments-section">
          <h2 className="comments-title">{t("Comments")}</h2>
          
          {currentUser ? (
            <Card className="comment-form">
              <Card.Body>
                <form onSubmit={handleSubmitComment}>
                  <textarea 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Write a comment..."
                    disabled={isSubmittingComment}
                    required 
                  />
                  <div className="submit-row">
                    <Button 
                      type="submit" 
                      disabled={isSubmittingComment || !newComment.trim()}
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </form>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body className="login-to-comment">
                <p>{t("Please")} <Link to="/login">{t("homePageLogin")}</Link> {t("postDetailPageToComment")}.</p>
              </Card.Body>
            </Card>
          )}

          {isLoadingComments ? (
            <div className="comments-loading">{t("loading")} {t("Comments")}...</div>
          ) : comments.length > 0 ? (
            <>
              <div className="comments-list">
                {comments.map(comment => (
                  <Card key={comment.id} className="comment-card">
                    <Card.Body>
                      <div className="comment-header">
                        <div className="comment-meta">
                          <div className="comment-author">
                            {t("postDetailPageCommentBy")}{" "}
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${comment.author}`);
                              }}
                              className="author-link"
                            >
                              {getUserName(comment.author)}
                              <Badge badge={userMap[comment.author]?.badge} size="small" usertype={userMap[comment.author]?.usertype} />
                            </span>
                          </div>
                          <div className="comment-time">
                            {formatDateDisplay(comment.created_at)}
                          </div>
                        </div>
                        {currentUser && comment.author === currentUser.id && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleDeleteComment(comment.id)}
                            className='delete-button'
                          >
                            {t("Delete")}
                          </Button>
                        )}
                        {/* Report button for comments - only if not owner */}
                        {currentUser && comment.author !== currentUser.id && (
                          <div style={{ marginLeft: '8px' }} onClick={(e) => e.stopPropagation()}>
                            <ReportButton targetType="comment" targetId={comment.id} />
                          </div>
                        )}
                      </div>
                      <p className="comment-text">{formatContent(comment.content)}</p>
                      <div className="comment-actions">
                        <div className="vote-buttons">
                          <button 
                            onClick={() => handleVoteComment(comment.id, 'up')} 
                            className={`vote-button ${comment.userVote?.hasVoted && comment.userVote?.voteType === 'up' ? 'active-up' : ''}`}
                            aria-label="Upvote"
                          >
                            ▲ {comment.upvote_count || 0}
                          </button>
                          <button 
                            onClick={() => handleVoteComment(comment.id, 'down')} 
                            className={`vote-button ${comment.userVote?.hasVoted && comment.userVote?.voteType === 'down' ? 'active-down' : ''}`}
                            aria-label="Downvote"
                          >
                            ▼ {comment.downvote_count || 0}
                          </button>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              {/* Comment Pagination */}
              {commentPagination.total > commentPagination.page_size && (
                <div className="comment-pagination">
                  <button 
                    onClick={() => handlePageChange(commentPagination.page - 1)}
                    disabled={commentPagination.page === 1}
                    className="pagination-button"
                  >
                    {t("previous")}
                  </button>
                  <span className="pagination-info">
                    Page {commentPagination.page} of {Math.ceil(commentPagination.total / commentPagination.page_size)}
                  </span>
                  <button 
                    onClick={() => handlePageChange(commentPagination.page + 1)}
                    disabled={commentPagination.page >= Math.ceil(commentPagination.total / commentPagination.page_size)}
                    className="pagination-button"
                  >
                    {t("next")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <Card.Body className="no-comments">
                {t("postDetailPageNoComments")}
              </Card.Body>
            </Card>
          )}
        </div>
      ) : (
        <Card className="comments-disabled">
          <Card.Body>
            <p>{t("postDetailPageDisabledComments")}</p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default PostDetailPage;