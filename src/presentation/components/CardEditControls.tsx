/**
 * Red × and ⋯ overlay on a card while it is in edit mode.
 *
 * Clicks are stopped from bubbling so you do not also follow the card's link.
 */
interface CardEditControlsProps {
  itemName: string;
  onRemove: () => void;
  onEdit: () => void;
}

export default function CardEditControls({
  itemName,
  onRemove,
  onEdit,
}: CardEditControlsProps) {
  return (
    <>
      <button
        type="button"
        className="lab-card-remove"
        aria-label={`Remove ${itemName}`}
        title="Remove"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M4.2 4.2a.75.75 0 0 1 1.06 0L8 6.94l2.74-2.74a.75.75 0 1 1 1.06 1.06L9.06 8l2.74 2.74a.75.75 0 1 1-1.06 1.06L8 9.06l-2.74 2.74a.75.75 0 0 1-1.06-1.06L6.94 8 4.2 5.26a.75.75 0 0 1 0-1.06z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        className="lab-card-menu"
        aria-label={`Edit ${itemName}`}
        title="Edit info"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="4" cy="8" r="1.35" fill="currentColor" />
          <circle cx="8" cy="8" r="1.35" fill="currentColor" />
          <circle cx="12" cy="8" r="1.35" fill="currentColor" />
        </svg>
      </button>
    </>
  );
}
