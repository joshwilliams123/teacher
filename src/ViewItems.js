import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

function ViewItems() {
  const [items, setItems] = useState([]);

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

  return (
    <div className="container-fluid">
      <header className="jumbotron jumbotron-fluid bg-light text-center">
        <h1>View Items</h1>
      </header>

      <main className="container">
        <div className="row">
          {items.map((item) => (
            <div key={item.id} className="col-md-6 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{item.title}</h5>
                  <p className="card-text">{item.text}</p>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="Item" className="img-fluid mb-2" style={{ maxHeight: "150px" }} />
                  )}
                  <div>
                    <Link to={`/edit-item/${item.id}`} className="btn btn-primary btn-sm me-2">
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