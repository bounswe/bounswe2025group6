// src/components/ui/Card.jsx

import React from 'react';

const Card = ({ children, className = '', ...props }) => {
  const baseClass = 'bg-white rounded-xl shadow-lg overflow-hidden';
  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '', ...props }) => {
  const baseClass = 'px-6 py-5 border-b border-gray-200 bg-gray-50';
  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Body = ({ children, className = '', ...props }) => {
  const baseClass = 'px-6 py-6';
  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Footer = ({ children, className = '', ...props }) => {
  const baseClass = 'px-6 py-4 border-t border-gray-200 bg-gray-50';
  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;