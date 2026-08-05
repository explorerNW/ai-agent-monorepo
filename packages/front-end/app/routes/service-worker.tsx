import type { Route } from './+types/home';
import { useState } from 'react';
import React from 'react';
import BottomNavigation from '~/components/BottomNavigation';
import { ServiceWorkerManager } from '~/components';

// eslint-disable-next-line no-empty-pattern, react-refresh/only-export-components
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Service Worker Management' },
    {
      name: 'description',
      content: 'Manage service workers for the application',
    },
  ];
}

export default function ServiceWorkerManagementPage() {
  const [activeTab, setActiveTab] = useState<string>('service_worker');

  // Memoize handler to prevent unnecessary re-renders in child components
  const handleTabChange = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Content section - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <ServiceWorkerManager />
      </div>

      {/* Bottom Navigation - fixed at bottom */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
