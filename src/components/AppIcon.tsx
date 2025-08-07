import React from 'react'

interface AppIconProps {
  size?: number
  className?: string
  variant?: 'default' | 'gradient' | 'solid'
}

export default function AppIcon({ 
  size = 256, 
  className = '',
  variant = 'gradient'
}: AppIconProps) {
  const id = `icon-gradient-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      )}
      
      {/* Background Circle */}
      <rect 
        width="256" 
        height="256" 
        rx="60" 
        fill={variant === 'gradient' ? `url(#${id})` : variant === 'solid' ? '#10B981' : '#f3f4f6'}
      />
      
      {/* Transaction Symbol - Modern Design */}
      <g transform="translate(128, 128)">
        {/* Central Circle */}
        <circle 
          cx="0" 
          cy="0" 
          r="8" 
          fill="white"
        />
        
        {/* Left Arrow (Money In) */}
        <path
          d="M -70 -20 L -30 -20 L -30 -35 L 0 0 L -30 35 L -30 20 L -70 20 L -70 -20 Z"
          fill="white"
          opacity="0.95"
        />
        
        {/* Right Arrow (Money Out) */}
        <path
          d="M 70 -20 L 30 -20 L 30 -35 L 0 0 L 30 35 L 30 20 L 70 20 L 70 -20 Z"
          fill="white"
          opacity="0.85"
          transform="rotate(180 0 0)"
        />
        
        {/* Bottom Bar Chart */}
        <g transform="translate(-40, 45)">
          <rect x="0" y="15" width="16" height="25" fill="white" opacity="0.7" rx="2" />
          <rect x="24" y="5" width="16" height="35" fill="white" opacity="0.8" rx="2" />
          <rect x="48" y="10" width="16" height="30" fill="white" opacity="0.75" rx="2" />
          <rect x="72" y="0" width="16" height="40" fill="white" opacity="0.85" rx="2" />
        </g>
      </g>
    </svg>
  )
}

// Export a static version for generating files
export function AppIconStatic() {
  return `<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="60" fill="url(#gradient)" />
  <g transform="translate(128, 128)">
    <circle cx="0" cy="0" r="8" fill="white" />
    <path d="M -70 -20 L -30 -20 L -30 -35 L 0 0 L -30 35 L -30 20 L -70 20 L -70 -20 Z" fill="white" opacity="0.95" />
    <path d="M 70 -20 L 30 -20 L 30 -35 L 0 0 L 30 35 L 30 20 L 70 20 L 70 -20 Z" fill="white" opacity="0.85" transform="rotate(180 0 0)" />
    <g transform="translate(-40, 45)">
      <rect x="0" y="15" width="16" height="25" fill="white" opacity="0.7" rx="2" />
      <rect x="24" y="5" width="16" height="35" fill="white" opacity="0.8" rx="2" />
      <rect x="48" y="10" width="16" height="30" fill="white" opacity="0.75" rx="2" />
      <rect x="72" y="0" width="16" height="40" fill="white" opacity="0.85" rx="2" />
    </g>
  </g>
</svg>`
}