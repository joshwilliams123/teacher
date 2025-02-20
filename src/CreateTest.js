import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { db, addDoc, collection, getDocs } from "./firebase";

function CreateTest() {
  const [successMessage, setSuccessMessage] = useState(false);
  const [testName, setTestName] = useState("");
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const itemList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemList);
      } catch (error) {
        console.error("Error fetching items: ", error);
      }
    };
    fetchItems();
  }, []);

  const handleSaveTest = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "tests"), {
        testName: testName,
        questions: selectedItems
      });
      setSuccessMessage(true);
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
            <h1>Create, Edit, and Publish Tests</h1>
          </div>
        </div>
      </header>
      <main className="container">
        <form onSubmit={handleSaveTest}>
          <div className="form-group mb-4">
            <label htmlFor="test-name">Test Name</label>
            <input
              id="test-name"
              className="form-control"
              placeholder="Ex: The Normal Curve"
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
                  <p>{item.text}</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
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