// src/components/ui/Button.jsx

import React from 'react';

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  warning: 'bg-yellow-400 hover:bg-yellow-500 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-200',
};

const sizes = {
  xs: 'text-xs px-2 py-1',
  sm: 'text-sm px-3 py-1.5',
  md: 'text-base px-4 py-2',
  lg: 'text-lg px-6 py-3',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseClasses = 'rounded-md font-medium focus:outline-none focus:ring transition duration-200';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const buttonClass = [
    baseClasses,
    variants[variant],
    sizes[size],
    disabledClasses,
    className
  ].join(' ');

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClass}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;