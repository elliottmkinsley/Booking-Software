import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import HeaderNav from "./HeaderNav";
import NotificationBell from "./NotificationBell";
import { ROLE_LABELS } from "../roles";

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <header className="app-header">
      <Link to="/labs" className="header-brand">
        <span className="header-logo">R</span>
        <span>Radiant Booking</span>
      </Link>
      <HeaderNav />
      <div className="header-user">
        {user && (
          <>
            <NotificationBell />
            <Link to="/profile" className="header-profile">
              <span className="header-username">{user.username}</span>
              {user.role !== "user" && (
                <span className={`badge badge-role-${user.role}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
