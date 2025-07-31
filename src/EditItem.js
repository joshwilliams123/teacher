import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

function EditItem() {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState(false);
    const [item, setItem] = useState({
        title: "",
        text: "",
        choices: ["", ""],
        correctAnswer: "a",
        imageUrl: ""
    });
    const [inputMode, setInputMode] = useState("latex"); 
    const auth = getAuth();

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const itemRef = doc(db, "items", itemId);
                const itemSnap = await getDoc(itemRef);
                if (itemSnap.exists()) {
                    const data = itemSnap.data();
                    setItem({
                        title: data.title || "",
                        text: data.text || "",
                        choices: data.choices || ["", ""],
                        correctAnswer: data.correctAnswer || "a",
                        imageUrl: data.imageUrl || ""
                    });
                }
            } catch (error) {
                console.error("Error fetching item: ", error);
            }
        };
        fetchItem();
    }, [itemId]);

    const handleInputChange = (field, value) => {
        setItem((prevItem) => ({ ...prevItem, [field]: value }));
    };

    const handleChoiceChange = (index, value) => {
        const newChoices = [...item.choices];
        newChoices[index] = value;
        setItem(prevItem => ({ ...prevItem, choices: newChoices }));
    };

    const handleAddOption = () => {
        setItem(prevItem => ({
            ...prevItem,
            choices: [...prevItem.choices, ""]
        }));
    };

    const handleDeleteOption = (indexToRemove) => {
        if (item.choices.length <= 2) return;

        const newChoices = item.choices.filter((_, index) => index !== indexToRemove);

        let newCorrectAnswer = item.correctAnswer;
        const correctIndex = item.correctAnswer.charCodeAt(0) - 97;
        if (indexToRemove < correctIndex) {
            newCorrectAnswer = String.fromCharCode(correctIndex - 1 + 97);
        } else if (indexToRemove === correctIndex) {
            newCorrectAnswer = "a";
        }

        setItem(prevItem => ({
            ...prevItem,
            choices: newChoices,
            correctAnswer: newCorrectAnswer
        }));
    };

    const convertTextToLatex = (text) => {
        if (!text.trim()) return text;
        if (text.includes("\\text{")) return text;

        const tokens = text.split(/\s+/);
        return tokens
            .map(token => (/[0-9+\-*/=]/.test(token) ? token : `\\text{${token}}`))
            .join(" \\ ");
    };

    const convertQuestionToLatex = () => {
        handleInputChange("text", convertTextToLatex(item.text));
    };

    const convertChoiceToLatex = (index) => {
        const converted = convertTextToLatex(item.choices[index]);
        handleChoiceChange(index, converted);
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error("No user is logged in");
            return;
        }

        let finalItem = { ...item };
        if (inputMode === "regular") {
            finalItem.text = convertTextToLatex(item.text);
            finalItem.choices = item.choices.map(choice => convertTextToLatex(choice));
        }

        try {
            const itemRef = doc(db, "items", itemId);
            await updateDoc(itemRef, { ...finalItem, userId: currentUser.uid });
            setSuccessMessage(true);
            setTimeout(() => navigate("/view-items"), 2000);
        } catch (error) {
            console.error("Error updating item: ", error);
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
                <div className="jumbotron jumbotron-fluid bg-light text-center">
                    <h1>Edit Item</h1>
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
                        <strong>Note:</strong> If you are using regular text, format to LaTeX prior to saving your item.
                    </div>

                    <div className="form-group mb-4">
                        <label>Question Text</label>
                        <textarea
                            className="form-control"
                            rows="5"
                            value={item.text}
                            onChange={(e) => handleInputChange("text", e.target.value)}
                            placeholder={inputMode === "regular" ? "Enter plain text" : "Enter LaTeX"}
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
                            <BlockMath>{item.text}</BlockMath>
                        </div>
                    </div>

                    <ol type="a" className="list-group">
                        {item.choices.map((choice, index) => (
                            <li key={index} className="list-group-item position-relative border rounded mb-3" style={getChoiceStyle(index)}>
                                {item.choices.length > 2 && (
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm position-absolute"
                                        style={{ top: "5px", right: "5px", zIndex: 1 }}
                                        onClick={() => handleDeleteOption(index)}
                                    >
                                        &times;
                                    </button>
                                )}
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

                    <button type="button" className="btn btn-primary btn-sm mt-3" onClick={handleAddOption}>
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

                    <div className="mb-4 mt-4">
                        <button type="submit" className="btn btn-primary btn-lg">Save Changes</button>
                    </div>
                </form>
                {successMessage && (
                    <div className="alert alert-success text-center">
                        Item updated successfully!
                    </div>
                )}
            </main>
        </div>
    );
}

export default EditItem;
