import React from "react";

/**
 * StoryItem Interface
 *
 * Represents a single story item in the stories carousel.
 */
interface StoryItem {
  id: string;
  avatarUrl: string;
  hasUnseenStory?: boolean;
  isVerified?: boolean;
}

/**
 * StoriesCarousel Component
 *
 * Displays a horizontal scrollable list of user stories with avatars.
 * Supports verified badges and unseen story indicators (orange gradient border).
 *
 * @param stories - Array of story items to display
 */
interface StoriesCarouselProps {
  stories: StoryItem[];
}

const StoriesCarousel: React.FC<StoriesCarouselProps> = React.memo(
  ({ stories }) => {
    return (
      <section className="relative h-20 bg-gradient-to-b from-black/20 to-transparent">
        {/* Stories container */}
        <div className="flex items-center gap-3 px-5 py-5 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <div key={story.id} className="relative flex-shrink-0">
              {/* Avatar container with optional gradient border for unseen stories */}
              <div
                className={`w-11 h-11 rounded-full p-[2px] ${
                  story.hasUnseenStory
                    ? "bg-gradient-to-br from-[#F58367] to-[#D96F55]"
                    : ""
                }`}
              >
                <img
                  src={story.avatarUrl}
                  alt={`${story.id} story avatar`}
                  width={40}
                  height={40}
                  loading="eager"
                  decoding="async"
                  className="w-10 h-10 rounded-full object-cover bg-gray-200"
                />
              </div>

              {/* Verified badge */}
              {story.isVerified && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#4A90E2]"
                    aria-label="Verified account"
                  >
                    <path
                      d="M8 0L10.49 2.49L13.98 2.02L13.51 5.51L16 8L13.51 10.49L13.98 13.98L10.49 13.51L8 16L5.51 13.51L2.02 13.98L2.49 10.49L0 8L2.49 5.51L2.02 2.02L5.51 2.49L8 0Z"
                      fill="currentColor"
                    />
                    <path
                      d="M6 8L7.5 9.5L10 6"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Arrow icon for more stories */}
          <button
            className="flex-shrink-0 ml-2 text-[#AEBECE] hover:text-white transition-colors"
            aria-label="View more stories"
          >
            <svg
              width="10"
              height="18"
              viewBox="0 0 10 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            >
              <path d="M1 1L9 9L1 17" />
            </svg>
          </button>
        </div>

        {/* Bottom line separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/15" />
      </section>
    );
  },
);

StoriesCarousel.displayName = "StoriesCarousel";

export default StoriesCarousel;
export type { StoryItem };
