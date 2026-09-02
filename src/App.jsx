import { useEffect, useState } from "react";
import { loginUser, logoutUser, signUpUser } from "./api";

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
    const storedUser = value ? JSON.parse(value) : null;
    return storedUser?.session_token || storedUser?.session_id != null ? storedUser : null;
  } catch {
    return null;
  }
};

function AuthenticatedWorkspace({ user, error, loading, onLogout }) {
  return (
    <div className="workspace-shell">
      <aside className="side-navbar">
        <div className="sidebar-identity">
          <div className="workspace-brand">
            <span className="brand-mark">P</span>
            <span>P Streaming</span>
          </div>

          <div className="account-mini">
              <span className="account-avatar">{user.username?.slice(0, 1).toUpperCase() || "U"}</span>
              <div>
                <span className="account-label">Signed in as</span>
                <strong>{user.username || "User"}</strong>
              </div>
          </div>
        </div>

        <div className="sidebar-footer">
          {error ? <p className="logout-error" role="alert">{error}</p> : null}
          <button className="logout-button" type="button" onClick={onLogout} disabled={loading}>
            {loading ? "Signing out..." : "Logout"}
          </button>
        </div>
      </aside>

      <main className="workspace-main">
        <section className="success-stage">
          <h1>Login<br /><em>Successful</em></h1>
        </section>
      </main>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("login");
  const [signupForm, setSignupForm] = useState(emptySignup);
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(() => getStoredUser());
  const [logoutLoading, setLogoutLoading] = useState(false);

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
      await signUpUser(signupForm);
      setMessage("Account created successfully.");
      setSignupForm(emptySignup);
      setMode("login");
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
      const sessionToken = data.session_token ?? data.session_id;
      if (sessionToken == null) {
        throw new Error("The server did not return a session identifier.");
      }
      setUser({ ...data, session_token: sessionToken });
      setLoginForm(emptyLogin);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (user?.session_token == null && user?.session_id == null) {
      return;
    }

    setLogoutLoading(true);
    setError("");

    try {
      await logoutUser(user);
      setUser(null);
      setMessage("");
      setMode("login");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Logout failed. Please try again.");
    } finally {
      setLogoutLoading(false);
    }
  };

  if (user) {
    return (
      <AuthenticatedWorkspace
        user={user}
        error={error}
        loading={logoutLoading}
        onLogout={handleLogout}
      />
    );
  }

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
              <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
            </div>

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
          </div>

          {message ? <div className="status-banner success">{message}</div> : null}
          {error ? <div className="status-banner error">{error}</div> : null}

          {mode === "login" ? (
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
