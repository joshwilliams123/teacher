import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "./firebase";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

function EditItem() {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState(false);
    const [item, setItem] = useState({
        title: "",
        text: "",
        choices: ["", ""],
        correctAnswer: "a",
        questionImageUrl: "",
        choiceImages: []
    });
    const [inputMode, setInputMode] = useState("latex");
    const [newQuestionImage, setNewQuestionImage] = useState(null);
    const [newChoiceImages, setNewChoiceImages] = useState([]);
    const auth = getAuth();

    const questionFileRef = useRef(null);
    const choiceFileRefs = useRef([]);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const itemRef = doc(db, "items", itemId);
                const itemSnap = await getDoc(itemRef);
                if (itemSnap.exists()) {
                    const data = itemSnap.data();
                    setItem({
                        title: data.title || "",
                        text: data.inputMode === "regular" ? data.originalText || "" : data.text || "",
                        choices: data.inputMode === "regular" ? data.originalChoices || ["", ""] : data.choices || ["", ""],
                        correctAnswer: data.correctAnswer || "a",
                        questionImageUrl: data.questionImageUrl || "",
                        choiceImages: data.choiceImages || []
                    });
                    setNewChoiceImages(new Array((data.choices || ["", ""]).length).fill(null));
                    setInputMode(data.inputMode || "latex");
                }
            } catch (error) {
                console.error("Error fetching item:", error);
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
            choices: [...prevItem.choices, ""],
            choiceImages: [...prevItem.choiceImages, ""]
        }));
        setNewChoiceImages(prev => [...prev, null]);
    };

    const handleDeleteOption = (indexToRemove) => {
        if (item.choices.length <= 2) return;
        const newChoices = item.choices.filter((_, index) => index !== indexToRemove);
        const newChoiceImagesArr = item.choiceImages.filter((_, index) => index !== indexToRemove);
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
            choiceImages: newChoiceImagesArr,
            correctAnswer: newCorrectAnswer
        }));
        setNewChoiceImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleDeleteQuestionImage = async () => {
        if (item.questionImageUrl) {
            try {
                const imageRef = ref(storage, item.questionImageUrl);
                await deleteObject(imageRef);
            } catch (error) {
                console.error("Error deleting question image from storage:", error);
            }
        }
        if (questionFileRef.current) {
            questionFileRef.current.value = "";
        }
        setItem(prevItem => ({ ...prevItem, questionImageUrl: "" }));
        setNewQuestionImage(null);
    };

    const handleDeleteChoiceImage = async (index) => {
        if (item.choiceImages[index]) {
            try {
                const imageRef = ref(storage, item.choiceImages[index]);
                await deleteObject(imageRef);
            } catch (error) {
                console.error("Error deleting choice image from storage:", error);
            }
        }
        if (choiceFileRefs.current[index]) {
            choiceFileRefs.current[index].value = "";
        }
        const newChoiceImagesArr = [...item.choiceImages];
        newChoiceImagesArr[index] = "";
        setItem(prevItem => ({ ...prevItem, choiceImages: newChoiceImagesArr }));
        const updatedNewChoiceImages = [...newChoiceImages];
        updatedNewChoiceImages[index] = null;
        setNewChoiceImages(updatedNewChoiceImages);
    };

    const convertTextToLatex = (text) => {
        if (!text.trim()) return text;
        if (text.includes("\\text{")) return text;
        const tokens = text.split(/\s+/);
        return tokens.map(token => (/[0-9+\-*/=]/.test(token) ? token : `\\text{${token}}`)).join(" \\ ");
    };

    const handleQuestionImageChange = (e) => {
        if (e.target.files[0]) {
            setNewQuestionImage(e.target.files[0]);
        }
    };

    const handleChoiceImageChange = (index, file) => {
        const updatedNewChoiceImages = [...newChoiceImages];
        updatedNewChoiceImages[index] = file;
        setNewChoiceImages(updatedNewChoiceImages);
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        let finalItem = { ...item };

        if (inputMode === "regular") {
            finalItem.originalText = item.text;
            finalItem.originalChoices = [...item.choices];
            finalItem.text = convertTextToLatex(item.text);
            finalItem.choices = item.choices.map(choice => convertTextToLatex(choice));
        } else {
            finalItem.originalText = item.text;
            finalItem.originalChoices = [...item.choices];
        }

        if (newQuestionImage) {
            const imageRef = ref(storage, `itemImages/${Date.now()}-${newQuestionImage.name}`);
            await uploadBytes(imageRef, newQuestionImage);
            const downloadURL = await getDownloadURL(imageRef);
            finalItem.questionImageUrl = downloadURL;
        }

        const updatedChoiceImages = [...finalItem.choiceImages];
        for (let i = 0; i < newChoiceImages.length; i++) {
            if (newChoiceImages[i]) {
                const imageRef = ref(storage, `itemImages/${Date.now()}-${newChoiceImages[i].name}`);
                await uploadBytes(imageRef, newChoiceImages[i]);
                const downloadURL = await getDownloadURL(imageRef);
                updatedChoiceImages[i] = downloadURL;
            }
        }
        finalItem.choiceImages = updatedChoiceImages;

        try {
            const itemRef = doc(db, "items", itemId);
            await updateDoc(itemRef, {
                ...finalItem,
                userId: currentUser.uid,
                inputMode: inputMode
            });
            setSuccessMessage(true);
            setTimeout(() => navigate("/view-items"), 2000);
        } catch (error) {
            console.error("Error updating item:", error);
        }
    };

    const getChoiceStyle = (index) => {
        return item.correctAnswer === String.fromCharCode(97 + index) ? { backgroundColor: "lightgreen" } : {};
    };

    const hasQuestionImage = item.questionImageUrl || newQuestionImage;
    const hasChoiceImage = (index) => item.choiceImages[index] || newChoiceImages[index];

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
                                value="regular"
                                checked={inputMode === "regular"}
                                onChange={() => setInputMode("regular")}
                            />
                            <label className="form-check-label">Regular</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="inputMode"
                                value="latex"
                                checked={inputMode === "latex"}
                                onChange={() => setInputMode("latex")}
                            />
                            <label className="form-check-label">LaTeX</label>
                        </div>
                    </div>
                    {inputMode === "latex" && (
                        <div className="alert alert-info py-2 mb-3">
                            <strong>Note:</strong> Enter your question and choices using proper LaTeX syntax.
                        </div>
                    )}
                    <div className="form-group mb-4">
                        <label>Question Text</label>
                        <textarea
                            className="form-control"
                            rows="5"
                            value={item.text}
                            onChange={(e) => handleInputChange("text", e.target.value)}
                            placeholder={inputMode === "regular" ? "Enter plain text" : "Enter LaTeX"}
                        />
                        {inputMode === "latex" && (
                            <div className="mt-3 p-3 border bg-light">
                                <strong>Preview:</strong>
                                <BlockMath>{item.text}</BlockMath>
                            </div>
                        )}
                    </div>
                    <div className="form-group mb-4">
                        <label>Question Image</label>
                        <br />
                        {!hasQuestionImage ? (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => questionFileRef.current.click()}
                            >
                                Add Image
                            </button>
                        ) : (
                            <div className="position-relative d-inline-block">
                                {newQuestionImage ? (
                                    <img src={URL.createObjectURL(newQuestionImage)} alt="Preview" className="img-fluid rounded" style={{ maxHeight: "200px" }} />
                                ) : (
                                    <img src={item.questionImageUrl} alt="Current" className="img-fluid rounded" style={{ maxHeight: "200px" }} />
                                )}
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                    onClick={handleDeleteQuestionImage}
                                >
                                    X
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            ref={questionFileRef}
                            style={{ display: "none" }}
                            onChange={handleQuestionImageChange}
                        />
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
                                {inputMode === "latex" && (
                                    <div className="mt-2 p-2 border bg-light">
                                        <InlineMath>{choice}</InlineMath>
                                    </div>
                                )}
                                {!hasChoiceImage(index) ? (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => choiceFileRefs.current[index].click()}
                                    >
                                        Add Image
                                    </button>
                                ) : (
                                    <div className="position-relative d-inline-block">
                                        {newChoiceImages[index] ? (
                                            <img src={URL.createObjectURL(newChoiceImages[index])} alt={`Choice ${index + 1} Preview`} className="img-fluid rounded" style={{ maxHeight: "150px" }} />
                                        ) : (
                                            <img src={item.choiceImages[index]} alt={`Choice ${index + 1}`} className="img-fluid rounded" style={{ maxHeight: "150px" }} />
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                            onClick={() => handleDeleteChoiceImage(index)}
                                        >
                                            X
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={(el) => choiceFileRefs.current[index] = el}
                                    style={{ display: "none" }}
                                    onChange={(e) => handleChoiceImageChange(index, e.target.files[0])}
                                />
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