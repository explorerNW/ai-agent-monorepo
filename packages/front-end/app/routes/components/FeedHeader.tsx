import React from "react";

/**
 * FeedHeader Component
 *
 * Displays the header section of the feed page with user avatar, "New" title,
 * and publish count since last visit.
 *
 * @param avatarUrl - URL of the user's avatar image
 * @param sinceLastVisitCount - Number of new publishes since last visit
 */
interface FeedHeaderProps {
  avatarUrl: string;
  sinceLastVisitCount: number;
}

const FeedHeader: React.FC<FeedHeaderProps> = React.memo(
  ({ avatarUrl, sinceLastVisitCount }) => {
    return (
      <header className="px-5 pt-14 pb-4">
        {/* Top line separator */}
        <div className="h-px bg-white/15 mb-4" />

        {/* Header content */}
        <div className="flex items-start justify-between">
          {/* Left side: Title and publish count */}
          <div className="flex-1">
            <p className="text-[#AEBECE] text-xs font-medium leading-4 tracking-tight mb-2">
              {"Since last visit:"}{" "}
              <span className="text-[#FFFFFF]">
                {sinceLastVisitCount} new publishes
              </span>
            </p>
            <h1 className="text-white text-[34px] font-bold leading-[41px] tracking-wide">
              New
            </h1>
          </div>

          {/* Right side: Avatar */}
          <img
            src={avatarUrl}
            alt="User avatar"
            width={40}
            height={40}
            loading="eager"
            decoding="async"
            className="w-10 h-10 rounded-full object-cover bg-gray-200"
          />
        </div>

        {/* Bottom line separator */}
        <div className="h-px bg-white/15 mt-4" />
      </header>
    );
  },
);

FeedHeader.displayName = "FeedHeader";

export default FeedHeader;
