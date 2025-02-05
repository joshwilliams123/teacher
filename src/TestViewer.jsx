import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function TestViewer() {
  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Edit and Publish Tests</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div id="testViewCardDeck" className="card-deck d-flex ml-5 mt-5">
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Normal Curves</h4>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">30 questions</li>
                  <li className="list-group-item">Created 4/4/19</li>
                  <li className="list-group-item">Not Published</li>
                </ul>
                <button className="btn btn-small btn-primary mt-3">Publish</button>
                <button className="btn btn-small btn-secondary mt-3">Edit Test</button>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h4 className="card-title">Z-scores</h4>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">38 questions</li>
                  <li className="list-group-item">Created 3/29/19</li>
                  <li className="list-group-item text-success">Published</li>
                </ul>
                <button className="btn btn-small btn-primary mt-3">Monitor</button>
                <button className="btn btn-small btn-secondary mt-3">Close Test</button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer></footer>
    </div>
  );
}

export default TestViewer;
