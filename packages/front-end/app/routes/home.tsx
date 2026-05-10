import type { Route } from "./+types/home";
import { Header, Stories, PublishedPosts } from "../components/FeedComponents";
import { BottomNavigation } from "../components/BottomNavigation";
import { usePageView, useTrack } from "~/hooks/useTrack";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Infinite Feed" },
    { name: "description", content: "Social media feed interface" },
  ];
}

export default function Home() {
  // 页面浏览埋点 - 必须在顶层调用
  usePageView();

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Content section - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Feed />
      </div>

      {/* Bottom Navigation - fixed at bottom */}
      <BottomNavigation />
    </div>
  );
}

function Feed() {
  return (
    <div className="w-full bg-black overflow-hidden">
      {/* Header */}
      <Header />

      {/* Stories Section */}
      <Stories />

      {/* Published Posts Grid */}
      <PublishedPosts />
    </div>
  );
}
