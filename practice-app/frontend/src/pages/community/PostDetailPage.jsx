// src/pages/community/PostDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import '../../styles/PostDetailPage.css';

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true);
      try {
        setTimeout(() => {
          const mockPost = {
            id: parseInt(id),
            userId: 102,
            username: "VeganChef",
            title: "Creative Ways to Use Stale Bread?",
            content: "...",
            timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
            likes: 23,
            comments: 14,
            tags: ["NoWaste", "Sustainability", "Tips"],
            userAvatar: "https://via.placeholder.com/40"
          };

          const mockComments = [/* ... */];

          setPost(mockPost);
          setComments(mockComments);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error loading post:', error);
        toast.error('Failed to load post');
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [id, toast]);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!currentUser) return toast.info('Please log in to comment');
    if (!newComment.trim()) return toast.warning('Comment cannot be empty');

    const newCommentObj = { /* ... */ };
    setComments(prev => [...prev, newCommentObj]);
    setPost(prev => ({ ...prev, comments: prev.comments + 1 }));
    setNewComment('');
    toast.success('Comment added');
  };

  const handleLikePost = () => {
    if (!currentUser) return toast.info('Please log in to like posts');
    setPost(prev => ({ ...prev, likes: prev.likes + 1 }));
    toast.success('Post liked!');
  };

  const handleLikeComment = (commentId) => {
    if (!currentUser) return toast.info('Please log in to like comments');
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
    toast.success('Comment liked!');
  };

  const goToUserProfile = (userId, username) => {
    navigate(`/community/profile/${userId}`, { state: { username } });
  };

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
    content.split('\n').map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>);

  if (isLoading) return <div className="post-detail-loading">Loading post...</div>;
  if (!post) return <div className="post-detail-not-found">Post not found</div>;

  return (
    <div className="post-detail-container">
      <div className="post-detail-back">
        <Button variant="ghost" size="sm" onClick={() => navigate('/community')} className="back-button">
          ← Back to Community
        </Button>
      </div>

      <Card className="post-detail-card">
        <Card.Body>
          <div className="post-header">
            <div className="post-avatar" onClick={() => goToUserProfile(post.userId, post.username)}>
              <img src={post.userAvatar} alt={post.username} />
            </div>
            <div className="post-user">
              <div className="username" onClick={() => goToUserProfile(post.userId, post.username)}>{post.username}</div>
              <div className="timestamp">{formatDate(post.timestamp)}</div>
            </div>
          </div>
          <h1 className="post-title">{post.title}</h1>
          <div className="post-content">{formatContent(post.content)}</div>
          <div className="post-tags">
            {post.tags.map((tag, i) => <span key={i} className="post-tag">#{tag}</span>)}
          </div>
          <div className="post-actions">
            <button onClick={handleLikePost} className="like-btn">❤️ {post.likes} Likes</button>
            <button className="comment-btn">💬 {post.comments} Comments</button>
          </div>
        </Card.Body>
      </Card>

      <div className="comments-section">
        <h2 className="comments-title">Comments ({comments.length})</h2>
        <Card className="comment-form">
          <Card.Body>
            <form onSubmit={handleSubmitComment}>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} required />
              <div className="submit-row">
                <Button type="submit" size="sm" disabled={!newComment.trim()}>Post Comment</Button>
              </div>
            </form>
          </Card.Body>
        </Card>

        {comments.length > 0 ? (
          comments.map(comment => (
            <Card key={comment.id} className="comment-card">
              <Card.Body>
                <div className="comment-header">
                  <div className="comment-avatar" onClick={() => goToUserProfile(comment.userId, comment.username)}>
                    <img src={comment.userAvatar} alt={comment.username} />
                  </div>
                  <div className="comment-meta">
                    <div className="comment-user" onClick={() => goToUserProfile(comment.userId, comment.username)}>{comment.username}</div>
                    <div className="comment-time">{formatDate(comment.timestamp)}</div>
                  </div>
                </div>
                <p className="comment-text">{comment.content}</p>
                <button onClick={() => handleLikeComment(comment.id)} className="like-comment-btn">👍 {comment.likes}</button>
              </Card.Body>
            </Card>
          ))
        ) : (
          <Card><Card.Body className="no-comments">No comments yet. Be the first to comment!</Card.Body></Card>
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;