import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db, collection, getDocs, query, where } from "./firebase";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function PublishedTests() {
  const [allClasses, setAllClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [publishedTests, setPublishedTests] = useState([]);
  const auth = getAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const classQuery = query(collection(db, "classes"), where("userId", "==", currentUser.uid));
      const classSnapshot = await getDocs(classQuery);
      const classData = classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllClasses(classData);
    };

    fetchClasses();
  }, [auth]);

  useEffect(() => {
    const fetchTests = async () => {
      if (!selectedClassId) return;

      const testSnapshot = await getDocs(collection(db, "tests"));
      const allTests = testSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const filtered = allTests.filter(test =>
        test.published && Array.isArray(test.publishedTo) && test.publishedTo.includes(selectedClassId)
      );

      setPublishedTests(filtered);
    };

    fetchTests();
  }, [selectedClassId]);

  const getClassNameById = (id) => {
    const classObj = allClasses.find(cls => cls.id === id);
    return classObj ? (classObj.name || classObj.className || "Unnamed Class") : "Unknown Class";
  };

  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Published Tests</h1>
          </div>
        </div>
      </header>

      <main className="container mt-4">
        <div className="form-group">
          <label htmlFor="classSelect"><strong>Select a Class</strong></label>
          <select
            id="classSelect"
            className="form-control"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">-- Choose a Class --</option>
            {allClasses.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name || cls.className}
              </option>
            ))}
          </select>
        </div>

        <div className="card-deck d-flex flex-wrap justify-content-start mt-4">
          {publishedTests.length === 0 && selectedClassId && (
            <p className="text-muted">No published tests for this class.</p>
          )}

          {publishedTests.map(test => (
            <div key={test.id} className="card m-2" style={{ width: "22rem" }}>
              <div className="card-body">
                <h4 className="card-title">{test.testName}</h4>
                <p><strong>Published To:</strong> {test.publishedTo.map(getClassNameById).join(", ")}</p>

                <div className="border p-2 mb-3" style={{ maxHeight: "250px", overflowY: "auto", backgroundColor: "#f8f9fa" }}>
                  {test.questions && test.questions.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {test.questions.map((q, index) => (
                        <li key={index} className="list-group-item">
                          <strong>Q{index + 1}:</strong> <InlineMath math={q.text} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">No questions available.</p>
                  )}
                </div>

                <ul className="list-group list-group-flush">
                  <li className="list-group-item">{test.questions?.length || 0} questions</li>
                  <li className="list-group-item text-success">Published</li>
                </ul>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default PublishedTests;
