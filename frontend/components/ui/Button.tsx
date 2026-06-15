import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
}

export function Button({ 
  children, 
  loading, 
  disabled, 
  variant = 'primary', 
  className = '', 
  ...props 
}: ButtonProps) {
  let variantClasses = '';
  
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-primary hover:bg-blue-700 text-on-primary';
      break;
    case 'secondary':
      variantClasses = 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface';
      break;
    case 'outline':
      variantClasses = 'border border-outline-variant hover:bg-surface-container text-on-surface';
      break;
    case 'danger':
      variantClasses = 'bg-error text-on-error hover:bg-red-700';
      break;
    case 'ghost':
      variantClasses = 'hover:bg-surface-container text-on-surface';
      break;
    default:
      variantClasses = 'bg-primary hover:bg-blue-700 text-on-primary';
  }

  return (
    <button
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg text-label-md font-bold shadow-sm transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-400 disabled:text-gray-200 disabled:border-transparent disabled:cursor-not-allowed disabled:scale-100 ${variantClasses} ${className}`}
      {...props}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin text-[16px] shrink-0">progress_activity</span>
      )}
      <span>{children}</span>
    </button>
  );
}
export default Button;
