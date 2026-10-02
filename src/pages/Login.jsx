import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-shape shape-one"></div>
      <div className="auth-background-shape shape-two"></div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">N</div>
          <span>NoteShare</span>
        </div>

        <div className="auth-heading">
          <h1>Welcome back!</h1>

          <p>
            Sign in to continue accessing your notes,
            resources and study materials.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >

          <div className="auth-field">
            <label htmlFor="email">
              Email Address
            </label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                @
              </span>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password">
                Password
              </label>
            </div>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                *
              </span>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {message && (
            <div className="auth-message">
              <span>!</span>
              <p>{message}</p>
            </div>
          )}

          <button
            className="auth-submit-button"
            type="submit"
            disabled={loading}
          >
            <span>
              {loading
                ? "Logging in..."
                : "Login to NoteShare"}
            </span>

            <span className="auth-arrow">
              →
            </span>
          </button>

        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?
          </p>

          <a href="/register">
            Create a free account
            <span>→</span>
          </a>
        </div>

        <div className="auth-security">
          <span>✓</span>
          <p>
            Your study resources are always
            available when you need them.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;