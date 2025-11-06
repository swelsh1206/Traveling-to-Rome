import React, { useEffect } from 'react';

interface ModalWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalWindow: React.FC<ModalWindowProps> = ({ title, onClose, children }) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-stone-800 border-4 border-amber-500 shadow-lg w-full max-w-lg p-6 relative animate-fade-in rounded-xl"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <h2 className="text-3xl text-amber-300 mb-4 tracking-wider capitalize">{title}</h2>
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-3xl text-amber-400 hover:text-white transition-colors leading-none"
            aria-label="Close window"
        >
            &times;
        </button>
        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalWindow;