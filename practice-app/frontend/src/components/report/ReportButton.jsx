// src/components/report/ReportButton.jsx
import React, { useState } from 'react';
import ReportModal from './ReportModal';
import './ReportButton.css';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

const ReportButton = ({ targetType, targetId }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (!currentUser) {
      toast.info('Please log in to report content');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className="report-icon-btn"
        onClick={handleOpen}
        aria-label="Report content"
        title="Report"
      >
        {/* White waving flag icon */}
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
          <path d="M12 6v52" stroke="white" strokeWidth="6" strokeLinecap="round"/>
          <path d="M14 10c10-4 18 6 28 2s10 6 18 2v22c-8 4-8-4-18 0s-18-6-28-2V10z" fill="white"/>
        </svg>
      </button>
      <ReportModal
        isOpen={open}
        onClose={() => setOpen(false)}
        targetType={targetType}
        targetId={targetId}
        onSubmitted={() => setOpen(false)}
      />
      
    </>
  );
};

export default ReportButton;


