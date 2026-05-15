import React, { useState } from "react";
import FeedHeader from "./components/FeedHeader";
import StoriesCarousel from "./components/StoriesCarousel";
import PublishGrid from "./components/PublishGrid";
import type { StoryItem } from "./components/StoriesCarousel";
import type { PublishCard } from "./components/PublishCard";

/**
 * Feed Page Component
 *
 * Main feed page displaying user stories, publish grid, and bottom navigation.
 * Implements a social media-style feed with horizontal story carousel and image grid.
 *
 * Features:
 * - Header with avatar and new publish count
 * - Horizontal scrollable stories with verified badges
 * - 2-column grid of publish cards with video/multi-image indicators
 * - Fixed bottom navigation with 5 tabs
 *
 * Design follows Figma specifications with gradient backgrounds, proper spacing,
 * and responsive layout optimized for mobile (375px width).
 */

// Mock data - In production, this would come from API/props
const mockStories: StoryItem[] = [
  {
    id: "1",
    avatarUrl: "/images/feed/images/story-1.png",
    hasUnseenStory: true,
    isVerified: true,
  },
  { id: "2", avatarUrl: "/images/feed/images/story-2.png" },
  { id: "3", avatarUrl: "/images/feed/images/story-3.png", isVerified: true },
  {
    id: "4",
    avatarUrl: "/images/feed/images/story-4.png",
    hasUnseenStory: true,
  },
  { id: "5", avatarUrl: "/images/feed/images/story-5.png" },
];

const mockPublishes: PublishCard[] = [
  { id: "1", imageUrl: "/images/feed/images/image-1.png", hasVideo: true },
  {
    id: "2",
    imageUrl: "/images/feed/images/image-2.png",
    hasMultipleImages: true,
    imageCount: 3,
  },
  { id: "3", imageUrl: "/images/feed/images/image-3.png" },
  {
    id: "4",
    imageUrl: "/images/feed/images/image-4.png",
    hasMultipleImages: true,
    imageCount: 2,
  },
  { id: "5", imageUrl: "/images/feed/images/image-5.png" },
  { id: "6", imageUrl: "/images/feed/images/image-6.png", hasVideo: true },
];

export function meta() {
  return [
    { title: "Feed - Infinite" },
    {
      name: "description",
      content: "View your personalized feed with stories and publishes",
    },
  ];
}

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#465664] to-[#2C373F] pb-[83px]">
      {/* Background layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#465664] to-[#2C373F] -z-10" />

      {/* Main content container */}
      <main className="relative max-w-[375px] mx-auto">
        {/* Header section */}
        <FeedHeader
          avatarUrl="/images/feed/images/avatar.png"
          sinceLastVisitCount={24}
        />

        {/* Stories carousel */}
        <StoriesCarousel stories={mockStories} />

        {/* Publish grid */}
        <PublishGrid publishes={mockPublishes} />
      </main>
    </div>
  );
}
