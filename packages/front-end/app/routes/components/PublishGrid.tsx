import React from "react";
import PublishCard from "./PublishCard";
import type { PublishCard as PublishCardType } from "./PublishCard";

/**
 * PublishGrid Component
 *
 * Displays a grid of publish cards in a 2-column layout.
 * Uses React.memo to prevent unnecessary re-renders when parent updates.
 *
 * @param publishes - Array of publish cards to display in the grid
 */
interface PublishGridProps {
  publishes: PublishCardType[];
}

const PublishGrid: React.FC<PublishGridProps> = React.memo(({ publishes }) => {
  return (
    <section className="px-5 py-6">
      {/* Grid container with 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        {publishes.map((card) => (
          <PublishCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
});

PublishGrid.displayName = "PublishGrid";

export default PublishGrid;
