import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorBanner } from "../components/ui";

export default function LoginPage() {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("credentials"); // credentials | otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitCredentials(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.mfaRequired) {
        setStep("otp");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(otp);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="brand-badge">🚙</div>
          <div className="brand-text">
            <div className="brand-title">SLIIT Vehicle Rental</div>
            <div className="brand-sub">Unified Platform</div>
          </div>
        </div>

        {step === "credentials" ? (
          <>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in with your staff or customer account.</p>
            <ErrorBanner message={error} />
            <form onSubmit={submitCredentials}>
              <div className="form-grid" style={{ gridTemplateColumns: "1fr", gap: 14 }}>
                <div className="field">
                  <label>Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="auth-title">Verify it's you</h2>
            <p className="auth-subtitle">We emailed a 6-digit code to {email}. Enter it below.</p>
            <ErrorBanner message={error} />
            <form onSubmit={submitOtp}>
              <div className="field">
                <label>One-time code</label>
                <input
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  style={{ letterSpacing: "0.3em", fontSize: 18, textAlign: "center" }}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
                {loading ? "Verifying…" : "Verify & sign in"}
              </button>
              <button type="button" className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => setStep("credentials")}>
                ← Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
