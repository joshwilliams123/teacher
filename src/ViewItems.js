import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { db } from "./firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function ViewItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const fetchItems = async () => {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.log("No user is logged in");
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, "items"), where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        const itemList = querySnapshot.docs.map((d) => ({
          id: d.id.toString(),
          ...d.data(),
        }));

        setItems(itemList);
      } catch (error) {
        console.error("Error fetching items: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [auth]);

  const handleDeleteItem = async (itemId) => {
    try {
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        console.error("No authenticated user found");
        return;
      }


      await deleteDoc(doc(db, "items", String(itemId)));
      setItems((prevItems) => prevItems.filter((item) => item.id !== String(itemId)));
    } catch (error) {
      console.error("Error deleting item: ", error);
    }
  };


  if (loading) {
    return <div className="text-center mt-5">Loading items...</div>;
  }

  if (items.length === 0) {
    return <div className="text-center mt-5">No items found.</div>;
  }

  return (
    <div className="container-fluid">
      <header className="jumbotron jumbotron-fluid bg-light text-center">
        <h1>View & Edit Items</h1>
      </header>

      <main className="container">
        <div className="row">
          {items.map((item) => (
            <div key={item.id} className="col-md-6 mb-4">
              <div className="card position-relative">
                <button
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  X
                </button>

                <div className="card-body">
                  <h5 className="card-title">{item.title}</h5>
                  <p className="card-text">
                    <InlineMath math={item.text || ""} />
                  </p>

                  {item.questionImageUrl && (
                    <img
                      src={item.questionImageUrl}
                      alt="Item"
                      className="img-fluid mb-2"
                      style={{ maxHeight: "150px" }}
                    />
                  )}

                  {item.choices && item.choices.length > 0 && (
                    <div
                      className="border rounded p-2 mt-3"
                      style={{
                        maxHeight: "170px",
                        overflowY: "auto",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <ol type="a" className="list-group list-group-flush">
                        {item.choices.map((choice, index) => (
                          <li
                            key={index}
                            className={`list-group-item ${item.correctAnswer === String.fromCharCode(97 + index)
                              ? "bg-success text-white"
                              : ""
                              }`}
                            style={{
                              border: "none",
                              padding: "8px",
                            }}
                          >
                            <InlineMath math={choice || ""} />
                            {item.choiceImages && item.choiceImages[index] && (
                              <div className="mt-2">
                                <img
                                  src={item.choiceImages[index]}
                                  alt={`Choice ${index + 1}`}
                                  className="img-fluid rounded"
                                  style={{ maxHeight: "80px", objectFit: "contain" }}
                                />
                              </div>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="mt-3">
                    <Link
                      to={`/edit-item/${encodeURIComponent(item.id)}`}
                      className="btn btn-primary btn-sm me-2"
                    >
                      Edit Item
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ViewItems;
