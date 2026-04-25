import React from 'react';

export default function Logo({ className = "h-12 w-auto", showText = true }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Icon Group */}
      <div className="relative flex items-center justify-center h-[1em] w-[1em] text-cyan-500 drop-shadow-md shrink-0">
        <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
          <defs>
            <mask id="lens-mask">
              <rect width="100" height="100" fill="white" />
              <circle cx="50" cy="60" r="22" fill="black" />
              <circle cx="50" cy="60" r="14" fill="none" stroke="white" strokeWidth="6" />
            </mask>
          </defs>
          <g mask="url(#lens-mask)" fill="currentColor">
            <path d="M 32 35 L 36 22 C 37 18 39 16 43 16 L 57 16 C 61 16 63 18 64 22 L 68 35 Z" />
            <rect x="8" y="32" width="84" height="56" rx="12" />
          </g>
        </svg>
      </div>

      {/* Optional Text */}
      {showText && (
        <div className="flex flex-col items-center" style={{ marginTop: '0.2em' }}>
          <div className="flex items-center gap-[0.1em] text-[0.6em] font-bold tracking-wide leading-none">
            <span className="text-white">Attend</span>
            <span className="text-cyan-400">AI</span>
          </div>
          <p className="text-[0.18em] font-medium tracking-widest text-slate-400 uppercase leading-none" style={{ marginTop: '0.4em' }}>
            Face Recognition Attendance
          </p>
          <div className="h-[0.04em] w-1/3 bg-cyan-600 rounded-full" style={{ marginTop: '0.3em' }} />
        </div>
      )}
    </div>
  );
}
