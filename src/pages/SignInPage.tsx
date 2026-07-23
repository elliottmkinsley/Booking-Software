import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signIn as signInRequest } from "../services/authService";

export default function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [signUpNotice, setSignUpNotice] = useState(false);

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }
    setError("");
    const user = await signInRequest(username.trim(), password, isAdmin);
    signIn(user);
    navigate("/labs");
  }

  function handleSignUp(event: FormEvent) {
    event.preventDefault();
    setSignUpNotice(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">R</div>
          <h1>Radiant Booking</h1>
          <p className="auth-subtitle">
            Radiant Center for Remote Sensing &middot; NAU
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "signin" ? "auth-tab active" : "auth-tab"}
            onClick={() => setMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="auth-form">
            <label className="field">
              <span>Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoFocus
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <span>Sign in as Admin</span>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block">
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="auth-form">
            <label className="field">
              <span>Full Name</span>
              <input type="text" placeholder="Your name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" placeholder="you@nau.edu" />
            </label>
            <label className="field">
              <span>Username</span>
              <input type="text" placeholder="Choose a username" />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" placeholder="Choose a password" />
            </label>
            {signUpNotice && (
              <p className="form-notice">
                Account creation is coming soon. Accounts will be available once
                the database is connected.
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-block">
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
