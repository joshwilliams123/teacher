// Provides teachers the ability to create tests by selecting from existing items and assigning them to classes

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { db, addDoc, collection, getDocs, query, where } from "./firebase";
import { getAuth } from "firebase/auth";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

function CreateTest() {
  const [successMessage, setSuccessMessage] = useState(false);
  const [className, setClassName] = useState([]);
  const [classes, setClasses] = useState([]);
  const [testName, setTestName] = useState("");
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [classError, setClassError] = useState(false);
  const [testNameError, setTestNameError] = useState(false);
  const dropdownRef = useRef(null);
  const classErrorRef = useRef(null);
  const testNameErrorRef = useRef(null);

  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const itemQuery = query(collection(db, "items"), where("userId", "==", currentUser.uid));
        const itemSnapshot = await getDocs(itemQuery);
        const itemList = itemSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemList);

        const classQuery = query(collection(db, "classes"), where("userId", "==", currentUser.uid));
        const classSnapshot = await getDocs(classQuery);
        const classList = classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClasses(classList);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, [auth]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (classError && classErrorRef.current) {
      classErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (testNameError && testNameErrorRef.current) {
      testNameErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [classError, testNameError]);

  const handleSaveTest = async (e) => {
    e.preventDefault();
    setClassError(false);
    setTestNameError(false);
    const currentUser = auth.currentUser;

    if (!currentUser) return;

    if (className.length === 0) {
      setClassError(true);
      return;
    }
    if (!testName.trim()) {
      setTestNameError(true);
      return;
    }

    try {
      await addDoc(collection(db, "tests"), {
        classNames: className,
        testName: testName,
        questions: selectedItems,
        userId: currentUser.uid,
      });
      setSuccessMessage(true);
      navigate("/test-viewer");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const toggleClassSelection = (name) => {
    setClassName(prev =>
      prev.includes(name)
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
  };

  const handleItemSelection = (item) => {
    setSelectedItems(prevSelected =>
      prevSelected.find(q => q.id === item.id) ? prevSelected : [...prevSelected, item]
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(prevSelected => prevSelected.filter(q => q.id !== id));
  };

  const isItemSelected = (itemId) => {
    return selectedItems.some(item => item.id === itemId);
  };

  return (
    <div className="container-fluid">
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Create Tests</h1>
          </div>
        </div>
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
                  .map(cls => (
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
            {classError && (
              <div className="text-danger mt-2" ref={classErrorRef}>
                You must assign a test to at least one class.
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
              ref={testNameErrorRef}
            />
            {testNameError && (
              <div className="text-danger mt-2">
                Test name is required.
              </div>
            )}
          </div>

          <div className="mb-4">
            <h5>Available Items</h5>
            <ul className="list-group">
              {items.map((item) => {
                const added = isItemSelected(item.id);
                return (
                  <li key={item.id} className="list-group-item">
                    <strong>{item.title}</strong>
                    <div className="border rounded mt-2 bg-light" style={{ maxHeight: "150px", overflowY: "auto" }}>
                      <div className="p-2">
                        <InlineMath>{item.text}</InlineMath>
                      </div>
                    </div>
                    {item.choices && (
                      <div className="border rounded mt-2 bg-light" style={{ maxHeight: "150px", overflowY: "auto" }}>
                        <ol type="a" className="list-group list-group-flush">
                          {item.choices.map((choice, index) => (
                            <li
                              key={index}
                              className={`list-group-item ${item.correctAnswer === String.fromCharCode(97 + index) ? "bg-success text-white" : ""}`}
                            >
                              <InlineMath math={choice} />
                              {item.choiceImages?.[index] && (
                                <div className="mt-2">
                                  <img
                                    src={item.choiceImages[index]}
                                    alt={`Choice ${index + 1}`}
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
                    <button
                      type="button"
                      className={`btn btn-sm mt-2 ${added ? "btn-success" : "btn-primary"}`}
                      disabled={added}
                      onClick={() => handleItemSelection(item)}
                    >
                      {added ? "Added" : "Add to Test"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mb-4">
            <h5>Selected Items</h5>
            <ul className="list-group">
              {selectedItems.map((item) => {
                const correctIndex = item.correctAnswer
                  ? item.correctAnswer.toLowerCase().charCodeAt(0) - 97
                  : null;
                const correctChoice = correctIndex !== null ? item.choices?.[correctIndex] : null;

                return (
                  <li key={item.id} className="list-group-item">
                    <strong>{item.title}</strong>
                    <div className="border rounded mt-2 bg-light" style={{ maxHeight: "150px", overflowY: "auto" }}>
                      <div className="p-2">
                        <InlineMath>{item.text}</InlineMath>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span>Correct Answer:</span>
                      {
                        <span className="ms-2">
                          <div className="border rounded mt-2 bg-light" style={{ maxHeight: "150px", overflowY: "auto" }}>
                            <div className="p-2">
                              <InlineMath>{correctChoice}</InlineMath>
                            </div>
                          </div>
                        </span>
                      }
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm mt-2"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mb-4">
            <button type="submit" className="btn btn-primary btn-lg">
              Save Test
            </button>
          </div>
        </form>

        {successMessage && (
          <div className="alert alert-success text-center">
            <p>Your test was saved successfully! To publish your test, go to the View Tests page.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default CreateTest;
