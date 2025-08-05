import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider, signInWithPopup } from "./firebase";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/teacher-home"); 
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/teacher-home");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("A password reset email has been sent to your inbox.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Login</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div className="text-center mb-4">
            <h2>Log Into Your Account</h2>
          </div>
          {error && <p className="text-danger text-center">{error}</p>}
          <div className="w-50 mx-auto">
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-center gap-3 mt-3">
                <button
                  type="submit"
                  className="btn btn-primary flex-fill"
                  style={{ maxWidth: "220px" }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="btn d-flex align-items-center justify-content-center flex-fill"
                  style={{
                    backgroundColor: "#fff",
                    color: "#000",
                    border: "1px solid #ccc",
                    gap: "8px",
                    maxWidth: "220px"
                  }}
                  onClick={handleGoogleLogin}
                >
                  <img
                    src="/google.png"
                    alt="Google logo"
                    style={{ width: "24px", height: "24px" }}
                  />
                  Log In With Google
                </button>
              </div>
              <div className="mt-4 mb-2 text-center">
                <small className="text-muted">
                  Forgot your password? Enter your email above and click below to receive a reset link.
                </small>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
