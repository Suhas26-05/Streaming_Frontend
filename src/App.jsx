import { useEffect, useState } from "react";
import {
  createProfile,
  deleteProfile,
  getProfiles,
  loginUser,
  logoutUser,
  selectProfile,
  signUpUser,
  updateProfile
} from "./api";

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

const emptyProfile = {
  profile_name: "",
  profile_pic: ""
};

const normalizeUser = (userData) => ({
  ...userData,
  userId: userData.userId || userData.user_id || "",
  name: userData.name || userData.username || "",
  isAdmin: Boolean(userData.isAdmin),
  activeProfile: userData.activeProfile || null
});

const getDisplayName = (userData) => (
  userData.name || userData.username || userData.userId || userData.email || "User"
);

const getStoredUser = () => {
  try {
    const value = localStorage.getItem("pstream-user");
    const storedUser = value ? JSON.parse(value) : null;
    return storedUser?.session_token ? normalizeUser(storedUser) : null;
  } catch {
    return null;
  }
};

const getStoredPendingUser = () => {
  try {
    const value = localStorage.getItem("pstream-pending-user");
    const storedUser = value ? JSON.parse(value) : null;
    return storedUser?.userId && Array.isArray(storedUser.profiles)
      ? normalizeUser(storedUser)
      : null;
  } catch {
    return null;
  }
};

function AuthenticatedWorkspace({ user, error, loading, onLogout, onSelectProfile, hasSession }) {
  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [activeProfile, setActiveProfile] = useState(() => user.activeProfile || null);
  const [profileError, setProfileError] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);

  useEffect(() => {
    let ignoreResult = false;

    const loadProfiles = async () => {
      if (user.isAdmin) {
        setProfiles([]);
        setProfilesLoading(false);
        return;
      }

      setProfilesLoading(true);
      setProfileError("");

      try {
        const data = await getProfiles(user.userId);
        if (!ignoreResult) {
          setProfiles(data);
        }
      } catch (requestError) {
        if (!ignoreResult) {
          setProfileError(requestError.response?.data?.detail || "Could not load profiles.");
        }
      } finally {
        if (!ignoreResult) {
          setProfilesLoading(false);
        }
      }
    };

    loadProfiles();
    return () => {
      ignoreResult = true;
    };
  }, [user.userId]);

  const getRequestError = (requestError, fallback) => (
    requestError.response?.data?.detail || fallback
  );

  const handleProfileChange = ({ target }) => {
    setProfileForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleCreateProfile = async (event) => {
    event.preventDefault();
    const profileName = profileForm.profile_name.trim();
    if (!profileName) {
      setProfileError("Enter a profile name.");
      return;
    }

    setProfileBusy(true);
    setProfileError("");
    try {
      const newProfile = await createProfile(user.userId, {
        profile_name: profileName,
        profile_pic: profileForm.profile_pic.trim() || null
      });
      setProfiles((current) => [...current, newProfile]);
      setProfileForm(emptyProfile);
      setShowProfileForm(false);
    } catch (requestError) {
      setProfileError(getRequestError(requestError, "Could not create profile."));
    } finally {
      setProfileBusy(false);
    }
  };

  const startEditing = (profile) => {
    setEditingProfile({ ...profile });
    setShowProfileForm(true);
    setProfileError("");
  };

  const handleEditChange = ({ target }) => {
    setEditingProfile((current) => ({ ...current, [target.name]: target.value }));
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    const profileName = editingProfile.profile_name.trim();
    if (!profileName) {
      setProfileError("Enter a profile name.");
      return;
    }

    setProfileBusy(true);
    setProfileError("");
    try {
      const updatedProfile = await updateProfile(user.userId, editingProfile.id, {
        profile_name: profileName,
        profile_pic: editingProfile.profile_pic?.trim() || null
      });
      setProfiles((current) => current.map((profile) => (
        profile.id === updatedProfile.id ? updatedProfile : profile
      )));
      setEditingProfile(null);
      setShowProfileForm(false);
    } catch (requestError) {
      setProfileError(getRequestError(requestError, "Could not update profile."));
    } finally {
      setProfileBusy(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    setProfileBusy(true);
    setProfileError("");
    try {
      await deleteProfile(user.userId, profileId);
      setProfiles((current) => current.filter((profile) => profile.id !== profileId));
      if (activeProfile?.id === profileId) {
        setActiveProfile(null);
      }
    } catch (requestError) {
      setProfileError(getRequestError(requestError, "Could not delete profile."));
    } finally {
      setProfileBusy(false);
    }
  };

  const handleSelectProfile = async (profile) => {
    setProfileBusy(true);
    setProfileError("");
    try {
      await onSelectProfile(profile);
      setActiveProfile(profile);
    } catch (requestError) {
      setProfileError(getRequestError(requestError, "Could not select profile."));
    } finally {
      setProfileBusy(false);
    }
  };

  const openCreateProfile = () => {
    setEditingProfile(null);
    setProfileForm(emptyProfile);
    setProfileError("");
    setShowProfileForm(true);
  };

  const closeProfileForm = () => {
    if (profileBusy) {
      return;
    }
    setEditingProfile(null);
    setProfileForm(emptyProfile);
    setProfileError("");
    setShowProfileForm(false);
  };

  return (
    <div className={hasSession ? "workspace-shell" : "workspace-shell profile-choice-shell"}>
      {hasSession ? (
        <aside className="side-navbar">
          <div className="sidebar-identity">
            <div className="workspace-brand">
              <span className="brand-mark">CV</span>
              <span>CineVibe</span>
            </div>

            <div className="account-mini">
              <span className="account-avatar">{getDisplayName(user).slice(0, 1).toUpperCase() || "U"}</span>
              <div>
                <span className="account-label">Signed in as</span>
                <strong>{getDisplayName(user)}</strong>
              </div>
            </div>

            <nav className="workspace-nav" aria-label="Workspace navigation">
              <span className="nav-item active"><b>01</b> Profiles</span>
              <span className="nav-item"><b>02</b> Watchlist</span>
              <span className="nav-item"><b>03</b> Settings</span>
            </nav>
          </div>

          <div className="sidebar-footer">
            {error ? <p className="logout-error" role="alert">{error}</p> : null}
            <button className="logout-button" type="button" onClick={onLogout} disabled={loading}>
              {loading ? "Signing out..." : "Logout"}
            </button>
          </div>
        </aside>
      ) : null}

      <main className="workspace-main">
        {activeProfile ? (
          <section className="active-profile-stage">
            {activeProfile.profile_pic ? (
              <img className="active-profile-image" src={activeProfile.profile_pic} alt="" />
            ) : (
              <span className="active-profile-initial">
                {activeProfile.profile_name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <p className="workspace-kicker">Profile selected</p>
            <h1>Login<br /><em>Successful</em></h1>
            <p>Watching as <strong>{activeProfile.profile_name}</strong></p>
            {!user.isAdmin ? (
              <button className="switch-profile" type="button" onClick={() => setActiveProfile(null)}>
                Switch profile
              </button>
            ) : null}
          </section>
        ) : (
          <>
            <header className={hasSession ? "workspace-header" : "workspace-header profile-choice-header"}>
              <div>
                <p className="workspace-kicker">{hasSession ? "Your viewing room" : "Who is watching?"}</p>
                <h1>{hasSession ? "Choose your vibe." : "Choose your vibe"}</h1>
              </div>
              <div className="profile-summary">
                <span className="profile-count">{profiles.length} profile{profiles.length === 1 ? "" : "s"}</span>
                <small>{hasSession ? "Ready when you are" : "Select a profile to continue"}</small>
              </div>
            </header>

            {profileError ? <div className="profile-alert" role="alert">{profileError}</div> : null}

            <section className={hasSession ? "profile-studio" : "profile-studio profile-choice-studio"}>
              <div className="profiles-section">
                <div className="section-heading">
                  <div>
                    <p>Who&apos;s here?</p>
                    <span>Pick a profile and press play.</span>
                  </div>
                </div>

                {profilesLoading ? (
                  <div className="profiles-empty">Loading profiles...</div>
                ) : profiles.length ? (
                  <div className="profile-grid">
                    {profiles.map((profile) => (
                      <article className="profile-tile" key={profile.id}>
                        <span className="profile-number">0{profile.id}</span>
                        <button
                          className="profile-select"
                          type="button"
                          onClick={() => handleSelectProfile(profile)}
                          disabled={profileBusy}
                        >
                          {profile.profile_pic ? (
                            <img src={profile.profile_pic} alt="" className="profile-image" />
                          ) : (
                            <span className="profile-initial">{profile.profile_name.slice(0, 1).toUpperCase()}</span>
                          )}
                          <strong>{profile.profile_name}</strong>
                        </button>
                        <div className="profile-actions">
                          <button type="button" onClick={() => startEditing(profile)} disabled={profileBusy}>Edit</button>
                          <button type="button" onClick={() => handleDeleteProfile(profile.id)} disabled={profileBusy}>Delete</button>
                        </div>
                      </article>
                    ))}
                    <button className="profile-add-button" type="button" onClick={openCreateProfile} disabled={profileBusy}>
                      <span className="profile-add-icon" aria-hidden="true">+</span>
                      <strong>Add Profile</strong>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="profiles-empty">No profiles yet. Create your first one.</div>
                    <button className="profile-add-button" type="button" onClick={openCreateProfile} disabled={profileBusy}>
                      <span className="profile-add-icon" aria-hidden="true">+</span>
                      <strong>Add Profile</strong>
                    </button>
                  </>
                )}
              </div>

              {showProfileForm ? <aside className="profile-form-card" role="dialog" aria-labelledby="profile-form-title">
                <p className="form-eyebrow">{editingProfile ? "Update profile" : "New profile"}</p>
                <div className="profile-form-heading">
                  <h2 id="profile-form-title">{editingProfile ? "Edit profile" : "Add a profile"}</h2>
                  <button className="profile-form-close" type="button" onClick={closeProfileForm} disabled={profileBusy} aria-label="Close profile form">×</button>
                </div>
                <form onSubmit={editingProfile ? handleUpdateProfile : handleCreateProfile}>
                  <label>
                    Profile name
                    <input
                      name="profile_name"
                      placeholder="e.g. Alex"
                      value={editingProfile ? editingProfile.profile_name : profileForm.profile_name}
                      onChange={editingProfile ? handleEditChange : handleProfileChange}
                      disabled={profileBusy}
                    />
                  </label>
                  <label>
                    Picture URL <span>Optional</span>
                    <input
                      name="profile_pic"
                      placeholder="https://..."
                      value={editingProfile ? editingProfile.profile_pic || "" : profileForm.profile_pic}
                      onChange={editingProfile ? handleEditChange : handleProfileChange}
                      disabled={profileBusy}
                    />
                  </label>
                  <button className="profile-submit" type="submit" disabled={profileBusy}>
                    {profileBusy ? "Saving..." : editingProfile ? "Save changes" : "Create profile"}
                  </button>
                  <button className="cancel-edit" type="button" onClick={closeProfileForm} disabled={profileBusy}>
                    Cancel
                  </button>
                </form>
              </aside> : null}
            </section>
          </>
        )}
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
  const [pendingLogin, setPendingLogin] = useState(() => getStoredPendingUser());
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("pstream-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("pstream-user");
    }
  }, [user]);

  useEffect(() => {
    if (pendingLogin && !user) {
      localStorage.setItem("pstream-pending-user", JSON.stringify(pendingLogin));
    } else {
      localStorage.removeItem("pstream-pending-user");
    }
  }, [pendingLogin, user]);

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
      if (data.session_token) {
        setUser(normalizeUser({
          ...data,
          isAdmin: true,
          activeProfile: { profile_name: data.name || "Admin" }
        }));
      } else if (data.userId && Array.isArray(data.profiles)) {
        setPendingLogin(normalizeUser(data));
      } else {
        throw new Error("The server returned an unexpected login response.");
      }
      setLoginForm(emptyLogin);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!user?.session_token) {
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

  const handleProfileSelection = async (profile) => {
    const loginContext = pendingLogin || user;
    const session = await selectProfile(loginContext.userId, profile.id);
    const sessionToken = session.session_token;

    if (!sessionToken) {
      throw new Error("The server did not create a profile session.");
    }

    setUser(normalizeUser({
      ...loginContext,
      ...session,
      session_token: sessionToken,
      activeProfile: profile
    }));
    setPendingLogin(null);
  };

  if (user) {
    return (
      <AuthenticatedWorkspace
        user={user}
        error={error}
        loading={logoutLoading}
        onLogout={handleLogout}
        onSelectProfile={handleProfileSelection}
        hasSession
      />
    );
  }

  if (pendingLogin) {
    return (
      <AuthenticatedWorkspace
        user={pendingLogin}
        error=""
        loading={false}
        onLogout={() => {}}
        onSelectProfile={handleProfileSelection}
        hasSession={false}
      />
    );
  }

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <main className="auth-layout cinema-layout">
        <header className="landing-nav">
          <div className="landing-brand"><span>CV</span> CineVibe</div>
          <p>YOUR CINEMA, YOUR MOOD</p>
        </header>

        <section className="cinema-hero">
          <div className="hero-copy-wrap">
            <p className="eyebrow"><span className="live-dot" />Tonight&apos;s spotlight</p>
            <h1>Escape into<br /><em>something</em> extraordinary.</h1>
            <p className="hero-copy">Pick up where you left off, find a new obsession, or just press play on a perfect night in.</p>
            <div className="hero-meta"><span>4K STORIES</span><i /> <span>NO AD BREAKS</span><i /> <span>ALL YOURS</span></div>
          </div>
          <aside className="spotlight-card" aria-label="Featured CineVibe original">
            <div className="spotlight-glow" />
            <p>CINEVIBE ORIGINAL</p>
            <h2>After<br /><em>midnight</em></h2>
            <div><span>2026</span><span>DRAMA</span><span>2H 04M</span></div>
          </aside>
        </section>

        <section className="auth-panel compact-auth-panel">
          <div className="panel-top">
            <div>
              <p className="panel-kicker">CineVibe access</p>
              <h2>{mode === "login" ? "Welcome back." : "Start your story."}</h2>
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
          <p className="auth-note">By continuing, you agree to make room for one more episode.</p>
        </section>

        <footer className="landing-footer"><span>© 2026 CINEVIBE</span><span>PLAY SOMETHING GOOD</span></footer>
      </main>
    </div>
  );
}

export default App;
