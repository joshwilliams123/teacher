import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function MonitorProgress() {
  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Monitor Test Progress</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div className="text-center mb-4">
            <h2>Current Test Progress</h2>
            <h3>Z-scores Test</h3>
            <div className="progress w-50 mx-auto">
              <div 
                className="progress-bar" 
                role="progressbar" 
                style={{width: "50%"}} 
                aria-valuenow="50" 
                aria-valuemin="0" 
                aria-valuemax="100"
              >
                50%
              </div>
            </div>
            <p className="mt-2">18/36 students completed</p>
          </div>
          
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Time Spent</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>John Smith</td>
                  <td>Complete</td>
                  <td>25 minutes</td>
                  <td>85%</td>
                </tr>
                <tr>
                  <td>Sarah Johnson</td>
                  <td>In Progress</td>
                  <td>15 minutes</td>
                  <td>--</td>
                </tr>
                <tr>
                  <td>Michael Brown</td>
                  <td>Not Started</td>
                  <td>0 minutes</td>
                  <td>--</td>
                </tr>
                <tr>
                  <td>Emily Davis</td>
                  <td>Complete</td>
                  <td>32 minutes</td>
                  <td>92%</td>
                </tr>
                <tr>
                  <td>James Wilson</td>
                  <td>Complete</td>
                  <td>28 minutes</td>
                  <td>78%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mt-4">
            <button className="btn btn-primary me-2">Export Results</button>
            <button className="btn btn-secondary">Close Test</button>
          </div>
        
        </div>
      </main>
      <footer className="mt-4">
      </footer>
    </div>
  );
}

export default MonitorProgress;