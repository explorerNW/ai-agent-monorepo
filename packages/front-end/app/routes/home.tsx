import type { Route } from './+types/home';
import FeedPage from './feed';
import { useState } from 'react';
import React from 'react';
import BottomNavigation from '~/components/BottomNavigation';

// eslint-disable-next-line no-empty-pattern, react-refresh/only-export-components
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Infinite Feed' },
    { name: 'description', content: 'Social media feed interface' },
  ];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('feed');

  // Memoize handler to prevent unnecessary re-renders in child components
  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Content section - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <FeedPage />
      </div>

      {/* Bottom Navigation - fixed at bottom */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
