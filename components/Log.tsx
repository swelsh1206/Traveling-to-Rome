import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';

interface LogProps {
  log: LogEntry[];
}

const Log: React.FC<LogProps> = ({ log }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the log when new entries are added
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div className="h-full w-full bg-stone-900/50 p-4 border border-amber-600/50 overflow-y-auto rounded-lg">
      <ul>
        {log.map((entry, index) => (
          <li key={index} className={`mb-2 last:mb-0 ${entry.color}`}>
            <span className="font-bold mr-2">[Day {entry.day}]</span>
            <span>{entry.message}</span>
          </li>
        ))}
      </ul>
      <div ref={logEndRef} />
    </div>
  );
};

export default Log;