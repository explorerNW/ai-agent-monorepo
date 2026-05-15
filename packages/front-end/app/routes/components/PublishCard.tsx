import React from "react";

/**
 * PublishCard Interface
 *
 * Represents a single publish card in the grid layout.
 */
interface PublishCard {
  id: string;
  imageUrl: string;
  hasVideo?: boolean;
  hasMultipleImages?: boolean;
  imageCount?: number;
}

/**
 * PublishCard Component
 *
 * Displays a single publish card with image, optional video indicator,
 * and multiple images indicator. Uses React.memo for performance optimization.
 *
 * @param card - The publish card data to display
 */
interface PublishCardProps {
  card: PublishCard;
}

const PublishCard: React.FC<PublishCardProps> = React.memo(({ card }) => {
  return (
    <article className="relative w-full aspect-square rounded-[15px] overflow-hidden shadow-[0px_25px_30px_0px_rgba(0,0,0,0.2)] bg-gray-200">
      {/* Main image */}
      <img
        src={card.imageUrl}
        alt={`Publish ${card.id}`}
        width={163}
        height={163}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover"
      />

      {/* Video indicator overlay */}
      {card.hasVideo && (
        <div className="absolute bottom-3 left-3 w-[26px] h-[26px] flex items-center justify-center">
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Video content"
          >
            <circle cx="13" cy="13" r="13" fill="rgba(0, 0, 0, 0.5)" />
            <path d="M10 8L18 13L10 18V8Z" fill="white" />
          </svg>
        </div>
      )}

      {/* Multiple images indicator */}
      {card.hasMultipleImages && card.imageCount && card.imageCount > 1 && (
        <div className="absolute bottom-3 right-3 w-[26px] h-[26px] flex items-center justify-center">
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label={`${card.imageCount} images`}
          >
            <rect
              x="3"
              y="3"
              width="20"
              height="20"
              rx="4"
              fill="rgba(0, 0, 0, 0.5)"
            />
            <rect
              x="7"
              y="7"
              width="12"
              height="12"
              rx="2"
              stroke="white"
              strokeWidth="1.5"
            />
            <text
              x="13"
              y="17"
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              {card.imageCount}
            </text>
          </svg>
        </div>
      )}
    </article>
  );
});

PublishCard.displayName = "PublishCard";

export default PublishCard;
export type { PublishCard };
