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
    const [inputMode, setInputMode] = useState("regular"); 

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

        let finalItem = { ...item };

        if (inputMode === "regular") {
            finalItem.text = convertTextToLatex(item.text);

            finalItem.choices = item.choices.map(choice => convertTextToLatex(choice));
        }

        try {
            await addDoc(collection(db, "items"), {
                ...finalItem,
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

    const convertTextToLatex = (text) => {
        if (!text.trim()) return text;

        if (text.includes("\\text{")) return text;

        const tokens = text.split(/\s+/); 
        return tokens
            .map(token => {
                return /[0-9+\-*/=]/.test(token) ? token : `\\text{${token}}`;
            })
            .join(" \\ "); 
    };

    const convertQuestionToLatex = () => {
        handleInputChange("text", convertTextToLatex(item.text));
    };

    const convertChoiceToLatex = (index) => {
        const convertedChoice = convertTextToLatex(item.choices[index]);
        handleChoiceChange(index, convertedChoice);
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

                    <div className="mb-3">
                        <label className="me-3">Input Mode:</label>
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="inputMode"
                                id="regularMode"
                                value="regular"
                                checked={inputMode === "regular"}
                                onChange={() => setInputMode("regular")}
                            />
                            <label className="form-check-label" htmlFor="regularMode">
                                Regular
                            </label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="inputMode"
                                id="latexMode"
                                value="latex"
                                checked={inputMode === "latex"}
                                onChange={() => setInputMode("latex")}
                            />
                            <label className="form-check-label" htmlFor="latexMode">
                                LaTeX
                            </label>
                        </div>
                    </div>

                    <div className="alert alert-info py-2 mb-3">
                        <strong>Note:</strong> If you are using regular text, format everything to LaTeX prior to saving your item.
                    </div>

                    <div className="form-group mb-4">
                        <label>Question Text</label>
                        <textarea
                            className="form-control"
                            rows="5"
                            value={item.text}
                            onChange={(e) => handleInputChange("text", e.target.value)}
                            placeholder={inputMode === "regular" ? "Enter question in plain text" : "Enter LaTeX formatted question"}
                        />
                        {inputMode === "regular" && (
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm mt-2"
                                onClick={convertQuestionToLatex}
                            >
                                Convert Question to LaTeX
                            </button>
                        )}

                        <div className="mt-3 p-3 border bg-light">
                            <strong>Preview:</strong>
                            <div style={{ overflowX: "auto", whiteSpace: "normal" }}>
                                <BlockMath>{item.text}</BlockMath>
                            </div>
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
                                {inputMode === "regular" && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm mb-2"
                                        onClick={() => convertChoiceToLatex(index)}
                                    >
                                        Convert to LaTeX
                                    </button>
                                )}
                                <div className="mt-2 p-2 border bg-light">
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
