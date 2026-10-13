import { useState } from "react";

function LoginPage({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Login failed"
        );
      }

      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Panel */}
        <div className="login-visual">
          <div className="login-brand">
            <h1>HRMS</h1>
            <p>Human Resource Management System</p>
          </div>

          <div className="login-visual-content">
            <h2>Manage People, Leave & Attendance</h2>
            <p>
              A smarter and more professional way to manage
              employees, leave applications, approvals and
              attendance in one place.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to continue</p>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label">
              Email Address
              <input
                className="login-input"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </label>

            <label className="login-label">
              Password
              <input
                className="login-input"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </label>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;