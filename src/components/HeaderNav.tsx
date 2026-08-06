import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canManageLabManagers } from "../roles";
import {
  canManageTrainers,
  canViewActivityLog,
} from "../services/permissionsService";
import ActivityLogModal from "./ActivityLogModal";
import LabManagersModal from "./LabManagersModal";
import TrainersModal from "./TrainersModal";

export default function HeaderNav() {
  const { user } = useAuth();
  const [labManagersOpen, setLabManagersOpen] = useState(false);
  const [trainersOpen, setTrainersOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [showTrainers, setShowTrainers] = useState(false);

  useEffect(() => {
    let cancelled = false;
    canManageTrainers(user).then((allowed) => {
      if (!cancelled) setShowTrainers(allowed);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const showLabManagers = canManageLabManagers(user);
  const showActivity = canViewActivityLog(user);

  return (
    <>
      <nav className="header-nav" aria-label="Main navigation">
        <NavLink
          to="/labs"
          end
          className={({ isActive }) =>
            isActive ? "header-nav-btn header-nav-btn-active" : "header-nav-btn"
          }
        >
          Main menu
        </NavLink>
        <NavLink
          to="/trainings"
          className={({ isActive }) =>
            isActive ? "header-nav-btn header-nav-btn-active" : "header-nav-btn"
          }
        >
          Trainings
        </NavLink>
        {showTrainers && (
          <button
            type="button"
            className="header-nav-btn"
            onClick={() => setTrainersOpen(true)}
          >
            Trainers
          </button>
        )}
        {showLabManagers && (
          <button
            type="button"
            className="header-nav-btn"
            onClick={() => setLabManagersOpen(true)}
          >
            Lab Managers
          </button>
        )}
        {showActivity && (
          <button
            type="button"
            className="header-nav-btn"
            onClick={() => setActivityOpen(true)}
          >
            Activity
          </button>
        )}
      </nav>
      {trainersOpen && (
        <TrainersModal onClose={() => setTrainersOpen(false)} />
      )}
      {labManagersOpen && (
        <LabManagersModal onClose={() => setLabManagersOpen(false)} />
      )}
      {activityOpen && (
        <ActivityLogModal onClose={() => setActivityOpen(false)} />
      )}
    </>
  );
}
