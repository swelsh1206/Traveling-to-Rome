import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 300); // Small delay before showing
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const MARGIN = 16;
      const OFFSET = 8;
      const ESTIMATED_TOOLTIP_HEIGHT = 100; // Approximate height for boundary checks

      let top = 0;
      let left = 0;
      let newPosition = position;

      // Calculate position based on container and viewport
      switch (position) {
        case 'top':
          top = containerRect.top - OFFSET;
          left = containerRect.left + containerRect.width / 2;
          // Check if tooltip would go off top of screen (including estimated height)
          if (top - ESTIMATED_TOOLTIP_HEIGHT < MARGIN) newPosition = 'bottom';
          break;
        case 'bottom':
          top = containerRect.bottom + OFFSET;
          left = containerRect.left + containerRect.width / 2;
          if (top + ESTIMATED_TOOLTIP_HEIGHT > viewportHeight - MARGIN) newPosition = 'top';
          break;
        case 'left':
          top = containerRect.top + containerRect.height / 2;
          left = containerRect.left - OFFSET;
          if (left < MARGIN) newPosition = 'right';
          break;
        case 'right':
          top = containerRect.top + containerRect.height / 2;
          left = containerRect.right + OFFSET;
          if (left > viewportWidth - MARGIN) newPosition = 'left';
          break;
      }

      // Recalculate if position was adjusted
      if (newPosition !== position) {
        switch (newPosition) {
          case 'top':
            top = containerRect.top - OFFSET;
            left = containerRect.left + containerRect.width / 2;
            break;
          case 'bottom':
            top = containerRect.bottom + OFFSET;
            left = containerRect.left + containerRect.width / 2;
            break;
          case 'left':
            top = containerRect.top + containerRect.height / 2;
            left = containerRect.left - OFFSET;
            break;
          case 'right':
            top = containerRect.top + containerRect.height / 2;
            left = containerRect.right + OFFSET;
            break;
        }
      }

      // Additional safety: clamp tooltip position to viewport bounds
      const finalTop = Math.max(MARGIN, Math.min(top, viewportHeight - MARGIN));
      const finalLeft = Math.max(MARGIN, Math.min(left, viewportWidth - MARGIN));

      setAdjustedPosition(newPosition);
      setTooltipStyle({
        position: 'fixed',
        top: `${finalTop}px`,
        left: `${finalLeft}px`,
        zIndex: 9999,
      });
    }
  }, [isVisible, position]);

  const transformClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`pointer-events-none ${transformClasses[adjustedPosition]}`}
          style={{ ...tooltipStyle, minWidth: '200px', maxWidth: '300px' }}
        >
          <div className="bg-stone-900 border-2 border-amber-500/50 rounded-lg p-3 shadow-2xl">
            <p className="text-sm text-gray-200 leading-relaxed">{content}</p>
            {/* Arrow */}
            <div
              className={`absolute w-3 h-3 bg-stone-900 border-amber-500/50 transform rotate-45 ${
                adjustedPosition === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b-2 border-r-2' :
                adjustedPosition === 'bottom' ? 'top-[-7px] left-1/2 -translate-x-1/2 border-t-2 border-l-2' :
                adjustedPosition === 'left' ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t-2 border-r-2' :
                'left-[-7px] top-1/2 -translate-y-1/2 border-b-2 border-l-2'
              }`}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
