import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";

function TeacherHome() {
  return (
    <div className="container">
      <header className="jumbotron jumbotron-fluid bg-light text-center">
        <div className="container">
          <h1>Home</h1>
        </div>
      </header>

      <main className="text-center">
        <h2>Current Published Test</h2>
        <h3>Example Test</h3>
        <progress value="50" max="100">50%</progress>
        <p>18/36 finished</p>

        <div className="row justify-content-center mt-4">
          <div className="col-md-4">
            <div className="card">
              <Link to="/teacher-choice" className="text-decoration-none text-dark">
                <div className="card-body text-center">
                  <i className="bi bi-clipboard-check display-4"></i>
                  <h4 className="card-title mt-2">Create, Edit, and Publish Tests</h4>
                </div>
              </Link>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <a href="/monitor-progress" className="text-decoration-none text-dark">
                <div className="card-body text-center">
                  <i className="bi bi-tv display-4"></i>
                  <h4 className="card-title mt-2">Monitor Student Progress</h4>
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherHome;