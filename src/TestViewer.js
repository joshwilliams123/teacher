import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function TestViewer() {
  const [tests, setTests] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClassesToPublish, setSelectedClassesToPublish] = useState([]);

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchTestsAndClasses = async () => {
      try {
        const currentUser = auth.currentUser;

        if (currentUser) {
          const userId = currentUser.uid;

          const testQuery = query(collection(db, "tests"), where("userId", "==", userId));
          const testSnapshot = await getDocs(testQuery);
          const testData = testSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTests(testData);

          const classQuery = query(collection(db, "classes"), where("userId", "==", userId));
          const classSnapshot = await getDocs(classQuery);
          const classesData = classSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAllClasses(classesData);
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchTestsAndClasses();
  }, [auth]);

  const handleEditTest = (testId) => {
    navigate(`/edit-test/${testId}`);
  };

  const handleDeleteTest = async (testId) => {
    try {
      await deleteDoc(doc(db, "tests", testId));
      setTests(tests.filter((test) => test.id !== testId));
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  const openPublishModal = (test) => {
    setSelectedTest(test);
    setSelectedClassesToPublish(test.publishedTo || []);
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    try {
      const testRef = doc(db, "tests", selectedTest.id);
      await updateDoc(testRef, {
        published: true,
        publishedTo: selectedClassesToPublish,
      });

      setTests((prevTests) =>
        prevTests.map((t) =>
          t.id === selectedTest.id
            ? { ...t, published: true, publishedTo: selectedClassesToPublish }
            : t
        )
      );

      setSuccessMessage("Test published successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowPublishModal(false);
    } catch (error) {
      console.error("Error publishing test: ", error);
    }
  };

  const getClassNameById = (id) => {
    const found = allClasses.find((cls) => cls.id === id);
    return found ? found.name || found.className : "Unknown Class";
  };

  const getClassIdByName = (name) => {
    const found = allClasses.find(
      (cls) => cls.name === name || cls.className === name
    );
    return found ? found.id : null;
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

          <div className="card-deck d-flex flex-wrap justify-content-start mt-5">
            {tests.map((test) => {
              const assignedClassIds = (test.classNames || [])
                .map(getClassIdByName)
                .filter(Boolean);
              const publishedClassIds = test.publishedTo || [];
              const publishedCount = publishedClassIds.filter((id) =>
                assignedClassIds.includes(id)
              ).length;
              const totalAssigned = assignedClassIds.length;
              const fullyPublished = totalAssigned > 0 && publishedCount === totalAssigned;
              const partiallyPublished = publishedCount > 0 && !fullyPublished;
              const percent = totalAssigned > 0 ? (publishedCount / totalAssigned) * 100 : 0;

              return (
                <div key={test.id} className="card m-2" style={{ width: "22rem" }}>
                  <div className="card-body d-flex flex-column position-relative">
                    <h4 className="card-title">{test.testName}</h4>
                    <button
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                      onClick={() => handleDeleteTest(test.id)}
                    >
                      X
                    </button>

                    {test.classNames && (
                      <p className="text-muted">
                        <strong>Assigned to:</strong> {test.classNames.join(", ")}
                      </p>
                    )}

                    {test.publishedTo && test.publishedTo.length > 0 && (
                      <p className="text-success">
                        <strong>Published to:</strong>{" "}
                        {test.publishedTo.map(getClassNameById).join(", ")}
                      </p>
                    )}

                    <div
                      className="border p-2 mb-3"
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "5px",
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
                                    backgroundColor: "#f1f1f1",
                                  }}
                                >
                                  <ol type="a" className="list-group list-group-flush">
                                    {q.choices.map((choice, choiceIndex) => (
                                      <li
                                        key={choiceIndex}
                                        className={`list-group-item ${
                                          q.correctAnswer ===
                                          String.fromCharCode(97 + choiceIndex)
                                            ? "bg-success text-white"
                                            : ""
                                        }`}
                                        style={{ border: "none", padding: "8px" }}
                                      >
                                        <InlineMath math={choice} />
                                        {q.choiceImages &&
                                          q.choiceImages[choiceIndex] && (
                                            <div className="mt-2">
                                              <img
                                                src={q.choiceImages[choiceIndex]}
                                                alt={`Choice ${choiceIndex + 1}`}
                                                className="img-fluid rounded"
                                                style={{
                                                  maxHeight: "60px",
                                                  objectFit: "contain",
                                                }}
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
                      <li
                        className={`list-group-item ${
                          test.published ? "text-success" : "text-danger"
                        }`}
                      >
                        {test.published ? "Published" : "Not Published"}
                      </li>
                    </ul>

                    <button
                      className={`btn mt-3 position-relative ${
                        fullyPublished
                          ? "btn-success"
                          : partiallyPublished
                          ? "btn-warning"
                          : "btn-primary"
                      }`}
                      onClick={() => openPublishModal(test)}
                    >
                      {fullyPublished ? "Fully Published" : "Publish"}
                      {partiallyPublished && (
                        <div
                          className="progress"
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            height: "5px",
                            width: "100%",
                          }}
                        >
                          <div
                            className="progress-bar bg-dark"
                            role="progressbar"
                            style={{ width: `${percent}%` }}
                            aria-valuenow={percent}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          />
                        </div>
                      )}
                    </button>

                    <button
                      className="btn btn-small btn-secondary mt-3"
                      onClick={() => handleEditTest(test.id)}
                    >
                      View Full Test and Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showPublishModal && selectedTest && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Publish Test to Classes</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowPublishModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Assigned to:</strong>{" "}
                  {selectedTest.classNames?.join(", ") || "N/A"}
                </p>
                <p>
                  <strong>Select Classes to Publish To:</strong>
                </p>
                {allClasses
                  .filter((cls) =>
                    selectedTest.classNames?.includes(cls.className || cls.name)
                  )
                  .map((cls) => (
                    <div key={cls.id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={cls.id}
                        checked={selectedClassesToPublish.includes(cls.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSelectedClassesToPublish((prev) =>
                            isChecked
                              ? [...prev, cls.id]
                              : prev.filter((id) => id !== cls.id)
                          );
                        }}
                      />
                      <label className="form-check-label">
                        {cls.className || cls.name || "Unnamed Class"}
                      </label>
                    </div>
                  ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={confirmPublish}>
                  Confirm Publish
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPublishModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestViewer;