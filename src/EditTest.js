import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function EditTest() {
  const { testId } = useParams();
  const [successMessage, setSuccessMessage] = useState(false);
  const [testName, setTestName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [inputModes, setInputModes] = useState({});
  const [items, setItems] = useState([]);
  const [showAddQuestionOptions, setShowAddQuestionOptions] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const testRef = doc(db, "tests", testId);
        const testSnap = await getDoc(testRef);
        if (testSnap.exists()) {
          const data = testSnap.data();
          setTestName(data.testName);

          const loadedQuestions = data.questions.map((q) => {
            if (q.inputMode === "regular") {
              return {
                ...q,
                text: q.originalText || q.text,
                choices: q.originalChoices || q.choices,
              };
            }
            return q;
          });

          setQuestions(loadedQuestions);

          const modes = {};
          data.questions.forEach((q, i) => {
            modes[i] = q.inputMode || "latex";
          });
          setInputModes(modes);
        }
      } catch (error) {
        console.error("Error fetching test: ", error);
      }
    };

    const fetchItems = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, "items"),
          where("userId", "==", currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const itemList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemList);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchTest();
    fetchItems();
  }, [testId]);

  const convertTextToLatex = (text) => {
    if (!text.trim()) return text;
    if (text.includes("\\text{")) return text;

    const tokens = text.split(/\s+/);
    return tokens
      .map((token) => (/[0-9+\-*/=]/.test(token) ? token : `\\text{${token}}`))
      .join(" \\ ");
  };

  const handleInputChange = (qIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex][field] = value;
    setQuestions(newQuestions);
  };

  const handleChoiceChange = (qIndex, cIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices[cIndex] = value;
    setQuestions(newQuestions);
  };

  const handleAddNewQuestion = () => {
    const newQuestion = {
      title: "",
      text: "",
      choices: ["", ""],
      correctAnswer: "a",
      isNew: true,
    };
    setQuestions([...questions, newQuestion]);
    setInputModes((prev) => ({ ...prev, [questions.length]: "regular" }));
    setShowAddQuestionOptions(false);
  };

  const handleAddQuestionFromItem = (item) => {
    const newQuestion = {
      title: item.title || "",
      text: item.inputMode === "regular" ? item.originalText : item.text,
      choices:
        item.inputMode === "regular"
          ? item.originalChoices || []
          : item.choices || [],
      correctAnswer: item.correctAnswer || "a",
      inputMode: item.inputMode || "latex",
      isNew: false,
    };
    setQuestions([...questions, newQuestion]);
    setInputModes((prev) => ({
      ...prev,
      [questions.length]: item.inputMode || "latex",
    }));
    setShowAddQuestionOptions(false);
  };

  const handleAddOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices.push("");
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions.splice(qIndex, 1);
    setQuestions(newQuestions);
  };

  const getChoiceStyle = (qIndex, cIndex) => {
    return questions[qIndex].correctAnswer ===
      String.fromCharCode(97 + cIndex)
      ? { backgroundColor: "lightgreen" }
      : {};
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("No user is logged in");
      return;
    }

    const finalQuestions = questions.map((q, qIndex) => {
      const mode = inputModes[qIndex];
      if (mode === "regular") {
        return {
          ...q,
          text: convertTextToLatex(q.text),
          choices: q.choices.map((choice) => convertTextToLatex(choice)),
          originalText: q.text,
          originalChoices: [...q.choices],
          inputMode: "regular",
        };
      } else {
        return {
          ...q,
          originalText: q.text,
          originalChoices: [...q.choices],
          inputMode: "latex",
        };
      }
    });

    const newQuestions = finalQuestions.filter((q) => q.isNew);

    try {
      for (const q of newQuestions) {
        if (q.text.trim() && q.choices.filter((c) => c.trim()).length >= 2) {
          const { isNew, ...itemData } = q;
          await addDoc(collection(db, "items"), {
            ...itemData,
            userId: currentUser.uid,
            createdAt: new Date(),
          });
        }
      }
      const cleanedQuestions = finalQuestions.map(({ isNew, ...rest }) => rest);

      const testRef = doc(db, "tests", testId);
      await updateDoc(testRef, {
        testName,
        questions: cleanedQuestions,
        userId: currentUser.uid,
      });
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        navigate("/test-viewer");
      }, 2000);
    } catch (error) {
      console.error("Error updating test: ", error);
    }
  };

  return (
    <div className="container-fluid">
      <header className="jumbotron jumbotron-fluid bg-light text-center">
        <h1>Edit Test</h1>
      </header>

      <main className="container">
        <form onSubmit={handleSaveTest}>
          <div className="form-group mb-4">
            <label htmlFor="test-name">Test Name</label>
            <input
              id="test-name"
              className="form-control"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          {questions.map((question, qIndex) => (
            <div key={qIndex} className="form-group mb-4">
              <div className="card">
                <div className="card-body position-relative">
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                    onClick={() => handleDeleteQuestion(qIndex)}
                  >
                    X
                  </button>

                  <h3 className="card-title">{qIndex + 1}.</h3>

                  <input
                    className="form-control mb-3"
                    placeholder="Question Title (optional)"
                    value={question.title}
                    onChange={(e) =>
                      handleInputChange(qIndex, "title", e.target.value)
                    }
                  />

                  <div className="mb-2">
                    <label className="me-3">Input Mode:</label>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`inputMode-${qIndex}`}
                        value="regular"
                        checked={inputModes[qIndex] === "regular"}
                        onChange={() =>
                          setInputModes((prev) => ({
                            ...prev,
                            [qIndex]: "regular",
                          }))
                        }
                      />
                      <label className="form-check-label">Regular</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name={`inputMode-${qIndex}`}
                        value="latex"
                        checked={inputModes[qIndex] === "latex"}
                        onChange={() =>
                          setInputModes((prev) => ({
                            ...prev,
                            [qIndex]: "latex",
                          }))
                        }
                      />
                      <label className="form-check-label">LaTeX</label>
                    </div>
                  </div>

                  {inputModes[qIndex] === "latex" && (
                    <div className="alert alert-info py-2">
                      <strong>Note:</strong> Enter your question and choices
                      using LaTeX syntax.
                    </div>
                  )}

                  <textarea
                    className="form-control mb-2"
                    rows="4"
                    value={question.text}
                    onChange={(e) =>
                      handleInputChange(qIndex, "text", e.target.value)
                    }
                    placeholder={
                      inputModes[qIndex] === "regular"
                        ? "Enter plain text"
                        : "Enter LaTeX"
                    }
                  />

                  {inputModes[qIndex] === "latex" && (
                    <div
                      className="mt-2 p-2 border bg-light"
                      style={{
                        maxHeight: "auto",
                        overflowX: "auto",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <BlockMath>{question.text}</BlockMath>
                    </div>
                  )}

                  <ol type="a" className="list-group mt-3">
                    {question.choices.map((choice, cIndex) => (
                      <li
                        key={cIndex}
                        className="list-group-item border-0"
                        style={getChoiceStyle(qIndex, cIndex)}
                      >
                        <input
                          className="form-control mb-2"
                          placeholder={`Answer Choice ${cIndex + 1}`}
                          value={choice}
                          onChange={(e) =>
                            handleChoiceChange(qIndex, cIndex, e.target.value)
                          }
                        />

                        {inputModes[qIndex] === "latex" && (
                          <div
                            className="mt-2 p-2 border bg-light"
                            style={{
                              maxHeight: "auto",
                              overflowX: "auto",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <InlineMath>{choice}</InlineMath>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm mt-3"
                    onClick={() => handleAddOption(qIndex)}
                  >
                    Add Option
                  </button>

                  <h6 className="mt-3">Correct Answer:</h6>
                  <select
                    className="form-select"
                    value={question.correctAnswer}
                    onChange={(e) =>
                      handleInputChange(qIndex, "correctAnswer", e.target.value)
                    }
                  >
                    {question.choices.map((_, index) => (
                      <option
                        key={index}
                        value={String.fromCharCode(97 + index)}
                      >
                        {String.fromCharCode(97 + index)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {showAddQuestionOptions && (
            <div className="card p-3 mb-4">
              <h5>Add Question</h5>
              <button
                className="btn btn-outline-primary mb-3"
                onClick={handleAddNewQuestion}
              >
                Create New Question
              </button>

              <h6>Or choose from Item Bank:</h6>
              <ul
                className="list-group"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                {items.map((item) => (
                  <li key={item.id} className="list-group-item">
                    <strong>{item.title}</strong>
                    <div className="border rounded mt-2 bg-light p-2">
                      <InlineMath>{item.text}</InlineMath>
                    </div>
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      onClick={() => handleAddQuestionFromItem(item)}
                    >
                      Add This Question
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-4">
            <button
              type="button"
              className="btn btn-primary btn-lg me-2"
              onClick={() => setShowAddQuestionOptions(!showAddQuestionOptions)}
            >
              Add Question
            </button>
            <button type="submit" className="btn btn-success btn-lg">
              Save Changes
            </button>
          </div>
        </form>
      </main>

      {successMessage && (
        <div className="alert alert-success fixed-bottom m-3 text-center">
          Your test was updated successfully!
        </div>
      )}
    </div>
  );
}

export default EditTest;
