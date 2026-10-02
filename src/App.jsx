import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import BrowseNotes from "./pages/BrowseNotes";
import MyNotes from "./pages/MyNotes";
import UploadNotes from "./pages/UploadNotes";
import Subjects from "./pages/Subjects";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { supabase } from "./supabase";

import "./App.css";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setCurrentUser(session?.user || null);
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user || null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const authPath =
    location.pathname === "/login" ||
    location.pathname === "/register";

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-logo">N</div>
            <span>NoteShare</span>
          </div>

          <div className="auth-heading">
            <h1>Loading...</h1>
            <p>
              Connecting to your NoteShare account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser && authPath) {
    return (
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
      </Routes>
    );
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (authPath) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const menuItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: "⌂",
    },
    {
      name: "Browse Notes",
      path: "/notes",
      icon: "▤",
    },
    {
      name: "My Notes",
      path: "/my-notes",
      icon: "▢",
    },
    {
      name: "Upload Notes",
      path: "/upload",
      icon: "↑",
    },
    {
      name: "Subjects",
      path: "/subjects",
      icon: "◇",
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();

    const searchText = search.trim();

    if (searchText) {
      navigate(
        `/notes?search=${encodeURIComponent(
          searchText
        )}`
      );
    } else {
      navigate("/notes");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setCurrentUser(null);

    navigate("/login", {
      replace: true,
    });
  };

  const displayName =
    currentUser?.user_metadata?.name ||
    currentUser?.email?.split("@")[0] ||
    "Student";

  const displayEmail =
    currentUser?.email ||
    "College Student";

  const avatarText = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">
            N
          </div>

          <span>
            NoteShare
          </span>
        </div>

        <div className="menu-section">

          <p className="menu-title">
            MENU
          </p>

          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `menu-item ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="menu-icon">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>
            </NavLink>
          ))}

        </div>

        <div className="sidebar-bottom">

          <button
            className="menu-item"
            type="button"
            onClick={handleLogout}
          >
            <span className="menu-icon">
              ↪
            </span>

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}
      <main className="main-content">

        <header className="topbar">

          <form
            className="search-box"
            onSubmit={handleSearch}
          >
            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search notes, subjects, topics..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </form>

          <div className="top-actions">

            <button
              className="icon-button"
              type="button"
              onClick={() =>
                navigate("/my-notes")
              }
            >
              ♡
            </button>

            <div className="profile">

              <div className="avatar">
                {avatarText || "ST"}
              </div>

              <div className="profile-info">

                <strong>
                  {displayName}
                </strong>

                <span>
                  {displayEmail}
                </span>

              </div>

              <span className="arrow">
                ⌄
              </span>

            </div>

          </div>

        </header>

        {/* PROTECTED PAGES */}
        <Routes>

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/notes"
            element={<BrowseNotes />}
          />

          <Route
            path="/my-notes"
            element={<MyNotes />}
          />

          <Route
            path="/upload"
            element={<UploadNotes />}
          />

          <Route
            path="/subjects"
            element={<Subjects />}
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </main>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;