// Teachers can navigate to create/edit tests or monitor student progress

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
              <Link to="/monitor-progress" className="text-decoration-none text-dark">
                <div className="card-body text-center">
                  <i className="bi bi-tv display-4"></i>
                  <h4 className="card-title mt-2">Monitor Student Progress</h4>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherHome;