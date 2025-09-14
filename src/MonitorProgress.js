import { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, collection, getDocs, query, where } from "./firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, annotationPlugin);

function MonitorProgress() {
  const [user, setUser] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartStudent, setChartStudent] = useState(null);
  const modalBodyRef = useRef(null);
  const chartRef = useRef(null);

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

  const handleShowChartModal = (student) => {
    setChartStudent(student);
    setShowChartModal(true);
  };
  const handleCloseChartModal = () => {
    setShowChartModal(false);
    setChartStudent(null);
  };

  const getClassNameById = (id) => {
    const classObj = classes.find(cls => cls.id === id);
    return classObj ? (classObj.name || classObj.className || "Unnamed Class") : "Unknown Class";
  };

  const handleDownloadPDF = async () => {
    if (!modalBodyRef.current) return;
    const canvas = await html2canvas(modalBodyRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("test-analytics.pdf");
  };

  const handleDownloadChartPDF = async () => {
    if (!chartRef.current) return;
    const canvas = await html2canvas(chartRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("student-performance-chart.pdf");
  };

  let chartData = null;
  let chartOptions = {};
  if (chartStudent) {
    const studentTests = students.filter(
      (s) => (s.userEmail === chartStudent.userEmail || s.userId === chartStudent.userId) && s.classId === selectedClassId
    );

    studentTests.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    const chartLabels = studentTests.map((t) => t.testTitle || `Test ${t.id}`);

    const chartScoresPercent = studentTests.map((t) => {
      const total = t.questionTimes ? t.questionTimes.length : 0;
      return total > 0 ? ((t.score / total) * 100) : 0;
    });

    const totalSum = chartScoresPercent.reduce((sum, val) => sum + val, 0);
    const cumulativeAverage = chartScoresPercent.length > 0 ? totalSum / chartScoresPercent.length : 0;

    const barColors = chartScoresPercent.map((score) => {
      if (score >= cumulativeAverage + 5) return "rgba(75, 192, 75, 0.8)";
      if (score >= cumulativeAverage - 5 && score <= cumulativeAverage + 5) return "rgba(255, 206, 86, 0.8)";
      return "rgba(255, 99, 132, 0.8)";
    });

    const chartTooltipsData = studentTests.map((t) => {
      const total = t.questionTimes ? t.questionTimes.length : 0;
      const date = t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "N/A";
      return { correct: t.score || 0, total, date };
    });

    chartData = {
      labels: chartLabels,
      datasets: [
        {
          label: '',
          data: chartScoresPercent.map(v => v.toFixed(2)),
          backgroundColor: barColors,
        },
      ],
    };

    chartOptions = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Overall Performance for ${chartStudent.userEmail || chartStudent.userId}`,
          color: "#000",
          font: {
            family: 'Georgia',
            size: 16,
            weight: 'bold',
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const index = context.dataIndex;
              const data = chartTooltipsData[index];
              return ` ${data.correct}/${data.total} (${context.formattedValue}%) on ${data.date}`;
            },
          },
        },
        legend: {
          display: true,
          labels: {
            filter: () => false,
          },
          onClick: null,
        },
        annotation: {
          annotations: {
            cumulativeLine: {
              type: 'line',
              yMin: cumulativeAverage,
              yMax: cumulativeAverage,
              borderColor: 'rgba(0,0,0,0.8)',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                content: "Cumulative Average",
                enabled: true,
                position: 'end',
                backgroundColor: 'rgba(0,0,0,0)',
                color: '#000',
                font: {
                  family: 'Georgia',
                  size: 14,
                  weight: 'bold',
                },
                yAdjust: -10,
                xAdjust: 10,
                padding: 0,
                textAlign: 'left',
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Score Percentage (%)',
            font: {
              family: 'Georgia',
              size: 14,
              weight: 'bold',
            },
            color: '#000',
            align: 'center',
            padding: { top: 10 },
          },
          ticks: {
            font: {
              family: 'Georgia',
              size: 12,
            },
            color: '#000',
          }
        },
        x: {
          ticks: {
            font: {
              family: 'Georgia',
              size: 12,
            },
            color: '#000',
          }
        }
      }
    };
  }

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
                <th>Student</th>
                <th>Class</th>
                <th>Test Taken</th>
                <th>Score</th>
                <th>Actions</th>
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
                        className="btn btn-sm btn-info me-2"
                        onClick={() => handleShowModal(student)}
                      >
                        Test Analytics
                      </button>
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleShowChartModal(student)}
                      >
                        Student's Overall Performance
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
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            background: "rgba(0,0,0,0.5)",
            zIndex: 1050
          }}
        >
          <div
            className="modal-dialog modal-xl"
            role="document"
            style={{ maxWidth: "90vw" }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Test Analytics for {selectedStudent.userEmail || selectedStudent.userId}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body" ref={modalBodyRef}>
  <h5 style={{ fontFamily: "Georgia, serif", fontWeight: "bold", color: "black", marginBottom: "20px" }}>
    Student: {selectedStudent.userEmail || selectedStudent.userId}
  </h5>
  <h5 style={{ fontFamily: "Georgia, serif", color: "black", marginBottom: "20px" }}>
    Test: {selectedStudent.testTitle || selectedStudent.testId}
  </h5>
  {selectedStudent.answerDetails && selectedStudent.answerDetails.length > 0 ? (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Question</th>
            <th>Time Spent (s)</th>
            <th>Student's Choice</th>
            <th>Correct Answer</th>
            <th>Correct?</th>
          </tr>
        </thead>
        <tbody>
          {selectedStudent.answerDetails.map((detail, idx) => (
            <tr key={idx}>
              <td>{detail.questionIndex + 1}</td>
              <td>
                {selectedStudent.questionTimes && selectedStudent.questionTimes[detail.questionIndex] !== undefined
                  ? (selectedStudent.questionTimes[detail.questionIndex] / 1000).toFixed(2)
                  : "N/A"}
              </td>
              <td>
                {detail.selectedText
                  ? <InlineMath math={detail.selectedText} />
                  : "N/A"}
              </td>
              <td>
                {detail.correctText
                  ? <InlineMath math={detail.correctText} />
                  : "N/A"}
              </td>
              <td>
                {detail.selectedIndex === detail.correctIndex ? (
                  <span className="text-success">✔</span>
                ) : (
                  <span className="text-danger">✘</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p>No question analytics data available.</p>
  )}
</div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleDownloadPDF}>
                  Download as PDF
                </button>
                <button className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChartModal && chartData && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1051 }}
        >
          <div className="modal-dialog modal-lg" role="document">
            <div
              className="modal-content"
              style={{ fontFamily: "Georgia, serif", fontSize: "16px", color: "#000" }}
            >
              <div className="modal-header">
                <h5 className="modal-title">Student's Overall Performance</h5>
                <button type="button" className="btn-close" onClick={handleCloseChartModal}></button>
              </div>
              <div className="modal-body" ref={chartRef}>
                <Bar data={chartData} options={chartOptions} />
                <div style={{ marginTop: '10px', fontFamily: 'Georgia, serif', fontSize: '14px', color: '#000' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '2px',
                    backgroundColor: 'transparent',
                    borderTop: '2px dashed rgba(0,0,0,0.8)',
                    marginRight: '8px',
                    verticalAlign: 'middle'
                  }}></span>
                  <span>Cumulative Average Score</span>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleDownloadChartPDF}>
                  Download Chart as PDF
                </button>
                <button className="btn btn-secondary" onClick={handleCloseChartModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonitorProgress;
