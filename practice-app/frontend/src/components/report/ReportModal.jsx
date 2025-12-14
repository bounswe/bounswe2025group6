// src/components/report/ReportModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import reportService from '../../services/reportService';

const REPORT_CATEGORIES = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

const ReportModal = ({ isOpen, onClose, targetType, targetId, onSubmitted }) => {
  const toast = useToast();
  const [category, setCategory] = useState('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategory('spam');
      setDescription('');
      setIsSubmitting(false);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetType || !targetId) {
      toast.error('Invalid report target');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map frontend content types to backend content types
      const contentTypeMap = {
        'comment': 'postcomment',
        'post': 'post',
        'recipe': 'recipe',
        'question': 'question',
        'answer': 'answer'
      };
      
      await reportService.createReport({
        content_type: contentTypeMap[targetType] || targetType,
        object_id: Number(targetId),
        report_type: category,
        description: description.trim(),
      });
      toast.success('Report submitted');
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (error) {
      const detail = error?.response?.data || {};
      const firstError = typeof detail === 'string' ? detail : (detail.detail || Object.values(detail)?.[0]?.[0]);
      toast.error(firstError || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="report-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="report-modal centered">
        <div className="report-modal-header">
          <h3 id="report-modal-title">Report content</h3>
        </div>
        <form onSubmit={handleSubmit} className="report-modal-form">
          <label htmlFor="report-category">Category</label>
          <select
            id="report-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {REPORT_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {category !== 'other' && (
            <>
              <label htmlFor="report-description">Description (optional)</label>
              <textarea
                id="report-description"
                placeholder="Add details to help our moderators"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </>
          )}

          <div className="report-modal-actions">
            <Button type="button" className="report-cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="report-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
      <style>{`
        .report-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.35);
          z-index: 1000;
          overflow: hidden;
          overscroll-behavior: contain;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .report-modal.centered {
          position: relative;
          transform: none;
          background: #ffffff;
          border-radius: 12px;
          width: 90%;
          max-width: 520px;
          padding: 20px 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
          border: 1px solid #e5e7eb;
        }
        .report-modal-header { margin-bottom: 12px; }
        .report-modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }
        .report-modal-form { display: flex; flex-direction: column; gap: 10px; }
        .report-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
        select, textarea {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.95rem;
          background: #fff;
        }
        textarea { resize: vertical; }
        select:focus, textarea:focus { outline: 2px solid #fca5a5; outline-offset: 2px; }
        label { font-weight: 600; font-size: 0.9rem; color: #374151; }
        /* Create Post style clone for submit */
        .report-submit-btn {
          padding: 0.75rem 1.5rem;
          background-color: #4CAF50 !important;
          color: #ffffff;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          display: inline-block;
          margin-left: 8px;
        }
        .report-submit-btn:hover {
          background-color: #68d391 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(182, 121, 121, 0.2);
        }
        /* Cancel button - red */
        .report-cancel-btn {
          padding: 0.75rem 1.2rem;
          background-color: #dc2626 !important; /* red-600 */
          color: #ffffff;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          display: inline-block;
        }
        .report-cancel-btn:hover {
          background-color: #b91c1c !important; /* red-700 */
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(220, 38, 38, 0.25);
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ReportModal;


