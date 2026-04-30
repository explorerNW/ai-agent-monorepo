import React from 'react';

export function Header() {
  return (
    <div className="px-4 sm:px-5 pt-[6vh] pb-3 sm:pb-4">
      {/* Date text */}
      <p className="text-xs sm:text-[13px] font-medium leading-tight tracking-[-0.62%] text-white mb-4 sm:mb-5">
        <span className="font-semibold">Since last visit:</span>{" "}
        <span className="text-[#AEBECE]">24 new publishes</span>
      </p>
      
      {/* Title and Avatar row */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h1 className="text-3xl sm:text-[34px] font-bold leading-tight tracking-[1.21%] text-white">
          New
        </h1>
        
        {/* Avatar - Eager load as it's above the fold */}
        <img
          src="/images/header-avatar.png"
          alt="User avatar"
          width={40}
          height={40}
          decoding="async"
          className="w-10 h-10 sm:w-[40px] sm:h-[40px] rounded-full object-cover"
        />
      </div>
      
      {/* Divider line */}
      <div className="w-full h-px bg-white opacity-15" />
    </div>
  );
}

export function Stories() {
  return (
    <div className="py-2 sm:py-3 border-b border-white/15">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
      
      {/* Story items */}
      <div className="relative flex items-center px-4 sm:px-[18px] gap-4 sm:gap-[23px] overflow-x-auto scrollbar-hide">
        {/* Story 1 - with gradient border and verified */}
        <div className="relative w-11 h-11 sm:w-[44px] sm:h-[44px] flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F58367] to-[#D96F55] p-0.5 sm:p-[2px]">
            <img
              src="/images/story-1.png"
              alt="Story 1"
              width={44}
              height={44}
              decoding="async"
              loading="eager"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <VerifiedBadge className="absolute bottom-0 right-0" />
        </div>
        
        {/* Story 2 */}
        <img
          src="/images/story-2.png"
          alt="Story 2"
          width={40}
          height={40}
          decoding="async"
          loading="eager"
          className="w-10 h-10 sm:w-[40px] sm:h-[40px] rounded-full object-cover flex-shrink-0"
        />
        
        {/* Story 3 - with verified */}
        <div className="relative w-10 h-10 sm:w-[42px] sm:h-[42px] flex-shrink-0">
          <img
            src="/images/story-3.png"
            alt="Story 3"
            width={40}
            height={40}
            decoding="async"
            loading="eager"
            className="w-10 h-10 sm:w-[40px] sm:h-[40px] rounded-full object-cover absolute top-0.5 sm:top-[2px] left-0.5 sm:left-[2px]"
          />
          <VerifiedBadge className="absolute bottom-0.5 sm:bottom-[2px] right-0.5 sm:right-[2px]" />
        </div>
        
        {/* Story 4 - with gradient border */}
        <div className="relative w-11 h-11 sm:w-[44px] sm:h-[44px] flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F58367] to-[#D96F55] p-0.5 sm:p-[2px]">
            <img
              src="/images/story-4.png"
              alt="Story 4"
              width={44}
              height={44}
              decoding="async"
              loading="eager"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>
        
        {/* Story 5 */}
        <img
          src="/images/story-5.png"
          alt="Story 5"
          width={40}
          height={40}
          decoding="async"
          loading="eager"
          className="w-10 h-10 sm:w-[40px] sm:h-[40px] rounded-full object-cover flex-shrink-0"
        />
        
        {/* Arrow icon */}
        <ArrowIcon className="flex-shrink-0" />
      </div>
    </div>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      className={`w-[16px] h-[16px] ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="8" fill="white" />
      <path
        d="M4.91 7.76L6.55 9.4L11.09 4.86"
        stroke="#F58367"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`w-[10px] h-[18px] ${className}`}
      viewBox="0 0 10 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1L9 9L1 17"
        stroke="#AEBECE"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PublishedPosts() {
  return (
    <div className="px-4 sm:px-5 pt-5 sm:pt-6 pb-3 sm:pb-4 drop-shadow-[0px_25px_30px_rgba(0,0,0,0.2)]">
      <div className="grid grid-cols-2 gap-2">
        {/* Post 1 */}
        <PostCard
          image="/images/publish-1.png"
          hasFewImages={true}
          hasVideo={true}
        />
        
        {/* Post 2 */}
        <PostCard image="/images/publish-2.png" has3d={true} />
        
        {/* Post 3 */}
        <PostCard image="/images/publish-3.png" hasFewImages={true} />
        
        {/* Post 4 */}
        <PostCard image="/images/publish-4.png" has3d={true} />
        
        {/* Post 5 */}
        <PostCard image="/images/publish-5.png" />
        
        {/* Post 6 */}
        <PostCard image="/images/publish-6.png" />
      </div>
    </div>
  );
}

export function PostCard({
  image,
  hasFewImages,
  hasVideo,
  has3d,
}: {
  image: string;
  hasFewImages?: boolean;
  hasVideo?: boolean;
  has3d?: boolean;
}) {
  return (
    <div className="relative aspect-square rounded-lg sm:rounded-[15px] overflow-hidden">
      <img
        src={image}
        alt="Post"
        width={200}
        height={200}
        decoding="async"
        loading="lazy"
        className="w-full h-full object-cover"
      />
      
      {/* Overlay for video/few images indicator */}
      {(hasFewImages || hasVideo || has3d) && (
        <div className="absolute bottom-2 sm:bottom-[10px] left-2 sm:left-[10px]">
          {hasFewImages && <FewImagesIcon />}
          {hasVideo && <VideoIcon />}
          {has3d && <ThreeDIcon />}
        </div>
      )}
    </div>
  );
}

export function FewImagesIcon() {
  return (
    <svg
      className="w-[26px] h-[26px]"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="26" height="26" rx="4" fill="rgba(0, 0, 0, 0.5)" />
      <path
        d="M6 6L15 6L15 15L6 15L6 6Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="18" r="3" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

export function VideoIcon() {
  return (
    <svg
      className="w-[26px] h-[26px]"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="26" height="26" rx="4" fill="rgba(0, 0, 0, 0.5)" />
      <path
        d="M10 8L18 13L10 18V8Z"
        fill="white"
      />
    </svg>
  );
}

export function ThreeDIcon() {
  return (
    <svg
      className="w-[26px] h-[26px]"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="26" height="26" rx="4" fill="rgba(0, 0, 0, 0.5)" />
      <path
        d="M8 13C8 10.7909 9.79086 9 12 9C14.2091 9 16 10.7909 16 13C16 15.2091 14.2091 17 12 17C9.79086 17 8 15.2091 8 13Z"
        stroke="white"
        strokeWidth="1.5"
      />
      <path
        d="M12 9V7M12 19V17M8 13H6M18 13H16"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
