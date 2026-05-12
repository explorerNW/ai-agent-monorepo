import React from "react";
import { Link, useLocation } from "react-router-dom";

export function BottomNavigation() {
  const location = useLocation();

  return (
    <div className="relative w-full h-[83px] bg-gradient-to-br from-[#3A4450] to-[#282F39] flex-shrink-0">
      {/* Top separator line */}
      <div className="absolute top-0 left-0 right-0 h-[0.5px] bg-white opacity-15" />

      {/* Navigation items container */}
      <div className="flex items-start justify-between px-0 pt-0 h-[49px]">
        {/* Feed */}
        <Link to="/">
          <NavItem
            icon={<FeedIcon />}
            label="Feed"
            isActive={location.pathname === "/"}
          />
        </Link>

        {/* Explore - Inactive */}
        <NavItem icon={<ExploreIcon />} label="Explore" isActive={false} />

        {/* Analytics */}
        <Link to="/analytics">
          <NavItem
            icon={<AnalyticsIcon />}
            label="Analytics"
            isActive={location.pathname === "/analytics"}
          />
        </Link>

        {/* Inbox - Active */}
        <NavItem icon={<InboxIcon />} label="Inbox" isActive={false} />

        {/* Search - Inactive */}
        <NavItem icon={<SearchIcon />} label="Search" isActive={false} />
      </div>
    </div>
  );
}

export function NavItem({
  icon,
  label,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}) {
  return (
    <div className="w-[75px] h-[49px] flex flex-col items-center justify-start cursor-pointer">
      {/* Icon */}
      <div className="mt-[8px] mb-auto">{icon}</div>

      {/* Label */}
      <span
        className={`text-[10px] font-normal leading-none tracking-[1.2%] mt-auto mb-0 ${
          isActive ? "text-white" : "text-[#CFD9E4]"
        }`}
        style={{
          fontFamily:
            "SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function FeedIcon() {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.44 6.72L13.44 6.72L13.44 17.72L2.44 17.72L2.44 6.72Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.72 2.44L17.72 2.44L17.72 13.44L6.72 13.44L6.72 2.44Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15.89" cy="15.89" r="3.67" fill="white" />
    </svg>
  );
}

export function ExploreIcon() {
  return (
    <svg
      className="w-[25px] h-[22px]"
      viewBox="0 0 25 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.44 10.39L20.73 10.39"
        stroke="#AEBECE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6.71 4.28L16.47 4.28"
        stroke="#AEBECE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.44 4.28L5.49 4.28"
        stroke="#AEBECE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.2 1.83L12.2 1.83"
        stroke="#AEBECE"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse
        cx="12.2"
        cy="11.02"
        rx="9.15"
        ry="9.17"
        stroke="#AEBECE"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function NotificationsIcon() {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11 3.06C8.5 3.06 6.5 5.06 6.5 7.56L6.5 13.06L4.5 15.06L17.5 15.06L15.5 13.06L15.5 7.56C15.5 5.06 13.5 3.06 11 3.06Z"
        stroke="#CFD9E4"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 17.06C9 18.16 9.9 19.06 11 19.06C12.1 19.06 13 18.16 13 17.06"
        stroke="#CFD9E4"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="5.5" r="2.75" fill="#718BA4" />
    </svg>
  );
}

export function InboxIcon() {
  return (
    <svg
      className="w-[22px] h-[29px]"
      viewBox="0 0 22 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.44 4.89L19.56 4.89L19.56 22.21L2.44 22.21L2.44 4.89Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.44 9.78L7.33 14.67L14.67 7.33L19.56 12.22"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="7.33"
        y="22.21"
        width="6.72"
        height="6.79"
        rx="1"
        fill="url(#inboxGradient)"
      />
      <defs>
        <linearGradient
          id="inboxGradient"
          x1="10.69"
          y1="22.21"
          x2="10.69"
          y2="29"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFDD86" />
          <stop offset="1" stopColor="#FECC4E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      className="w-[20px] h-[20.5px]"
      viewBox="0 0 20 20.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8.5" cy="8.5" r="6.5" stroke="#AEBECE" strokeWidth="1.5" />
      <path
        d="M13.5 13.5L18 18"
        stroke="#AEBECE"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AnalyticsIcon() {
  return (
    <svg
      className="w-[22px] h-[22px]"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="3" y="13" width="4" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="8" width="4" height="11" rx="1" fill="currentColor" />
      <rect x="15" y="3" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}
