import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, addDoc, collection } from "./firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function CreateItem() {
    const [item, setItem] = useState({
        title: "",
        text: "",
        choices: ["", ""], 
        correctAnswer: "a",
        imageUrl: ""
    });
    const [successMessage, setSuccessMessage] = useState(false);
    const [user, setUser] = useState(null);

    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    const handleInputChange = (field, value) => {
        setItem(prevItem => ({ ...prevItem, [field]: value }));
    };

    const handleChoiceChange = (index, value) => {
        const newChoices = [...item.choices];
        newChoices[index] = value;
        setItem(prevItem => ({ ...prevItem, choices: newChoices }));
    };

    const handleDeleteChoice = (index) => {
        if (item.choices.length > 2) { 
            const newChoices = item.choices.filter((_, i) => i !== index);
            setItem(prevItem => ({
                ...prevItem,
                choices: newChoices,
                correctAnswer: newChoices.length > 0 ? "a" : "" 
            }));
        }
    };


    const handleAddOption = () => {
        setItem(prevItem => ({ ...prevItem, choices: [...prevItem.choices, ""] }));
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to save items.");
            return;
        }

        try {
            await addDoc(collection(db, "items"), {
                ...item,
                userId: user.uid,
                createdAt: new Date()
            });
            setSuccessMessage(true);
            navigate("/view-items");
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const getChoiceStyle = (index) => {
        return item.correctAnswer === String.fromCharCode(97 + index)
            ? { backgroundColor: "lightgreen" }
            : {};
    };

    return (
        <div className="container-fluid">
            <header>
                <div className="jumbotron jumbotron-fluid bg-light">
                    <div className="container text-center">
                        <h1>Create Item</h1>
                    </div>
                </div>
            </header>
            <main className="container">
                <form onSubmit={handleSaveItem}>
                    <div className="form-group mb-4">
                        <label>Question Title</label>
                        <input
                            className="form-control"
                            value={item.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label>Question Text</label>
                        <textarea
                            className="form-control"
                            rows="5"
                            value={item.text}
                            onChange={(e) => handleInputChange("text", e.target.value)}
                        />
                        <div className="mt-2 p-2 border" style={{ overflowX: "auto", wordWrap: "break-word", maxWidth: "100%", whiteSpace: "normal" }}>
                            <BlockMath>{item.text}</BlockMath>
                        </div>
                    </div>
                    <ol type="a" className="list-group">
                        {item.choices.map((choice, index) => (
                            <li key={index} className="list-group-item border-0 position-relative" style={getChoiceStyle(index)}>
                                <button 
                                    type="button" 
                                    className="btn btn-danger btn-sm position-absolute top-0 end-0" 
                                    onClick={() => handleDeleteChoice(index)}
                                >
                                    X
                                </button>
                                <input
                                    className="form-control mb-2"
                                    placeholder={`Answer Choice ${index + 1}`}
                                    value={choice}
                                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                                />
                                <div className="mt-2 p-2 border" style={{
                                    overflowX: "auto",
                                    wordWrap: "break-word",
                                    maxWidth: "100%",
                                    whiteSpace: "normal"
                                }}>
                                    <InlineMath>{choice}</InlineMath>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <button
                        type="button"
                        className="btn btn-primary btn-sm mt-3"
                        onClick={handleAddOption}
                    >
                        Add Option
                    </button>

                    <h6 className="mt-3">Correct Answer:</h6>
                    <select
                        className="form-select"
                        value={item.correctAnswer}
                        onChange={(e) => handleInputChange("correctAnswer", e.target.value)}
                    >
                        {item.choices.map((_, index) => (
                            <option key={index} value={String.fromCharCode(97 + index)}>
                                {String.fromCharCode(97 + index)}
                            </option>
                        ))}
                    </select>

                    <div className="mb-4 mt-3">
                        <button type="submit" className="btn btn-primary btn-lg">Save Item</button>
                    </div>
                </form>

                {successMessage && (
                    <div className="alert alert-success text-center">
                        <p>Your item was saved successfully!</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CreateItem;