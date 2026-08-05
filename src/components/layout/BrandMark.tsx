import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-10', className)}
      aria-hidden
      {...props}
    >
      <rect x="2" y="2" width="40" height="40" rx="13" fill="#064E3B" />
      <path
        d="M29.5 11.5H18.25C14.25 11.5 11 13.96 11 17C11 20.04 14.25 22.5 18.25 22.5H24.75C28.75 22.5 32 24.96 32 28C32 31.04 28.75 33.5 24.75 33.5H12.5"
        stroke="white"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <circle cx="29.5" cy="11.5" r="3.5" fill="#FBBF24" stroke="#064E3B" strokeWidth="1.5" />
    </svg>
  )
}
