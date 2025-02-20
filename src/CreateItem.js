import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { db, addDoc, collection, storage, ref, uploadBytes, getDownloadURL } from "./firebase";

function CreateItem() {
    const [item, setItem] = useState({
        title: "",
        text: "Enter question text here.",
        choices: ["", ""],
        correctAnswer: "a",
        imageUrl: "",
        choiceImages: ["", ""]
    });
    const [successMessage, setSuccessMessage] = useState(false);

    const handleInputChange = (field, value) => {
        setItem(prevItem => ({ ...prevItem, [field]: value }));
    };

    const handleChoiceChange = (index, value) => {
        const newChoices = [...item.choices];
        newChoices[index] = value;
        setItem(prevItem => ({ ...prevItem, choices: newChoices }));
    };

    const handleChoiceImageUpload = async (event, index) => {
        const file = event.target.files[0];
        if (!file) return;

        const storageRef = ref(storage, `choice-images/${file.name}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            const newChoiceImages = [...item.choiceImages];
            newChoiceImages[index] = downloadURL;
            setItem(prevItem => ({ ...prevItem, choiceImages: newChoiceImages }));
        } catch (error) {
            console.error("Image upload failed: ", error);
        }
    };

    const handleImageUpload = async (event, field) => {
        const file = event.target.files[0];
        if (!file) return;

        const storageRef = ref(storage, `item-images/${file.name}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            handleInputChange(field, downloadURL);
        } catch (error) {
            console.error("Image upload failed: ", error);
        }
    };

    const handleAddOption = () => {
        setItem(prevItem => ({ ...prevItem, choices: [...prevItem.choices, ""], choiceImages: [...prevItem.choiceImages, ""] }));
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "items"), item);
            setSuccessMessage(true);
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
                        <label>Question Title (optional)</label>
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
                        <div className="mt-2 p-2 border">
                            <BlockMath>{item.text}</BlockMath>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Upload Question Image:</label>
                        <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "imageUrl")}
                        />
                        {item.imageUrl && (
                            <div className="mt-2">
                                <img src={item.imageUrl} alt="Question" className="img-fluid" style={{ maxHeight: "200px" }} />
                            </div>
                        )}
                    </div>
                    <ol type="a" className="list-group">
                        {item.choices.map((choice, index) => (
                            <li key={index} className="list-group-item border-0" style={getChoiceStyle(index)}>
                                <input
                                    className="form-control mb-2"
                                    placeholder={`Answer Choice ${index + 1}`}
                                    value={choice}
                                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                                />
                                <div className="mt-2 p-2 border">
                                    <InlineMath>{choice}</InlineMath>
                                </div>
                                <input
                                    type="file"
                                    className="form-control mt-2"
                                    accept="image/*"
                                    onChange={(e) => handleChoiceImageUpload(e, index)}
                                />
                                {item.choiceImages[index] && (
                                    <div className="mt-2">
                                        <img src={item.choiceImages[index]} alt={`Choice ${index + 1}`} className="img-fluid" style={{ maxHeight: "100px" }} />
                                    </div>
                                )}
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