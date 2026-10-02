import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      setMessage("Please fill in all the fields.");
      return;
    }

    if (cleanName.length < 2) {
      setMessage("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
            },
          },
        });

      if (error) {
        setMessage(error.message);
        return;
      }

      // If email confirmation is disabled,
      // Supabase gives us a session immediately.
      if (data.session) {
        navigate("/", { replace: true });
        return;
      }

      // If email confirmation is enabled,
      // the user must confirm their email first.
      setMessage(
        "Account created successfully! Please check your email and confirm your account before logging in."
      );
    } catch (error) {
      console.error("Registration error:", error);
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

      <div className="auth-card register-card">

        <div className="auth-brand">
          <div className="auth-logo">N</div>
          <span>NoteShare</span>
        </div>

        <div className="auth-heading">
          <h1>Create your account</h1>

          <p>
            Join NoteShare and start sharing,
            discovering and managing your study notes.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >

          <div className="auth-field">
            <label htmlFor="name">
              Full Name
            </label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                ◉
              </span>

              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                autoComplete="name"
              />
            </div>
          </div>

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
            <label htmlFor="password">
              Password
            </label>

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
                placeholder="Create a password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
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

            <span className="auth-hint">
              Use at least 6 characters.
            </span>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                *
              </span>

              <input
                id="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
              />

              <button
                className="password-toggle"
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword
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
                ? "Creating Account..."
                : "Create My Account"}
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
            Already have an account?
          </p>

          <Link to="/login">
            Login to NoteShare
            <span>→</span>
          </Link>
        </div>

        <div className="auth-security">
          <span>✓</span>

          <p>
            Create your account and start
            sharing knowledge with fellow students.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;