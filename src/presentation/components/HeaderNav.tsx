/**
 * Main navigation in the header.
 *
 * Everyone sees Main menu and Trainings. Extra buttons (Trainers, Lab
 * Managers, Activity) only appear for people who are allowed to use them.
 * Those last three open modals instead of changing the page.
 */
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canManageLabManagers } from "../../shared/roles";
import {
  canManageTrainers,
  canViewActivityLog,
} from "../../business/permissions";
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
