import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, addDoc, collection, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
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
        questionImageUrl: "",
        choiceImages: ["", ""]
    });
    const [successMessage, setSuccessMessage] = useState(false);
    const [user, setUser] = useState(null);
    const [inputMode, setInputMode] = useState("regular");
    const [imageBank, setImageBank] = useState([]);
    const [showImageBank, setShowImageBank] = useState(false);
    const [imageBankType, setImageBankType] = useState("");
    const [imageBankChoiceIndex, setImageBankChoiceIndex] = useState(null);
    const auth = getAuth();
    const navigate = useNavigate();

    const questionFileRef = useRef(null);
    const choiceFileRefs = useRef([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser !== null && user === null) {
                setUser(currentUser);
            } else if (currentUser === null && user !== null) {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, [auth, user]);

    useEffect(() => {
        async function fetchImages() {
            if (!user) return;
            const folderRef = ref(storage, `itemImages/${user.uid}/`);
            const result = await listAll(folderRef);
            const urls = await Promise.all(
                result.items.map(async (itemRef) => await getDownloadURL(itemRef))
            );
            setImageBank(urls);
        }
        fetchImages();
    }, [user]);

    const handleInputChange = (field, value) => {
        setItem(prevItem => ({ ...prevItem, [field]: value }));
    };

    const handleChoiceChange = (index, value) => {
        const newChoices = [...item.choices];
        newChoices[index] = value;
        const newImages = [...item.choiceImages];
        if (!newImages[index]) newImages[index] = "";
        setItem(prevItem => ({ ...prevItem, choices: newChoices, choiceImages: newImages }));
    };

    const handleDeleteChoice = (index) => {
        if (item.choices.length > 2) {
            const newChoices = item.choices.filter((_, i) => i !== index);
            const newImages = item.choiceImages.filter((_, i) => i !== index);
            setItem(prevItem => ({
                ...prevItem,
                choices: newChoices,
                choiceImages: newImages,
                correctAnswer: newChoices.length > 0 ? "a" : ""
            }));
        }
    };

    const handleDeleteQuestionImage = async () => {
        if (item.questionImageUrl) {
            try {
                const imageRef = ref(storage, item.questionImageUrl);
                await deleteObject(imageRef);
            } catch (error) { }
        }
        if (questionFileRef.current) {
            questionFileRef.current.value = "";
        }
        setItem(prevItem => ({ ...prevItem, questionImageUrl: "" }));
    };

    const handleDeleteChoiceImage = async (index) => {
        if (item.choiceImages[index]) {
            try {
                const imageRef = ref(storage, item.choiceImages[index]);
                await deleteObject(imageRef);
            } catch (error) { }
        }
        if (choiceFileRefs.current[index]) {
            choiceFileRefs.current[index].value = "";
        }
        const newImages = [...item.choiceImages];
        newImages[index] = "";
        setItem(prevItem => ({ ...prevItem, choiceImages: newImages }));
    };

    const handleAddOption = () => {
        setItem(prevItem => ({
            ...prevItem,
            choices: [...prevItem.choices, ""],
            choiceImages: [...prevItem.choiceImages, ""]
        }));
    };

    const handleImageUpload = async (file, type, index = null) => {
        if (!file || !user) return;
        const storageRef = ref(storage, `itemImages/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        if (type === "question") {
            setItem(prev => ({ ...prev, questionImageUrl: url }));
        } else if (type === "choice" && index !== null) {
            const newImages = [...item.choiceImages];
            newImages[index] = url;
            setItem(prev => ({ ...prev, choiceImages: newImages }));
        }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to save items.");
            return;
        }
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
        try {
            await addDoc(collection(db, "items"), {
                ...finalItem,
                userId: user.uid,
                inputMode: inputMode,
                createdAt: new Date()
            });
            setSuccessMessage(true);
            navigate("/view-items");
        } catch (error) { }
    };

    const getChoiceStyle = (index) => {
        return item.correctAnswer === String.fromCharCode(97 + index)
            ? { backgroundColor: "lightgreen" }
            : {};
    };

    const convertTextToLatex = (text) => {
        if (!text.trim()) return text;
        if (text.includes("\\text{")) return text;
        return text
            .split(/\n+/)
            .map(line => {
                const tokens = line.split(/\s+/);
                return tokens
                    .map(token => /[0-9+\-*/=]/.test(token) ? token : `\\text{${token}}`)
                    .join(" \\ ");
            })
            .join(" \\\\ ");
    };

    const openImageBank = (type, index = null) => {
        setImageBankType(type);
        setImageBankChoiceIndex(index);
        setShowImageBank(true);
    };

    const handleSelectImageFromBank = (url) => {
        if (imageBankType === "question") {
            setItem(prev => ({ ...prev, questionImageUrl: url }));
        } else if (imageBankType === "choice" && imageBankChoiceIndex !== null) {
            const newImages = [...item.choiceImages];
            newImages[imageBankChoiceIndex] = url;
            setItem(prev => ({ ...prev, choiceImages: newImages }));
        }
        setShowImageBank(false);
        setImageBankType("");
        setImageBankChoiceIndex(null);
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
                    {inputMode === "latex" && (
                        <div className="alert alert-info py-2 mb-3">
                            <strong>Note:</strong> Enter your question and choices using proper LaTeX syntax.
                        </div>
                    )}
                    <div className="form-group mb-4">
                        <label>Question Image</label>
                        <br />
                        {!item.questionImageUrl ? (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-secondary me-2"
                                    onClick={() => questionFileRef.current.click()}
                                >
                                    Add Image
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-info"
                                    onClick={() => openImageBank("question")}
                                >
                                    Select from Image Bank
                                </button>
                            </>
                        ) : (
                            <div className="position-relative d-inline-block">
                                <img src={item.questionImageUrl} alt="Question Preview" style={{ maxWidth: "200px", marginTop: "10px" }} />
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
                            onChange={(e) => handleImageUpload(e.target.files[0], "question")}
                        />
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
                        {inputMode === "latex" && (
                            <div className="mt-3 p-3 border bg-light">
                                <strong>Preview:</strong>
                                <BlockMath>{item.text}</BlockMath>
                            </div>
                        )}
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
                                <textarea rows="2"
                                    className="form-control mb-2"
                                    placeholder={`Answer Choice ${index + 1}`}
                                    value={choice}
                                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                                />
                                {!item.choiceImages[index] ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-secondary me-2"
                                            onClick={() => choiceFileRefs.current[index].click()}
                                        >
                                            Add Image
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-info"
                                            onClick={() => openImageBank("choice", index)}
                                        >
                                            Select from Image Bank
                                        </button>
                                    </>
                                ) : (
                                    <div className="position-relative d-inline-block">
                                        <img src={item.choiceImages[index]} alt={`Choice ${index + 1}`} style={{ maxWidth: "150px", marginTop: "10px" }} />
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
                                    onChange={(e) => handleImageUpload(e.target.files[0], "choice", index)}
                                />
                                {inputMode === "latex" && (
                                    <div className="mt-2 p-2 border bg-light">
                                        <InlineMath>{choice}</InlineMath>
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
                {showImageBank && (
                    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Select Image from Bank</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowImageBank(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="d-flex flex-wrap">
                                        {imageBank.length === 0 && <p>No images available.</p>}
                                        {imageBank.map((url, idx) => (
                                            <img
                                                key={idx}
                                                src={url}
                                                alt={`Bank ${idx}`}
                                                style={{ maxWidth: "100px", margin: "5px", cursor: "pointer", border: "2px solid #eee" }}
                                                onClick={() => handleSelectImageFromBank(url)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default CreateItem;