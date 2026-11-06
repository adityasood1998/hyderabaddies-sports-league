import React from 'react';
import { SportType } from '../types';

export const HouseCrestGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 640 360"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="FlatLeague Athletic Court Schematic and Championship Crest"
  >
    <rect width="640" height="360" fill="#0C1713" />
    {/* Subtle Court Grid Lines */}
    <rect x="28" y="28" width="584" height="304" stroke="#1E3A2F" strokeWidth="1.5" />
    <rect x="44" y="44" width="552" height="272" stroke="#1E3A2F" strokeWidth="1" strokeDasharray="4 4" />
    <line x1="320" y1="28" x2="320" y2="332" stroke="#2A4D3E" strokeWidth="1.5" />
    <line x1="28" y1="180" x2="612" y2="180" stroke="#1E3A2F" strokeWidth="1" />
    <circle cx="320" cy="180" r="68" stroke="#2A4D3E" strokeWidth="1.5" />
    <circle cx="320" cy="180" r="48" stroke="#D97706" strokeWidth="1" strokeDasharray="3 3" />

    {/* Left Penalty Arc */}
    <path d="M 28 110 L 110 110 L 110 250 L 28 250" stroke="#1E3A2F" strokeWidth="1.5" />
    {/* Right Penalty Arc */}
    <path d="M 612 110 L 530 110 L 530 250 L 612 250" stroke="#1E3A2F" strokeWidth="1.5" />

    {/* Crossed Table Tennis Paddles & Championship Cup Emblem */}
    <g transform="translate(320, 174)">
      {/* Shield Backdrop */}
      <path
        d="M -52 -64 L 52 -64 L 52 8 C 52 46 0 70 0 70 C 0 70 -52 46 -52 8 Z"
        fill="#11221C"
        stroke="#F59E0B"
        strokeWidth="2"
      />
      <path
        d="M -44 -56 L 44 -56 L 44 6 C 44 38 0 60 0 60 C 0 60 -44 38 -44 6 Z"
        stroke="#2A4D3E"
        strokeWidth="1"
      />
      {/* Trophy Cup Silhouette */}
      <path
        d="M -20 -36 L 20 -36 L 16 -4 C 14 10 6 16 0 16 C -6 16 -14 10 -16 -4 Z"
        fill="#F59E0B"
      />
      <path
        d="M -20 -30 L -30 -30 L -28 -14 C -27 -8 -22 -6 -16 -6"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 20 -30 L 30 -30 L 28 -14 C 27 -8 22 -6 16 -6"
        stroke="#F59E0B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="-4" y="16" width="8" height="14" fill="#D97706" />
      <rect x="-18" y="30" width="36" height="7" rx="2" fill="#F59E0B" />
    </g>

    {/* Corner Court Telemetry Coordinates */}
    <text x="44" y="58" fill="#6EE7B7" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1.5">
      COURT 01 · DINING TABLE &amp; LOUNGE PITCH
    </text>
    <text x="458" y="318" fill="#F59E0B" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="1.5">
      ELO K-FACTOR: 28 / 40
    </text>
  </svg>
);

export const SportCourtBadge: React.FC<{ sport: SportType; className?: string }> = ({
  sport,
  className = 'w-9 h-9',
}) => {
  switch (sport) {
    case 'table_tennis':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#0F2922" />
          <circle cx="18" cy="17" r="9" fill="#E11D48" />
          <rect x="22" y="22" width="4" height="10" rx="1.5" transform="rotate(-45 22 22)" fill="#FBBF24" />
          <circle cx="29" cy="12" r="3.5" fill="#F8FAFC" />
        </svg>
      );
    case 'foosball':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#0F2922" />
          <line x1="6" y1="20" x2="34" y2="20" stroke="#94A3B8" strokeWidth="2.5" />
          <rect x="12" y="13" width="5" height="14" rx="2" fill="#F59E0B" />
          <rect x="23" y="13" width="5" height="14" rx="2" fill="#38BDF8" />
        </svg>
      );
    case 'darts':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#0F2922" />
          <circle cx="20" cy="20" r="12" stroke="#10B981" strokeWidth="2" />
          <circle cx="20" cy="20" r="7" stroke="#F43F5E" strokeWidth="2" />
          <circle cx="20" cy="20" r="2.5" fill="#F59E0B" />
        </svg>
      );
    case 'pool':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#0F2922" />
          <circle cx="20" cy="20" r="11" fill="#1E293B" stroke="#F8FAFC" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="5" fill="#F8FAFC" />
          <text x="17.5" y="23" fill="#0F172A" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono, monospace">
            8
          </text>
        </svg>
      );
    case 'video_game':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#0F2922" />
          <rect x="8" y="13" width="24" height="14" rx="5" stroke="#38BDF8" strokeWidth="2" />
          <path d="M14 17V23M11 20H17" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="18" r="1.5" fill="#F43F5E" />
          <circle cx="28" cy="21" r="1.5" fill="#FBBF24" />
        </svg>
      );
    case 'board_game':
    default:
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect width="40" height="40" rx="8" fill="#0F2922" />
          <polygon
            points="20,9 29,14.5 29,25.5 20,31 11,25.5 11,14.5"
            stroke="#F59E0B"
            strokeWidth="2"
            fill="#1E3A2F"
          />
          <circle cx="20" cy="20" r="3" fill="#F8FAFC" />
        </svg>
      );
  }
};
