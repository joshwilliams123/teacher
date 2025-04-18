import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

const Signup = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
  
    const navigate = useNavigate();

    const handleSignup = async (e) => {
      e.preventDefault();
      setError(""); 
      setSuccessMessage(""); 
  
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Your account was created successfully! You will now be redirected to teacher home page!");
        setEmail("");
        setPassword("");
        setTimeout(() => navigate("/teacher-home"), 2500);
      } catch (err) {
        if (err.code === "auth/weak-password") {
          setError("The password should be at least 6 letters");
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
              <h1>Sign Up</h1>
            </div>
          </div>
        </header>
  
        <main>
          <div className="container">
            <div className="text-center mb-4">
              <h2>Create Your Account</h2>
            </div>
  
            {error && <p className="text-danger text-center">{error}</p>}
  
            <div className="w-50 mx-auto">
              <form onSubmit={handleSignup}>
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
                  <button type="submit" className="btn btn-primary">Sign Up</button>
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
  
  export default Signup;