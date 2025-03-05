import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); 
    setSuccessMessage(""); 

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage("You have successfully logged in! You will be redirected to the teacher home page.");
      setEmail("");
      setPassword("");
      setTimeout(() => navigate("/teacher-home"), 2500);
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else {
        setError(err.message);
      }
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

              <div className="text-center">
                <button type="submit" className="btn btn-primary">Login</button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {successMessage && (
        <div className="alert alert-success fixed-bottom m-3" style={{ zIndex: 9999 }}>
          <p className="text-center mb-0">{successMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Login;