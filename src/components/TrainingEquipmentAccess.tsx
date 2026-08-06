import { Link } from "react-router-dom";
import type { Equipment } from "../types";

interface TrainingEquipmentAccessProps {
  equipment: Equipment[];
  /** When true, wording assumes the training is already completed. */
  completed?: boolean;
}

/** Lists equipment a training unlocks (or will unlock). */
export default function TrainingEquipmentAccess({
  equipment,
  completed = false,
}: TrainingEquipmentAccessProps) {
  if (equipment.length === 0) {
    return (
      <p className="training-access-label muted">
        No equipment currently tied to this training.
      </p>
    );
  }

  return (
    <div className="training-access-block">
      <p className="training-access-label">
        {completed
          ? `Equipment access (${equipment.length})`
          : `Unlocks access to (${equipment.length})`}
      </p>
      <ul className="training-access-list">
        {equipment.map((item) => (
          <li key={item.id}>
            <Link
              to={`/equipment/${item.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              {item.name}
            </Link>
            <span className={`badge badge-${item.category}`}>
              {item.category}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
