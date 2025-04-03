import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { db, addDoc, collection, getDocs, query, where } from "./firebase";
import { getAuth } from "firebase/auth"; 
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

function CreateTest() {
  const [successMessage, setSuccessMessage] = useState(false);
  const [className, setClassName] = useState("");  
  const [testName, setTestName] = useState("");
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const auth = getAuth();  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const currentUser = auth.currentUser; 
        if (!currentUser) {
          console.error("No user is logged in");
          return;
        }

        const q = query(collection(db, "items"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const itemList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemList);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };
    fetchItems();
  }, [auth]);

  const handleSaveTest = async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;  
    
    if (!currentUser) {
      console.error("No user is logged in");
      return; 
    }

    try {
      await addDoc(collection(db, "tests"), {
        className: className,  
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

  const handleItemSelection = (item) => {
    setSelectedItems(prevSelected =>
      prevSelected.find(q => q.id === item.id) ? prevSelected : [...prevSelected, item]
    );
  };

  const handleRemoveItem = (id) => {
    setSelectedItems(prevSelected => prevSelected.filter(q => q.id !== id));
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
          
          <div className="form-group mb-4">
            <label htmlFor="class-name">Class Name</label>
            <input
              id="class-name"
              className="form-control"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
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

          <div className="mb-4">
            <h5>Available Items</h5>
            <ul className="list-group">
              {items.map((item) => (
                <li key={item.id} className="list-group-item">
                  <strong>{item.title}</strong>
                  <p><InlineMath math={item.text} /></p>

                  {item.choices && item.choices.length > 0 && (
                    <div 
                      className="border rounded mt-2"
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        backgroundColor: "#f1f1f1"
                      }}
                    >
                      <ol type="a" className="list-group list-group-flush">
                        {item.choices.map((choice, index) => (
                          <li
                            key={index}
                            className={`list-group-item ${item.correctAnswer === String.fromCharCode(97 + index) ? "bg-success text-white" : ""}`}
                          >
                             <InlineMath math={choice} />
                            {item.choiceImages && item.choiceImages[index] && (
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
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => handleItemSelection(item)}
                  >
                    Add to Test
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h5>Selected Items</h5>
            <ul className="list-group">
              {selectedItems.map((item) => (
                <li key={item.id} className="list-group-item">
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
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