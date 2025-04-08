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

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            const base64String = reader.result;
            setItem(prevItem => ({ ...prevItem, imageUrl: base64String }));
        };
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

    const handleSaveItem = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error("No user is logged in");
            return;
        }
        try {
            const itemRef = doc(db, "items", itemId);
            await updateDoc(itemRef, { ...item, userId: currentUser.uid });
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
                    <div className="mb-3">
                        <label>Upload Question Image:</label>
                        <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />
                        {item.imageUrl && (
                            <div className="mt-2">
                                <img src={item.imageUrl} alt="Question" className="img-fluid" style={{ maxHeight: "200px" }} />
                            </div>
                        )}
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
                                        aria-label={`Delete choice ${String.fromCharCode(97 + index)}`}
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