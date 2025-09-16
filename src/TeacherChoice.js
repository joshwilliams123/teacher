// Teachers can choose to view existing tests or create a new test

import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { Link } from "react-router-dom";
import testImg from "./imgs/test.png";
import addImg from "./imgs/add.png";

function TeacherChoice() {
  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Create, Edit, and Publish Tests</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div className="card-deck d-flex justify-content-around ml-auto mr-auto mt-5">
            <div className="card">
              <Link to="/test-viewer" className="text-decoration-none">
                <div className="text-center mt-1">
                  <img src={testImg} alt="test" />
                </div>
                <div className="card-body text-center">
                  <h4 className="card-title">View Tests</h4>
                  <p className="card-text">Look at current and past tests</p>
                </div>
              </Link>
            </div>
            <div className="card">
              <Link to="/create-test" className="text-decoration-none">
                <div className="text-center mt-1">
                  <img src={addImg} alt="make a test" />
                </div>
                <div className="card-body text-center">
                  <h4 className="card-title">Create A New Test</h4>
                  <p className="card-text">Create and publish a new test</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer></footer>
    </div>
  );
}

export default TeacherChoice;