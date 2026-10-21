import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1.2em"
      height="1.2em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  )
}

export const ArrowRight = () => (
  <Icon>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)
export const ArrowLeft = () => (
  <Icon>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Icon>
)
export const Restart = () => (
  <Icon>
    <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" />
  </Icon>
)
export const Shuffle = () => (
  <Icon>
    <path d="M3 7h3c4.5 0 6.5 10 11 10h4M18 14l3 3-3 3" />
    <path d="M3 17h3c1.7 0 3-1.4 4.2-3.3M13.8 10.3C15 8.4 16.3 7 18 7h3M18 4l3 3-3 3" />
  </Icon>
)
export const Home = () => (
  <Icon>
    <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />
  </Icon>
)
export const Play = () => (
  <Icon fill="currentColor" stroke="none">
    <path d="M7 4.5v15l13-7.5z" />
  </Icon>
)
export const Pause = () => (
  <Icon fill="currentColor" stroke="none">
    <rect x="5" y="4" width="5" height="16" rx="1.5" />
    <rect x="14" y="4" width="5" height="16" rx="1.5" />
  </Icon>
)
export const Gear = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
  </Icon>
)
export const Users = () => (
  <Icon>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
  </Icon>
)
export const User = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
)
export const Check = () => (
  <Icon strokeWidth={3.5}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
)
export const Close = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)
export const Plus = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
