import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, collection, getDocs, query, where } from "./firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function MonitorProgress() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      const q = query(collection(db, "classes"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const sortedClasses = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (a.name || a.className || "").localeCompare(b.name || b.className || ""));
      setClasses(sortedClasses);
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    const fetchTestScores = async () => {
      const q = query(
        collection(db, "testScores"),
        where("classId", "==", selectedClassId)
      );
      const snapshot = await getDocs(q);
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(scores);
    };
    fetchTestScores();
  }, [selectedClassId]);

  const handleShowModal = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  const getClassNameById = (id) => {
    const classObj = classes.find(cls => cls.id === id);
    return classObj ? (classObj.name || classObj.className || "Unnamed Class") : "Unknown Class";
  };

  return (
    <div>
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Monitor Test Progress</h1>
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
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name || cls.className}
              </option>
            ))}
          </select>
        </div>

        <div className="table-responsive mt-4">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Email</th>
                <th>Class</th>
                <th>Test Taken</th>
                <th>Score</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No student data found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.userEmail || student.userId}</td>
                    <td>{getClassNameById(student.classId) || student.className}</td>
                    <td>{student.testTitle || student.testId}</td>
                    <td>
                      {typeof student.score === "number"
                        ? `${student.score} / ${student.questionTimes?.length ?? "?"}`
                        : "N/A"}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleShowModal(student)}
                      >
                        View Time Spent Per Question
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && selectedStudent && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Question Times for {selectedStudent.userEmail || selectedStudent.userId}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {selectedStudent.questionTimes && selectedStudent.questionTimes.length > 0 ? (
                  <ul>
                    {selectedStudent.questionTimes.map((time, idx) => (
                      <li key={idx}>
                        Question {idx + 1}: {(time / 1000).toFixed(2)} seconds
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No question time data available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonitorProgress;