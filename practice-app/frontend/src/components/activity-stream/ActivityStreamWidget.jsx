// src/components/activity-stream/ActivityStreamWidget.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Card from "../ui/Card";
import activityStreamService from "../../services/activityStreamService";
import { formatDate } from "../../utils/dateFormatter";
import "../../styles/ActivityStreamWidget.css";

const ActivityStreamWidget = () => {
  const { t } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await activityStreamService.getActivities({
        page: 1,
        page_size: 10,
      });
      setActivities(response.results?.slice(0, 10) || []);
    } catch (err) {
      console.error("Error loading activities:", err);
      setError("Failed to load activities");
    } finally {
      setIsLoading(false);
    }
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
    if (activity.content && activity.content.length > 100) {
      return activity.content.substring(0, 100) + "...";
    }
    return activity.content || "";
  };

  return (
    <Card className="activity-stream-widget">
      <Card.Body>
        <div className="widget-header">
          <h2 className="widget-title">Recent Activity</h2>
          <Link to="/activity-stream" className="widget-view-all">
            View All
          </Link>
        </div>

        {isLoading && (
          <div className="widget-loading">
            <p>Loading activities...</p>
          </div>
        )}

        {error && (
          <div className="widget-error">
            <p>{error}</p>
            <button onClick={loadActivities} className="widget-retry-button">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {activities.length === 0 ? (
              <div className="widget-empty">
                <p>No recent activities to show.</p>
                <p className="widget-empty-subtitle">
                  Start following users to see their activities here!
                </p>
              </div>
            ) : (
              <div className="widget-activities">
                {activities.map((activity) => (
                  <Link
                    key={`${activity.activity_type}-${activity.activity_id}`}
                    to={getActivityLink(activity)}
                    className="widget-activity-item"
                  >
                    <div className="widget-activity-icon">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="widget-activity-content">
                      <div className="widget-activity-header">
                        <span className="widget-activity-username">
                          {activity.user_username}
                        </span>
                        <span className="widget-activity-type">
                          {activity.activity_type}
                        </span>
                      </div>
                      <div className="widget-activity-title">
                        {activity.title}
                      </div>
                      {activity.content && (
                        <div className="widget-activity-text">
                          {formatActivityContent(activity)}
                        </div>
                      )}
                      <div className="widget-activity-time">
                        {formatDate(activity.timestamp, "DD/MM/YYYY", t)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default ActivityStreamWidget;
