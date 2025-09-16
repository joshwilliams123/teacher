// Teachers can edit existing tests here, changes regarding images, text, and classes are saved.
// New questions added to the test are also saved to the item bank.

import React, { useState, useEffect, useRef } from "react";
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
import { db, storage } from "./firebase";
import { getAuth } from "firebase/auth";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

function EditTest() {
  const { testId } = useParams();
  const [successMessage, setSuccessMessage] = useState(false);
  const [testName, setTestName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [inputModes, setInputModes] = useState({});
  const [items, setItems] = useState([]);
  const [showAddQuestionOptions, setShowAddQuestionOptions] = useState(false);
  const [className, setClassName] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageBank, setImageBank] = useState([]);
  const [showImageBank, setShowImageBank] = useState(false);
  const [imageBankType, setImageBankType] = useState("");
  const [imageBankQIndex, setImageBankQIndex] = useState(null);
  const [imageBankChoiceIndex, setImageBankChoiceIndex] = useState(null);
  const [questionImagesFromBank, setQuestionImagesFromBank] = useState([]);
  const [choiceImagesFromBank, setChoiceImagesFromBank] = useState([]);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  const auth = getAuth();
  const navigate = useNavigate();

  const questionFileRefs = useRef([]);
  const choiceFileRefs = useRef([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    const fetchTest = async () => {
      try {
        const testRef = doc(db, "tests", testId);
        const testSnap = await getDoc(testRef);
        if (testSnap.exists()) {
          const data = testSnap.data();
          setTestName(data.testName);
          setClassName(data.classNames || []);
          const loadedQuestions = data.questions.map((q) => {
            if (q.inputMode === "regular") {
              return {
                ...q,
                text: q.originalText || q.text,
                choices: q.originalChoices || q.choices,
                questionImageUrl: q.questionImageUrl || "",
                choiceImages: q.choiceImages || []
              };
            }
            return {
              ...q,
              questionImageUrl: q.questionImageUrl || "",
              choiceImages: q.choiceImages || []
            };
          });
          setQuestions(loadedQuestions);
          const modes = {};
          data.questions.forEach((q, i) => {
            modes[i] = q.inputMode || "latex";
          });
          setInputModes(modes);
          setQuestionImagesFromBank(new Array(loadedQuestions.length).fill(false));
          setChoiceImagesFromBank(loadedQuestions.map(q => new Array((q.choices || []).length).fill(false)));
        }
      } catch (error) {}
    };

    const fetchItems = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "items"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const itemList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemList);
      } catch (error) {}
    };

    const fetchClasses = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "classes"),
          where("userId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const classList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClasses(classList);
      } catch (error) {}
    };

    const fetchImages = async () => {
      if (!user) return;
      const folderRef = ref(storage, `itemImages/${user.uid}/`);
      const result = await listAll(folderRef);
      const urls = await Promise.all(
        result.items.map(async (itemRef) => await getDownloadURL(itemRef))
      );
      setImageBank(urls);
    };

    fetchTest();
    fetchItems();
    fetchClasses();
    fetchImages();

    return () => unsubscribe();
  }, [testId, user]);

  const convertTextToLatex = (text) => {
        if (!text.trim()) return text;
        if (text.includes("\\text{")) return text;
        return text
            .split(/\n+/)
            .map(line => {
                const tokens = line.split(/\s+/);
                return tokens
                    .map(token => /[0-9+\-*/=]/.test(token) ? token : `\\text{${token}}`)
                    .join(" \\ ");
            })
            .join(" \\\\ ");
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

  const handleImageUpload = async (file, type, qIndex, cIndex = null) => {
    if (!file || !user) return;
    const storageRef = ref(storage, `itemImages/${user.uid}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    const newQuestions = [...questions];
    if (type === "question") {
      newQuestions[qIndex].questionImageUrl = url;
      setQuestions(newQuestions);
      const updatedQuestionImagesFromBank = [...questionImagesFromBank];
      updatedQuestionImagesFromBank[qIndex] = false;
      setQuestionImagesFromBank(updatedQuestionImagesFromBank);
    } else if (type === "choice" && cIndex !== null) {
      if (!newQuestions[qIndex].choiceImages) {
        newQuestions[qIndex].choiceImages = [];
      }
      newQuestions[qIndex].choiceImages[cIndex] = url;
      setQuestions(newQuestions);
      const updatedChoiceImagesFromBank = [...choiceImagesFromBank];
      if (!updatedChoiceImagesFromBank[qIndex]) {
        updatedChoiceImagesFromBank[qIndex] = [];
      }
      updatedChoiceImagesFromBank[qIndex][cIndex] = false;
      setChoiceImagesFromBank(updatedChoiceImagesFromBank);
    }
  };

  const handleDeleteQuestionImage = async (qIndex) => {
    if (questionFileRefs.current[qIndex]) {
      questionFileRefs.current[qIndex].value = "";
    }
    const newQuestions = [...questions];
    newQuestions[qIndex].questionImageUrl = "";
    setQuestions(newQuestions);
    const updatedQuestionImagesFromBank = [...questionImagesFromBank];
    updatedQuestionImagesFromBank[qIndex] = false;
    setQuestionImagesFromBank(updatedQuestionImagesFromBank);
  };

  const handleDeleteChoiceImage = async (qIndex, cIndex) => {
    if (choiceFileRefs.current[qIndex] && choiceFileRefs.current[qIndex][cIndex]) {
      choiceFileRefs.current[qIndex][cIndex].value = "";
    }
    const newQuestions = [...questions];
    if (!newQuestions[qIndex].choiceImages) {
      newQuestions[qIndex].choiceImages = [];
    }
    newQuestions[qIndex].choiceImages[cIndex] = "";
    setQuestions(newQuestions);
    const updatedChoiceImagesFromBank = [...choiceImagesFromBank];
    if (!updatedChoiceImagesFromBank[qIndex]) {
      updatedChoiceImagesFromBank[qIndex] = [];
    }
    updatedChoiceImagesFromBank[qIndex][cIndex] = false;
    setChoiceImagesFromBank(updatedChoiceImagesFromBank);
  };

  const handleAddNewQuestion = () => {
    const newQuestion = {
      title: "",
      text: "",
      choices: ["", ""],
      correctAnswer: "a",
      questionImageUrl: "",
      choiceImages: ["", ""],
      isNew: true,
    };
    setQuestions([...questions, newQuestion]);
    setInputModes((prev) => ({ ...prev, [questions.length]: "regular" }));
    setQuestionImagesFromBank(prev => [...prev, false]);
    setChoiceImagesFromBank(prev => [...prev, [false, false]]);
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
      questionImageUrl: item.questionImageUrl || "",
      choiceImages: item.choiceImages || [],
      inputMode: item.inputMode || "latex",
      isNew: false,
    };
    setQuestions([...questions, newQuestion]);
    setInputModes((prev) => ({
      ...prev,
      [questions.length]: item.inputMode || "latex",
    }));
    setQuestionImagesFromBank(prev => [...prev, false]);
    setChoiceImagesFromBank(prev => [...prev, new Array((newQuestion.choices || []).length).fill(false)]);
    setShowAddQuestionOptions(false);
  };

  const handleAddOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices.push("");
    if (!newQuestions[qIndex].choiceImages) {
      newQuestions[qIndex].choiceImages = [];
    }
    newQuestions[qIndex].choiceImages.push("");
    setQuestions(newQuestions);
    const updatedChoiceImagesFromBank = [...choiceImagesFromBank];
    if (!updatedChoiceImagesFromBank[qIndex]) {
      updatedChoiceImagesFromBank[qIndex] = [];
    }
    updatedChoiceImagesFromBank[qIndex].push(false);
    setChoiceImagesFromBank(updatedChoiceImagesFromBank);
  };

  const handleDeleteOption = (qIndex, cIndex) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].choices.length <= 2) return;
    newQuestions[qIndex].choices.splice(cIndex, 1);
    if (newQuestions[qIndex].choiceImages) {
      newQuestions[qIndex].choiceImages.splice(cIndex, 1);
    }
    const correctIndex = newQuestions[qIndex].correctAnswer.charCodeAt(0) - 97;
    if (cIndex < correctIndex) {
      newQuestions[qIndex].correctAnswer = String.fromCharCode(correctIndex - 1 + 97);
    } else if (cIndex === correctIndex) {
      newQuestions[qIndex].correctAnswer = "a";
    }
    setQuestions(newQuestions);
    const updatedChoiceImagesFromBank = [...choiceImagesFromBank];
    if (updatedChoiceImagesFromBank[qIndex]) {
      updatedChoiceImagesFromBank[qIndex].splice(cIndex, 1);
    }
    setChoiceImagesFromBank(updatedChoiceImagesFromBank);
  };

  const handleDeleteQuestion = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions.splice(qIndex, 1);
    setQuestions(newQuestions);
    const updatedQuestionImagesFromBank = [...questionImagesFromBank];
    updatedQuestionImagesFromBank.splice(qIndex, 1);
    setQuestionImagesFromBank(updatedQuestionImagesFromBank);
    const updatedChoiceImagesFromBank = [...choiceImagesFromBank];
    updatedChoiceImagesFromBank.splice(qIndex, 1);
    setChoiceImagesFromBank(updatedChoiceImagesFromBank);
  };

  const getChoiceStyle = (qIndex, cIndex) => {
    return questions[qIndex].correctAnswer ===
      String.fromCharCode(97 + cIndex)
      ? { backgroundColor: "lightgreen" }
      : {};
  };

  const toggleClassSelection = (name) => {
    setClassName((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const openImageBank = (type, qIndex, cIndex = null) => {
    setImageBankType(type);
    setImageBankQIndex(qIndex);
    setImageBankChoiceIndex(cIndex);
    setShowImageBank(true);
  };

  const handleSelectImageFromBank = (url) => {
    const newQuestions = [...questions];
    if (imageBankType === "question") {
      newQuestions[imageBankQIndex].questionImageUrl = url;
      setQuestions(newQuestions);
      const updatedQuestionImagesFromBank = [...questionImagesFromBank];
      updatedQuestionImagesFromBank[imageBankQIndex] = true;
      setQuestionImagesFromBank(updatedQuestionImagesFromBank);
    } else if (imageBankType === "choice" && imageBankChoiceIndex !== null) {
      if (!newQuestions[imageBankQIndex].choiceImages) {
        newQuestions[imageBankQIndex].choiceImages = [];
      }
      newQuestions[imageBankQIndex].choiceImages[imageBankChoiceIndex] = url;
      setQuestions(newQuestions);
      const updatedChoiceImagesFromBank = [...choiceImagesFromBank];
      if (!updatedChoiceImagesFromBank[imageBankQIndex]) {
        updatedChoiceImagesFromBank[imageBankQIndex] = [];
      }
      updatedChoiceImagesFromBank[imageBankQIndex][imageBankChoiceIndex] = true;
      setChoiceImagesFromBank(updatedChoiceImagesFromBank);
    }
    setShowImageBank(false);
    setImageBankType("");
    setImageBankQIndex(null);
    setImageBankChoiceIndex(null);
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    if (!user) return;
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
            userId: user.uid,
            createdAt: new Date(),
          });
        }
      }
      const cleanedQuestions = finalQuestions.map(({ isNew, ...rest }) => rest);
      const testRef = doc(db, "tests", testId);
      await updateDoc(testRef, {
        testName,
        classNames: className,
        questions: cleanedQuestions,
        userId: user.uid,
      });
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        navigate("/test-viewer");
      }, 2000);
    } catch (error) {}
  };

  return (
    <div className="container-fluid">
      <header className="jumbotron jumbotron-fluid bg-light text-center">
        <h1>Edit Test</h1>
      </header>
      <main className="container">
        <form onSubmit={handleSaveTest}>
          <div className="form-group mb-4" ref={dropdownRef}>
            <label htmlFor="class-name">Assign to Classes</label>
            <div
              className="form-control d-flex justify-content-between align-items-center"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              {className.length > 0 ? className.join(", ") : "Select classes"}
              <span className="caret">&#9662;</span>
            </div>
            {showDropdown && (
              <div
                className="border rounded bg-white mt-1 p-2 shadow-sm"
                style={{ position: "absolute", zIndex: 10, width: "100%" }}
              >
                {[...classes]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((cls) => (
                    <div key={cls.id} className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`class-${cls.id}`}
                        checked={className.includes(cls.name)}
                        onChange={() => toggleClassSelection(cls.name)}
                      />
                      <label className="form-check-label" htmlFor={`class-${cls.id}`}>
                        {cls.name}
                      </label>
                    </div>
                  ))}
              </div>
            )}
          </div>
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
                      <strong>Note:</strong> Enter your question and choices using LaTeX syntax.
                    </div>
                  )}
                  <div className="form-group mb-4">
                    <label>Question Image</label>
                    <br />
                    {!question.questionImageUrl ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary me-2"
                          onClick={() => questionFileRefs.current[qIndex]?.click()}
                        >
                          Add Image
                        </button>
                        <button
                          type="button"
                          className="btn btn-info"
                          onClick={() => openImageBank("question", qIndex)}
                        >
                          Select from Image Bank
                        </button>
                      </>
                    ) : (
                      <div className="position-relative d-inline-block">
                        <img
                          src={question.questionImageUrl}
                          alt="Question"
                          style={{ maxWidth: "200px", marginTop: "10px" }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0"
                          onClick={() => handleDeleteQuestionImage(qIndex)}
                        >
                          X
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={(el) => {
                        if (!questionFileRefs.current[qIndex]) {
                          questionFileRefs.current[qIndex] = el;
                        }
                      }}
                      style={{ display: "none" }}
                      onChange={(e) =>
                        handleImageUpload(e.target.files[0], "question", qIndex)
                      }
                    />
                  </div>
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
                        className="list-group-item border-0 position-relative"
                        style={getChoiceStyle(qIndex, cIndex)}
                      >
                        {question.choices.length > 2 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute top-0 end-0"
                            onClick={() => handleDeleteOption(qIndex, cIndex)}
                          >
                            X
                          </button>
                        )}
                        <textarea rows="2"
                          className="form-control mb-2"
                          placeholder={`Answer Choice ${cIndex + 1}`}
                          value={choice}
                          onChange={(e) =>
                            handleChoiceChange(qIndex, cIndex, e.target.value)
                          }
                        />
                        {!(question.choiceImages && question.choiceImages[cIndex]) ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary me-2"
                              onClick={() => {
                                if (!choiceFileRefs.current[qIndex]) {
                                  choiceFileRefs.current[qIndex] = [];
                                }
                                choiceFileRefs.current[qIndex][cIndex]?.click();
                              }}
                            >
                              Add Image
                            </button>
                            <button
                              type="button"
                              className="btn btn-info"
                              onClick={() => openImageBank("choice", qIndex, cIndex)}
                            >
                              Select from Image Bank
                            </button>
                          </>
                        ) : (
                          <div className="position-relative d-inline-block">
                            <img
                              src={question.choiceImages[cIndex]}
                              alt={`Choice ${cIndex + 1}`}
                              style={{ maxWidth: "150px", marginTop: "10px" }}
                            />
                            <button
                              type="button"
                              className="btn btn-danger btn-sm position-absolute top-0 end-0"
                              onClick={() => handleDeleteChoiceImage(qIndex, cIndex)}
                            >
                              X
                            </button>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={(el) => {
                            if (!choiceFileRefs.current[qIndex]) {
                              choiceFileRefs.current[qIndex] = [];
                            }
                            choiceFileRefs.current[qIndex][cIndex] = el;
                          }}
                          style={{ display: "none" }}
                          onChange={(e) =>
                            handleImageUpload(
                              e.target.files[0],
                              "choice",
                              qIndex,
                              cIndex
                            )
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
      {showImageBank && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Image from Bank</h5>
                <button type="button" className="btn-close" onClick={() => setShowImageBank(false)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex flex-wrap">
                  {imageBank.length === 0 && <p>No images available.</p>}
                  {imageBank.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Bank ${idx}`}
                      style={{ maxWidth: "100px", margin: "5px", cursor: "pointer", border: "2px solid #eee" }}
                      onClick={() => handleSelectImageFromBank(url)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success text-center">
          Your test was updated successfully!
        </div>
      )}
    </div>
  );
}

export default EditTest;