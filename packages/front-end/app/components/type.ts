/**
 * Navigation Item Interface
 *
 * Represents a single navigation tab item.
 */
export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  link?: string; // Optional link for routing
}

export interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}
