import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function TestViewer() {
  const [tests, setTests] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "tests"));
        const testData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), published: false }));
        setTests(testData);
      } catch (error) {
        console.error("Error fetching tests: ", error);
      }
    };
    
    fetchTests();
  }, []);

  const handlePublish = async (testId) => {
    try {
      const updatedTests = tests.map(test => 
        test.id === testId ? { ...test, published: !test.published } : test
      );
      setTests(updatedTests);
      setSuccessMessage("Publishing status updated!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating test: ", error);
    }
  };

  const handleEditTest = (testId) => {
    navigate(`/edit-test/${testId}`);
  };

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
          {successMessage && (
            <div className="alert alert-success text-center">{successMessage}</div>
          )}
          <div id="testViewCardDeck" className="card-deck d-flex flex-wrap justify-content-start mt-5">
            {tests.map((test) => (
              <div key={test.id} className="card m-2" style={{ width: "18rem" }}>
                <div className="card-body">
                  <h4 className="card-title">{test.testName}</h4>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">{test.questions.length} questions</li>
                    <li className={`list-group-item ${test.published ? "text-success" : "text-danger"}`}>
                      {test.published ? "Published" : "Not Published"}
                    </li>
                  </ul>
                  <button 
                    className={`btn btn-small mt-3 ${test.published ? "btn-success" : "btn-primary"}`}
                    onClick={() => handlePublish(test.id)}
                  >
                    {test.published ? "Published!" : "Publish"}
                  </button>
                  <button 
                    className="btn btn-small btn-secondary mt-3"
                    onClick={() => handleEditTest(test.id)}
                  >
                    Edit Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TestViewer;