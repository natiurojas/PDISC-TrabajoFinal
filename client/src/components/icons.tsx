import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
  </Base>
);

export const PauseIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
  </Base>
);

export const SearchIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
);

export const MenuIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const CloseIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m14.5 5-7 7 7 7" />
  </Base>
);

export const ChevronRightIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m9.5 5 7 7-7 7" />
  </Base>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m5 9.5 7 7 7-7" />
  </Base>
);

export const StarIcon = (props: IconProps) => (
  <Base {...props}>
    <path
      d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.9-5.2 2.9 1-5.9L3.5 9.7l5.9-.8z"
      fill="currentColor"
      stroke="none"
    />
  </Base>
);

export const PlusIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const PencilIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" />
    <path d="M14.5 5.5l4 4" />
  </Base>
);

export const TrashIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Base>
);

export const UsersIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    <path d="M16 6.2a3 3 0 0 1 0 5.6M18 19.5c0-2.2-.8-3.9-2-4.9" />
  </Base>
);

export const FilmIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M8 4.5v15M16 4.5v15M3 12h18" />
  </Base>
);

export const DashboardIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Base>
);

export const LogoutIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M15 4.5h3.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H15" />
    <path d="M10 8l-4 4 4 4M6 12h8" />
  </Base>
);

export const ShieldIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5l7 2.5v5c0 4.2-2.9 7.8-7 9.5-4.1-1.7-7-5.3-7-9.5v-5z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);

export const CheckIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
);

export const AlertIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v4.5M12 16h.01" />
  </Base>
);

export const ClockIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const CalendarIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
  </Base>
);

export const TrendingIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 16.5l5-5 3.5 3.5L20 8" />
    <path d="M15 8h5v5" />
  </Base>
);

export const TagIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M11.5 3.5H6A1.5 1.5 0 0 0 4.5 5v5.5L13 19a2 2 0 0 0 2.8 0l3.7-3.7a2 2 0 0 0 0-2.8z" />
    <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
  </Base>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);

export const LockIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </Base>
);

export const MailIcon = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
  </Base>
);

export const UserIcon = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 19.5c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
  </Base>
);

export const VolumeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
    <path d="M15.5 9a4.5 4.5 0 0 1 0 6" />
  </Base>
);

export const MuteIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
    <path d="m15.5 9.5 4 5M19.5 9.5l-4 5" />
  </Base>
);

export const ExpandIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M4.5 9.5V4.5h5M19.5 14.5v5h-5M19.5 9.5v-5h-5M4.5 14.5v5h5" />
  </Base>
);

export const SpinnerIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />
  </Base>
);

export const EyeIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
);

export const RefreshIcon = (props: IconProps) => (
  <Base {...props}>
    <path d="M20 12a8 8 0 1 1-2.5-5.8" />
    <path d="M20 4.5V10h-5.5" />
  </Base>
);