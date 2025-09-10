import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider, signInWithPopup } from "./firebase";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
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
    setSuccess("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/teacher-home");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`, 
      });
      setSuccess(
        `A password reset email has been sent to ${email}. Please check your inbox and return to the login page. Note: this email may be in your spam folder.`
      );
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
          {success && <p className="text-success text-center">{success}</p>}

          <div className="w-50 mx-auto">
            <form onSubmit={handleLogin}>
              <div className="mb-3 d-flex align-items-center gap-2">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleForgotPassword}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Forgot Password?
                </button>
              </div>

              <div className="mb-1">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="d-flex justify-content-center gap-3 mt-4">
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
                    maxWidth: "220px",
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
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
