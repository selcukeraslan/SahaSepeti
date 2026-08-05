import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface SportMarkProps extends SVGProps<SVGSVGElement> {
  slug: string
}

function SportSymbol({ slug }: { slug: string }) {
  if (slug === 'hali-saha') {
    return (
      <image href="/icons/soccer-ball.svg" x="8" y="8" width="48" height="48" />
    )
  }

  if (slug === 'basketbol') {
    return (
      <>
        <defs>
          <linearGradient id="basketball-fill" x1="15" y1="12" x2="49" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF7A00" />
            <stop offset="1" stopColor="#B84D08" />
          </linearGradient>
          <clipPath id="basketball-clip">
            <circle cx="32" cy="32" r="24" />
          </clipPath>
        </defs>
        <circle cx="32" cy="32" r="24" fill="url(#basketball-fill)" stroke="#050505" strokeWidth="2.5" />
        <g clipPath="url(#basketball-clip)" fill="none" stroke="#050505" strokeWidth="3.2" strokeLinecap="round">
          <path d="M8 27C19 43 32 22 55 21" />
          <path d="M7 37c15 9 34 9 50-1" />
          <path d="M27 6C15 22 17 47 29 59" />
          <path d="M12 53c10-16 27 13 44-3" />
        </g>
      </>
    )
  }

  if (slug === 'badminton') {
    return (
      <g transform="translate(32 32) scale(1.24) translate(-32 -32)">
        <ellipse
          cx="27"
          cy="25"
          rx="10.5"
          ry="14"
          transform="rotate(-38 27 25)"
          stroke="#047857"
          strokeWidth="3"
        />
        <path
          d="m18.5 20 16 12M20.5 15.5l18 13.5M17 25l13 10M30.5 13 19 29M36 17 23.5 33.5"
          stroke="#047857"
          strokeOpacity=".55"
          strokeWidth="1.2"
        />
        <path d="m35.5 35 8.5 8.5" stroke="#047857" strokeWidth="4" strokeLinecap="round" />
        <path d="m43.5 43 4 4" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
        <circle cx="44.5" cy="16.5" r="3.5" fill="#FBBF24" />
      </g>
    )
  }

  if (slug === 'tenis' || slug === 'padel') {
    return (
      <>
        <circle cx="32" cy="32" r="24" fill="#FBBF24" stroke="#047857" strokeWidth="2.5" />
        <path d="M15 15c12.8 8.8 12.8 25.2 0 34M49 15c-12.8 8.8-12.8 25.2 0 34" stroke="white" strokeWidth="3" fill="none" />
      </>
    )
  }

  if (slug === 'voleybol') {
    return (
      <image href="/icons/volleyball.svg" x="4" y="4" width="56" height="56" />
    )
  }

  return (
    <g transform="translate(32 32) scale(1.2) translate(-32 -32)">
      <path d="M21 19h17c4 0 7 2.5 7 6s-3 6-7 6H27c-4 0-7 2.5-7 6s3 6 7 6h16" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
      <circle cx="21" cy="19" r="4" fill="#FBBF24" />
    </g>
  )
}

export function SportMark({ slug, className, ...props }: SportMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-14', className)}
      aria-hidden
      {...props}
    >
      <SportSymbol slug={slug} />
    </svg>
  )
}
