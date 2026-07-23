import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      <div className="header-user">
        {user && (
          <>
            <span className="header-username">{user.username}</span>
            {user.isAdmin && <span className="badge badge-admin">Admin</span>}
            <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
