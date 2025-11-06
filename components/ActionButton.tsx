import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?: 'amber' | 'sky' | 'purple';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled, children, className = '', variant = 'amber' }) => {
  const getColorClasses = () => {
    switch(variant) {
      case 'sky':
        return 'border-sky-400 text-sky-400 hover:bg-sky-400 focus:ring-sky-400';
      case 'purple':
        return 'border-purple-400 text-purple-400 hover:bg-purple-400 focus:ring-purple-400';
      default:
        return 'border-amber-400 text-amber-400 hover:bg-amber-400 focus:ring-amber-400';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`px-6 py-2 border-2 font-bold tracking-wider uppercase transition-all duration-300 rounded-lg hover-glow hover-lift
                 hover:text-stone-900 hover:scale-105
                 disabled:border-gray-600 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed disabled:scale-100
                 focus:outline-none focus:ring-2 focus:ring-opacity-50
                 shadow-lg
                 ${getColorClasses()} ${className}`}
    >
      {children}
    </button>
  );
};

export default ActionButton;