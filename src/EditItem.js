import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from './firebase';
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";  

function EditItem() {
    const { itemId } = useParams();
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
                    setItem(itemSnap.data());
                }
            } catch (error) {
                console.error("Error fetching item: ", error);
            }
        };
        fetchItem();
    }, [itemId]);

    const handleSaveItem = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error("No user is logged in");
            return;
        }

        try {
            const itemRef = doc(db, "items", itemId);
            await updateDoc(itemRef, {
                ...item,
                userId: currentUser.uid,  
            });
            setSuccessMessage(true);
            setTimeout(() => setSuccessMessage(false), 3000);
        } catch (error) {
            console.error("Error updating item: ", error);
        }
    };

    const handleInputChange = (field, value) => {
        setItem((prevItem) => ({ ...prevItem, [field]: value }));
    };

    const handleChoiceChange = (choiceIndex, value) => {
        const newChoices = [...item.choices];
        newChoices[choiceIndex] = value;
        setItem((prevItem) => ({ ...prevItem, choices: newChoices }));
    };

    const getChoiceStyle = (choiceIndex) => {
        return item.correctAnswer === String.fromCharCode(97 + choiceIndex)
            ? { backgroundColor: "lightgreen" }
            : {};
    };

    const handleAddOption = () => {
        setItem((prevItem) => ({ ...prevItem, choices: [...prevItem.choices, ""] }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);  
            setItem((prevItem) => ({ ...prevItem, imageUrl }));
        }
    };

    return (
        <div className="container-fluid">
            <header className="jumbotron jumbotron-fluid bg-light text-center">
                <h1>Edit Item</h1>
            </header>

            <main className="container">
                <form onSubmit={handleSaveItem}>
                    <div className="form-group mb-4">
                        <label htmlFor="item-title">Question Title</label>
                        <input
                            id="item-title"
                            className="form-control"
                            value={item.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
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

                    <div className="form-group mb-4">
                        <label>Image Upload</label>
                        <input
                            type="file"
                            className="form-control"
                            onChange={handleImageChange}
                        />
                        {item.imageUrl && (
                            <img src={item.imageUrl} alt="Uploaded" className="img-fluid mt-3" />
                        )}
                    </div>

                    <ol type="a" className="list-group">
                        {item.choices.map((choice, choiceIndex) => (
                            <li key={choiceIndex} className="list-group-item border-0">
                                <input
                                    className="form-control mb-2"
                                    placeholder={`Answer Choice ${choiceIndex + 1}`}
                                    value={choice}
                                    onChange={(e) => handleChoiceChange(choiceIndex, e.target.value)}
                                    style={getChoiceStyle(choiceIndex)}
                                />
                                <div className="mt-2 p-2 border">
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
                        onChange={(e) => handleInputChange('correctAnswer', e.target.value)}
                    >
                        {item.choices.map((_, index) => (
                            <option key={index} value={String.fromCharCode(97 + index)}>
                                {String.fromCharCode(97 + index)}
                            </option>
                        ))}
                    </select>

                    <div className="mb-4 mt-4">
                        <button type="submit" className="btn btn-primary btn-lg">
                            Save Changes
                        </button>
                    </div>
                </form>
            </main>

            {successMessage && (
                <div className="alert alert-success fixed-bottom m-3" style={{ zIndex: 9999 }}>
                    <p className="text-center mb-0">
                        Your item was updated successfully!
                    </p>
                </div>
            )}
        </div>
    );
}

export default EditItem;