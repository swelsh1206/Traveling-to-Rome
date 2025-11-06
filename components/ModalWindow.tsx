import React, { useEffect } from 'react';

interface ModalWindowProps {
  title: string;
  onClose: () => void | boolean;
  children: React.ReactNode;
  hideCloseButton?: boolean;
}

const ModalWindow: React.FC<ModalWindowProps> = ({ title, onClose, children, hideCloseButton = false }) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const canClose = onClose();
        if (canClose === false) return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleClose = () => {
    const canClose = onClose();
    if (canClose === false) return;
  };

  const handleBackdropClick = () => {
    const canClose = onClose();
    if (canClose === false) return;
  };

  return (
    <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
        onClick={handleBackdropClick}
    >
      <div
        className="bg-gradient-to-br from-stone-800 to-stone-900 border-4 border-amber-500 shadow-2xl w-full max-w-3xl p-6 relative animate-bounce-in rounded-xl"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <h2 className="text-3xl text-amber-300 mb-4 tracking-wider text-shadow-glow">{title}</h2>
        {!hideCloseButton && (
          <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-3xl text-amber-400 hover:text-white hover:scale-125 transition-all leading-none"
              aria-label="Close window"
          >
              &times;
          </button>
        )}
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalWindow;