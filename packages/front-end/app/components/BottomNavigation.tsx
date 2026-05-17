import React from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Navigation Item Interface
 *
 * Represents a single navigation tab item.
 */
interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  link?: string; // Optional link for routing
}

/**
 * BottomNavigation Component
 *
 * Displays the bottom navigation bar with 5 tabs: Search, Inbox, Notifications, Explore, and Feed.
 * Uses gradient background and proper active state indicators.
 *
 * @param activeTab - Currently active tab ID
 * @param onTabChange - Callback function when tab is changed
 */
interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = React.memo(
  ({ activeTab, onTabChange }) => {
    const navigate = useNavigate();
    // Define navigation items with their icons
    const navItems: NavItem[] = [
      {
        id: "feed",
        label: "Feed",
        isActive: activeTab === "feed",
        icon: (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="12"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="3"
              y="12"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="12"
              y="12"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
        link: "/",
      },
      {
        id: "analytics",
        label: "Analytics",
        isActive: activeTab === "analytics",
        icon: (
          <svg
            className="w-[22px] h-[22px]"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="13"
              width="4"
              height="6"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="9"
              y="8"
              width="4"
              height="11"
              rx="1"
              fill="currentColor"
            />
            <rect
              x="15"
              y="3"
              width="4"
              height="16"
              rx="1"
              fill="currentColor"
            />
          </svg>
        ),
        link: "/analytics",
      },
      {
        id: "service_worker",
        label: "SW Manager",
        isActive: activeTab === "service_worker",
        icon: (
          <svg width="22" height="29" viewBox="0 0 22 29" fill="none">
            <path
              d="M3 5C3 3.89543 3.89543 3 5 3H17C18.1046 3 19 3.89543 19 5V23C19 24.1046 18.1046 25 17 25H5C3.89543 25 3 24.1046 3 23V5Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M3 9L11 15L19 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ),
        link: "/service-worker",
      },
      {
        id: "notifications",
        label: "Notifications",
        isActive: activeTab === "notifications",
        icon: (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M11 2C7.13401 2 4 5.13401 4 9V14L2 16V17H20V16L18 14V9C18 5.13401 14.866 2 11 2Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M9 19C9 20.1046 9.89543 21 11 21C12.1046 21 13 20.1046 13 19"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        ),
      },
      {
        id: "search",
        label: "Search",
        isActive: activeTab === "search",
        icon: (
          <svg width="20" height="21" viewBox="0 0 20 21" fill="none">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M14 14L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A4450] to-[#282F39]" />

        {/* Top line separator */}
        <div className="absolute top-0 left-0 right-0 h-px bg-white/15" />

        {/* Navigation items */}
        <div className="relative flex justify-around items-center h-[83px] px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                item.link ? navigate(item.link) : onTabChange(item.id)
              } // Only trigger onTabChange if there's no link
              className={`flex flex-col items-center justify-center w-[75px] h-[49px] transition-colors ${
                item.isActive ? "text-white" : "text-[#CFD9E4]"
              }`}
              aria-label={item.label}
              aria-current={item.isActive ? "page" : undefined}
            >
              {/* Icon */}
              <div className="mb-1">{item.icon}</div>

              {/* Label */}
              <span className="text-[10px] font-normal tracking-wide leading-3 text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    );
  },
);

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

BottomNavigation.displayName = "BottomNavigation";

export default BottomNavigation;
