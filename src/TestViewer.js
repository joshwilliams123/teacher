import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

function TestViewer() {
  const [tests, setTests] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const auth = getAuth(); 

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const currentUser = auth.currentUser;

        if (currentUser) {
          const userId = currentUser.uid; 

          const q = query(collection(db, "tests"), where("userId", "==", userId));
          const querySnapshot = await getDocs(q);
          
          const testData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), published: false }));
          setTests(testData);
        } else {
          console.log("No user is authenticated");
        }
      } catch (error) {
        console.error("Error fetching tests: ", error);
      }
    };

    fetchTests();
  }, [auth]); 

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
            <h1>View, Edit, & Publish Tests</h1>
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
              <div key={test.id} className="card m-2" style={{ width: "22rem" }}>
                <div className="card-body d-flex flex-column">
                  <h4 className="card-title">{test.testName}</h4>

                  <div 
                    className="border p-2 mb-3"
                    style={{ 
                      maxHeight: "300px", 
                      overflowY: "auto", 
                      backgroundColor: "#f8f9fa",
                      borderRadius: "5px"
                    }}
                  >
                    {test.questions && test.questions.length > 0 ? (
                      <ul className="list-group list-group-flush">
                        {test.questions.map((q, index) => (
                          <li key={index} className="list-group-item">
                            <strong>Q{index + 1}:</strong> <InlineMath math={q.text} />

                            {q.choices && q.choices.length > 0 && (
                              <div 
                                className="border rounded mt-2"
                                style={{
                                  maxHeight: "120px",
                                  overflowY: "auto",
                                  backgroundColor: "#f1f1f1"
                                }}
                              >
                                <ol type="a" className="list-group list-group-flush">
                                  {q.choices.map((choice, choiceIndex) => (
                                    <li
                                      key={choiceIndex}
                                      className={`list-group-item ${q.correctAnswer === String.fromCharCode(97 + choiceIndex) ? "bg-success text-white" : ""}`}
                                      style={{
                                        border: "none", 
                                        padding: "8px"
                                      }}
                                    >
                                      <InlineMath math={choice} />
                                      {q.choiceImages && q.choiceImages[choiceIndex] && (
                                        <div className="mt-2">
                                          <img
                                            src={q.choiceImages[choiceIndex]}
                                            alt={`Choice ${choiceIndex + 1}`}
                                            className="img-fluid rounded"
                                            style={{ maxHeight: "60px", objectFit: "contain" }}
                                          />
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted text-center">No questions available</p>
                    )}
                  </div>

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