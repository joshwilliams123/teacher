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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTest, setPreviewTest] = useState(null);
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
    const confirmed = window.confirm("Are you sure you want to delete this test?");
    if (!confirmed) return;

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

  const openPreviewModal = (test) => {
    setPreviewTest(test);
    setShowPreviewModal(true);
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

          <div className="d-flex flex-column gap-3 mt-4">
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

              return (
                <div
                  key={test.id}
                  className="card d-flex flex-row align-items-start"
                  style={{
                    width: "100%",
                    maxWidth: "1000px",
                    minHeight: "150px",
                    padding: "15px",
                    gap: "20px",
                  }}
                >
                  <div className="flex-grow-1">
                    <h4 className="card-title mb-2">{test.testName}</h4>
                    {test.classNames && (
                      <p className="text-muted mb-1">
                        <strong>Assigned to:</strong> {test.classNames.sort().join(", ")}
                      </p>
                    )}
                    {test.publishedTo && test.publishedTo.length > 0 && (
                      <p className="text-success mb-1">
                        <strong>Published to:</strong>{" "}
                        {test.publishedTo.map(getClassNameById).sort().join(", ")}
                      </p>
                    )}
                    <p className="mb-1">{test.questions.length} questions</p>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => openPreviewModal(test)}
                    >
                      Quick Preview
                    </button>

                    <button
                      className={`btn btn-sm ${fullyPublished
                        ? "btn-success"
                        : partiallyPublished
                          ? "btn-warning"
                          : "btn-primary"
                        }`}
                      onClick={() => openPublishModal(test)}
                    >
                      {fullyPublished ? "Fully Published" : "Publish"}
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEditTest(test.id)}
                    >
                      View & Edit
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTest(test.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showPublishModal && selectedTest && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Publish Test to Classes</h5>
                <button type="button" className="close" onClick={() => setShowPublishModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Assigned to:</strong>{" "}
                  {selectedTest.classNames?.join(", ") || "N/A"}
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
                <button className="btn btn-secondary" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && previewTest && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content" style={{ maxHeight: "80vh", overflowY: "auto" }}>
              <div className="modal-header">
                <h5 className="modal-title">Quick Preview - {previewTest.testName}</h5>
                <button type="button" className="close" onClick={() => setShowPreviewModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {previewTest.questions && previewTest.questions.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {previewTest.questions.map((q, index) => (
                      <li key={index} className="list-group-item">
                        <strong>Q{index + 1}:</strong>
                        <div style={{ wordWrap: "break-word", overflowWrap: "break-word", maxWidth: "100%" }}>
                          <InlineMath math={q.text} />
                        </div>
                        {q.choices && (
                          <ol type="a" className="list-group mt-2">
                            {q.choices.map((choice, i) => (
                              <li
                                key={i}
                                className={`list-group-item ${q.correctAnswer === String.fromCharCode(97 + i)
                                  ? "bg-success text-white"
                                  : ""
                                  }`}
                                style={{
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                  maxWidth: "100%",
                                }}
                              >
                                <InlineMath math={choice} />
                              </li>
                            ))}
                          </ol>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No questions available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestViewer;
