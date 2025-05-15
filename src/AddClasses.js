import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, collection, addDoc, getDocs, query, where } from "./firebase";
import { deleteDoc, doc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function AddClasses() {
    const [className, setClassName] = useState("");
    const [classes, setClasses] = useState([]);
    const [user, setUser] = useState(null);
    const [successMessage, setSuccessMessage] = useState(false);

    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchClasses(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, [auth]);

    const fetchClasses = async (userId) => {
        try {
            const q = query(collection(db, "classes"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            const classList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => a.name.localeCompare(b.name));;
            setClasses(classList);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to add a class.");
            return;
        }

        if (className.trim() === "") {
            alert("Class name cannot be empty.");
            return;
        }

        try {
            await addDoc(collection(db, "classes"), {
                name: className.trim(),
                userId: user.uid,
                createdAt: new Date()
            });
            setClassName("");
            setSuccessMessage(true);
            fetchClasses(user.uid);
        } catch (error) {
            console.error("Error adding class:", error);
        }
    };

    const handleDeleteClass = async (classId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this class?");
        if (!confirmDelete) return;

        try {
            await deleteDoc(doc(db, "classes", classId));
            fetchClasses(user.uid);
        } catch (error) {
            console.error("Error deleting class:", error);
        }
    };


    return (
        <div className="container-fluid">
            <header>
                <div className="jumbotron jumbotron-fluid bg-light">
                    <div className="container text-center">
                        <h1>Add Classes</h1>
                    </div>
                </div>
            </header>
            <main className="container">
                <form onSubmit={handleAddClass}>
                    <div className="form-group mb-4">
                        <label>Class Name</label>
                        <input
                            className="form-control"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            placeholder="Enter new class name"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg">Add Class</button>
                </form>

                {successMessage && (
                    <div className="alert alert-success text-center mt-3">
                        <p>Class added successfully!</p>
                    </div>
                )}

                <hr />
                <h3>My Classes</h3>
                {classes.length === 0 ? (
                    <p>No classes found.</p>
                ) : (
                    <ul className="list-group">
                        {classes.map((cls) => (
                            <li
                                key={cls.id}
                                className="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <span>{cls.name}</span>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteClass(cls.id)}
                                    title="Delete class"
                                    style={{ marginLeft: "auto" }}
                                >
                                    &#x2715;
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}

export default AddClasses;