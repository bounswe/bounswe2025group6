// src/pages/activity-stream/ActivityStreamPage.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import activityStreamService from "../../services/activityStreamService";
import { formatDate } from "../../utils/dateFormatter";
import "../../styles/ActivityStreamPage.css";

const ActivityStreamPage = () => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [activityType, setActivityType] = useState("");

  const activityTypes = [
    { value: "", label: "All Activities" },
    { value: "recipe", label: "Recipes" },
    { value: "post", label: "Forum Posts" },
    { value: "comment", label: "Comments" },
    { value: "question", label: "Questions" },
    { value: "answer", label: "Answers" },
  ];

  useEffect(() => {
    document.title = "Activity Stream - FitHub";
    loadActivities();
  }, [page, pageSize, activityType]);

  const loadActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize };
      if (activityType) {
        params.activity_type = activityType;
      }
      const response = await activityStreamService.getActivities(params);
      setActivities(response.results || []);
      setTotal(response.total || 0);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError(err.response?.data?.detail || "Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1); // Reset to first page when changing page size
  };

  const handleActivityTypeChange = (e) => {
    setActivityType(e.target.value);
    setPage(1); // Reset to first page when changing filter
  };

  const getActivityIcon = (type) => {
    const icons = {
      recipe: "🍽️",
      post: "📝",
      comment: "💬",
      question: "❓",
      answer: "💡",
    };
    return icons[type] || "📌";
  };

  const getActivityLink = (activity) => {
    switch (activity.activity_type) {
      case "recipe":
        return `/recipes/${activity.target_id}`;
      case "post":
        return `/community/post/${activity.target_id}`;
      case "comment":
        return `/community/post/${
          activity.metadata?.post_id || activity.target_id
        }`;
      case "question":
        return `/community/post/${activity.target_id}`;
      case "answer":
        return `/community/post/${
          activity.metadata?.question_id || activity.target_id
        }`;
      default:
        return "#";
    }
  };

  const formatActivityContent = (activity) => {
    if (activity.content && activity.content.length > 200) {
      return activity.content.substring(0, 200) + "...";
    }
    return activity.content || "";
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="activity-stream-page">
      <div className="activity-stream-header">
        <h1>Activity Stream</h1>
        <p>See what people you follow are up to</p>
      </div>

      {/* Filters */}
      <div className="activity-stream-filters">
        <div className="filter-group">
          <label htmlFor="activity-type-filter">Filter by type:</label>
          <select
            id="activity-type-filter"
            value={activityType}
            onChange={handleActivityTypeChange}
            className="activity-filter-select"
          >
            {activityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="page-size-select">Items per page:</label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="activity-filter-select"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="error-card">
          <Card.Body>
            <p className="error-message">{error}</p>
            <Button onClick={loadActivities}>Retry</Button>
          </Card.Body>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container">
          <p>Loading activities...</p>
        </div>
      )}

      {/* Activities List */}
      {!isLoading && !error && (
        <>
          {activities.length === 0 ? (
            <Card>
              <Card.Body className="empty-state">
                <h2>No activities found</h2>
                <p>
                  {activityType
                    ? `No ${activityTypes
                        .find((t) => t.value === activityType)
                        ?.label.toLowerCase()} found.`
                    : "You are not following anyone yet, or there are no activities to show."}
                </p>
              </Card.Body>
            </Card>
          ) : (
            <>
              <div className="activities-list">
                {activities.map((activity) => (
                  <Card
                    key={`${activity.activity_type}-${activity.activity_id}`}
                    className="activity-card"
                  >
                    <Card.Body>
                      <div className="activity-header">
                        <div className="activity-icon">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="activity-user-info">
                          {activity.user_profile_photo ? (
                            <img
                              src={activity.user_profile_photo}
                              alt={activity.user_username}
                              className="activity-user-avatar"
                            />
                          ) : (
                            <div className="activity-user-avatar-placeholder">
                              {activity.user_username?.[0]?.toUpperCase() ||
                                "U"}
                            </div>
                          )}
                          <div className="activity-user-details">
                            <Link
                              to={`/profile/${activity.user_id}`}
                              className="activity-username"
                            >
                              {activity.user_username}
                            </Link>
                            <span className="activity-type-badge">
                              {activity.activity_type}
                            </span>
                          </div>
                        </div>
                        <div className="activity-timestamp">
                          {formatDate(activity.timestamp, "DD/MM/YYYY", t)}
                        </div>
                      </div>
                      <div className="activity-content">
                        <Link
                          to={getActivityLink(activity)}
                          className="activity-title-link"
                        >
                          <h3 className="activity-title">{activity.title}</h3>
                        </Link>
                        {activity.content && (
                          <p className="activity-text">
                            {formatActivityContent(activity)}
                          </p>
                        )}
                        {activity.metadata && (
                          <div className="activity-metadata">
                            {activity.metadata.tags && (
                              <div className="activity-tags">
                                {activity.metadata.tags.map((tag, idx) => (
                                  <span key={idx} className="activity-tag">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {activity.metadata.upvote_count !== undefined && (
                              <span className="activity-meta-item">
                                👍 {activity.metadata.upvote_count}
                              </span>
                            )}
                            {activity.metadata.downvote_count !== undefined && (
                              <span className="activity-meta-item">
                                👎 {activity.metadata.downvote_count}
                              </span>
                            )}
                            {activity.metadata.prep_time && (
                              <span className="activity-meta-item">
                                ⏱️ Prep: {activity.metadata.prep_time}min
                              </span>
                            )}
                            {activity.metadata.cook_time && (
                              <span className="activity-meta-item">
                                🔥 Cook: {activity.metadata.cook_time}min
                              </span>
                            )}
                            {activity.metadata.meal_type && (
                              <span className="activity-meta-item">
                                🍽️ {activity.metadata.meal_type}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="activity-pagination">
                  <Button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="pagination-button"
                  >
                    Previous
                  </Button>
                  <span className="pagination-info">
                    Page {page} of {totalPages} ({total} total)
                  </span>
                  <Button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="pagination-button"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityStreamPage;
