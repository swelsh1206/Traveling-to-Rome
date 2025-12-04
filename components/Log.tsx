import React, { useEffect, useRef } from 'react';
import type { LogEntry, LogEntryType } from '../types';

interface LogProps {
  log: LogEntry[];
}

// Get styling based on log entry type
const getLogEntryStyle = (type?: LogEntryType): { bg: string; border: string; icon: string } => {
  switch (type) {
    case 'positive':
      return {
        bg: 'bg-green-900/20',
        border: 'border-l-4 border-green-500',
        icon: '✓'
      };
    case 'negative':
      return {
        bg: 'bg-red-900/20',
        border: 'border-l-4 border-red-500',
        icon: '✗'
      };
    case 'critical':
      return {
        bg: 'bg-red-900/40',
        border: 'border-l-4 border-red-600 shadow-lg shadow-red-900/50',
        icon: '⚠'
      };
    case 'warning':
      return {
        bg: 'bg-yellow-900/20',
        border: 'border-l-4 border-yellow-500',
        icon: '⚡'
      };
    case 'info':
      return {
        bg: 'bg-blue-900/20',
        border: 'border-l-4 border-blue-500',
        icon: 'ℹ'
      };
    case 'injury':
      return {
        bg: 'bg-orange-900/20',
        border: 'border-l-4 border-orange-500',
        icon: '💔'
      };
    default:
      return {
        bg: '',
        border: '',
        icon: ''
      };
  }
};

const Log: React.FC<LogProps> = ({ log }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the log when new entries are added
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="h-full w-full bg-stone-900/50 p-4 border border-amber-600/50 overflow-y-auto rounded-lg">
      <ul className="space-y-2">
        {log.map((entry, index) => {
          const style = getLogEntryStyle(entry.type);
          const hasHighlight = !!entry.type && entry.type !== 'normal';

          return (
            <li
              key={index}
              className={`${hasHighlight ? `${style.bg} ${style.border} p-3 rounded-r-lg` : 'mb-1'} ${entry.color} animate-slide-in transition-all duration-200`}
            >
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-400 flex-shrink-0">[Day {entry.day}]</span>
                {hasHighlight && (
                  <span className="flex-shrink-0 text-lg">{style.icon}</span>
                )}
                <span className="whitespace-pre-wrap flex-grow">
                  {entry.message}
                  {entry.effectValue !== undefined && (
                    <span className={`ml-2 font-bold ${entry.effectValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.effectValue > 0 ? '+' : ''}{entry.effectValue}
                    </span>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={logEndRef} />
    </div>
  );
};

export default Log;