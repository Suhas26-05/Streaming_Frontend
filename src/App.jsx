import { useEffect, useState } from "react";
import { loginUser, signUpUser } from "./api";

const emptySignup = {
  userId: "",
  username: "",
  email: "",
  password: ""
};

const emptyLogin = {
  identifier: "",
  password: ""
};

const getStoredUser = () => {
  try {
    const value = localStorage.getItem("pstream-user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

function App() {
  const [mode, setMode] = useState("login");
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    if (user) {
      localStorage.setItem("pstream-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("pstream-user");
    }
  }, [user]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError("");
    setMessage("");
  };

  const handleSignupChange = ({ target }) => {
    setSignupForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleLoginChange = ({ target }) => {
    setLoginForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const validateSignup = () => {
    if (!signupForm.userId || !signupForm.username || !signupForm.email || !signupForm.password) {
      return "Fill in all signup fields.";
    }
    if (!/\S+@\S+\.\S+/.test(signupForm.email)) {
      return "Enter a valid email address.";
    }
    if (signupForm.password.length < 6) {
      return "Use at least 6 characters for your password.";
    }
    return "";
  };

  const validateLogin = () => {
    if (!loginForm.identifier || !loginForm.password) {
      return "Enter your user ID or email and password.";
    }
    return "";
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    const validationError = validateSignup();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await signUpUser(signupForm);
      setUser(data);
      setMessage("Account created successfully.");
      setSignupForm(emptySignup);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const validationError = validateLogin();

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const identifier = loginForm.identifier.trim();
      const payload = {
        password: loginForm.password,
        ...(identifier.includes("@") ? { email: identifier } : { userId: identifier })
      };

      const data = await loginUser(payload);
      setUser(data);
      setMessage("Welcome back. Login successful.");
      setLoginForm(emptyLogin);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setMessage("You have been signed out.");
    setError("");
    setMode("login");
  };

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <main className="auth-layout">
        <section className="hero-panel">
          <p className="eyebrow"><span className="live-dot" />P Streaming</p>
          <h1>Enter the<br /><em>stream.</em></h1>
          <p className="hero-copy">
            Your watchlist, your rhythm, your next obsession. Sign in to continue where your
            evening left off.
          </p>

          <div className="feature-grid">
            <article className="feature-card">
              <span>01</span>
              <h2>Your queue</h2>
              <p>Everything saved for later.</p>
            </article>
            <article className="feature-card">
              <span>02</span>
              <h2>Pick up</h2>
              <p>Continue in one click.</p>
            </article>
            <article className="feature-card">
              <span>03</span>
              <h2>Made for you</h2>
              <p>Stories worth staying for.</p>
            </article>
          </div>
        </section>

        <section className="auth-panel">
          <div className="panel-top">
            <div>
              <p className="panel-kicker">Authentication</p>
              <h2>{user ? "Session Active" : mode === "login" ? "Welcome back" : "Create account"}</h2>
            </div>

            {!user && (
              <div className="mode-switch" role="tablist" aria-label="Authentication mode">
                <button
                  className={mode === "login" ? "mode-pill active" : "mode-pill"}
                  onClick={() => handleModeChange("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={mode === "signup" ? "mode-pill active" : "mode-pill"}
                  onClick={() => handleModeChange("signup")}
                  type="button"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {message ? <div className="status-banner success">{message}</div> : null}
          {error ? <div className="status-banner error">{error}</div> : null}

          {user ? (
            <div className="profile-card">
              <div className="profile-badge">{user.username?.slice(0, 1).toUpperCase() || "U"}</div>
              <div className="profile-copy">
                <p className="profile-label">Logged in as</p>
                <h3>{user.username}</h3>
                <p>{user.email}</p>
                <p>User ID: {user.userId}</p>
              </div>
              <button className="primary-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : mode === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <label>
                User ID or Email
                <input
                  name="identifier"
                  placeholder="Enter user ID or email"
                  value={loginForm.identifier}
                  onChange={handleLoginChange}
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  autoComplete="current-password"
                />
              </label>
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <label>
                User ID
                <input
                  name="userId"
                  placeholder="Create a unique user ID"
                  value={signupForm.userId}
                  onChange={handleSignupChange}
                  autoComplete="username"
                />
              </label>
              <label>
                Username
                <input
                  name="username"
                  placeholder="Enter display name"
                  value={signupForm.username}
                  onChange={handleSignupChange}
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="Create password"
                  value={signupForm.password}
                  onChange={handleSignupChange}
                  autoComplete="new-password"
                />
              </label>
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
