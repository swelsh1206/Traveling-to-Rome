import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, children, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`px-6 py-2 border-2 border-amber-400 text-amber-400 font-bold tracking-wider uppercase transition-all duration-300 rounded-lg hover-glow
                 hover:bg-amber-400 hover:text-stone-900
                 disabled:border-gray-600 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-50
                 ${className}`}
    >
      {children}
    </button>
  );
};

export default ActionButton;