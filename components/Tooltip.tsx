import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
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
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const tooltipRect = tooltip.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Safe zone margins
      const MARGIN = 16;
      const SAFE_LEFT = MARGIN;
      const SAFE_RIGHT = viewportWidth - MARGIN;
      const SAFE_TOP = MARGIN;
      const SAFE_BOTTOM = viewportHeight - MARGIN;

      let newPosition = position;
      let adjustStyle = false;

      // Check if tooltip goes off screen and adjust position
      if (position === 'right' && tooltipRect.right > SAFE_RIGHT) {
        newPosition = 'left';
      } else if (position === 'left' && tooltipRect.left < SAFE_LEFT) {
        newPosition = 'right';
      } else if (position === 'top' && tooltipRect.top < SAFE_TOP) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && tooltipRect.bottom > SAFE_BOTTOM) {
        newPosition = 'top';
      }

      // After position adjustment, check if still overflowing and apply inline styles
      const newTooltipRect = tooltip.getBoundingClientRect();

      // Horizontal overflow check
      if (newTooltipRect.right > SAFE_RIGHT) {
        tooltip.style.left = `${SAFE_RIGHT - containerRect.left - tooltipRect.width}px`;
        tooltip.style.transform = 'none';
        adjustStyle = true;
      } else if (newTooltipRect.left < SAFE_LEFT) {
        tooltip.style.left = `${SAFE_LEFT - containerRect.left}px`;
        tooltip.style.transform = 'none';
        adjustStyle = true;
      }

      // Vertical overflow check for horizontal tooltips
      if ((newPosition === 'left' || newPosition === 'right')) {
        if (newTooltipRect.bottom > SAFE_BOTTOM) {
          tooltip.style.top = `${SAFE_BOTTOM - containerRect.top - tooltipRect.height}px`;
          tooltip.style.transform = 'none';
          adjustStyle = true;
        } else if (newTooltipRect.top < SAFE_TOP) {
          tooltip.style.top = `${SAFE_TOP - containerRect.top}px`;
          tooltip.style.transform = 'none';
          adjustStyle = true;
        }
      }

      // Reset styles if not adjusting
      if (!adjustStyle && (tooltip.style.left || tooltip.style.top)) {
        tooltip.style.left = '';
        tooltip.style.top = '';
      }

      setAdjustedPosition(newPosition);
    }
  }, [isVisible, position]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[adjustedPosition]} pointer-events-none`}
          style={{ minWidth: '200px', maxWidth: '300px' }}
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
        </div>
      )}
    </div>
  );
};

export default Tooltip;
