import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { doc, getDoc, updateDoc} from "firebase/firestore";
import { db } from './firebase'; 
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

function EditTest() {
    const { testId } = useParams();
    const [successMessage, setSuccessMessage] = useState(false);
    const [testName, setTestName] = useState("");
    const [questions, setQuestions] = useState([]);
    const [imageUploadProgress, setImageUploadProgress] = useState({});

    const auth = getAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const testRef = doc(db, "tests", testId);
                const testSnap = await getDoc(testRef);
                if (testSnap.exists()) {
                    const data = testSnap.data();
                    setTestName(data.testName);
                    setQuestions(data.questions);
                }
            } catch (error) {
                console.error("Error fetching test: ", error);
            }
        };
        fetchTest();
    }, [testId]);

    const handleSaveTest = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error("No user is logged in");
            return;
        }

        try {
            const testRef = doc(db, "tests", testId);
            await updateDoc(testRef, {
                testName,
                questions,
                userId: currentUser.uid,
            });
            setSuccessMessage(true);
            setTimeout(() => setSuccessMessage(false), 3000);
            navigate("/test-viewer");
        } catch (error) {
            console.error("Error updating test: ", error);
        }
    };

    const handleInputChange = (questionIndex, field, value) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex][field] = value;
        setQuestions(newQuestions);
    };

    const handleChoiceChange = (questionIndex, choiceIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices[choiceIndex] = value;
        setQuestions(newQuestions);
    };

    const getChoiceStyle = (questionIndex, choiceIndex) => {
        return questions[questionIndex].correctAnswer === String.fromCharCode(97 + choiceIndex)
            ? { backgroundColor: "lightgreen" }
            : {};
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            id: questions.length + 1,
            title: "",
            text: "Enter question text here.",
            choices: ["", ""],
            correctAnswer: "a",
            imageUrl: "", 
        };
        setQuestions([...questions, newQuestion]);
    };

    const handleAddOption = (questionIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].choices.push("");
        setQuestions(newQuestions);
    };

    const handleFileUpload = async (questionIndex, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const storage = getStorage();
        const storagePath = `test-images/${testId}/${file.name}`;
        const imageRef = storageRef(storage, storagePath);
        
        const uploadTask = uploadBytesResumable(imageRef, file);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setImageUploadProgress((prevProgress) => ({
                    ...prevProgress,
                    [questionIndex]: progress,
                }));
            },
            (error) => {
                console.error("Error uploading image:", error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const newQuestions = [...questions];
                newQuestions[questionIndex].imageUrl = downloadURL;
                setQuestions(newQuestions);
            }
        );
    };

    return (
        <div className="container-fluid">
            <header className="jumbotron jumbotron-fluid bg-light text-center">
                <h1>Edit Test</h1>
            </header>

            <main className="container">
                <form onSubmit={handleSaveTest}>
                    <div className="form-group mb-4">
                        <label htmlFor="test-name">Test Name</label>
                        <input
                            id="test-name"
                            className="form-control"
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                        />
                    </div>

                    {questions.map((question, questionIndex) => (
                        <div key={question.id} className="form-group mb-4">
                            <div className="card">
                                <div className="card-body">
                                    <h3 className="card-title">{questionIndex + 1}.</h3>

                                    <input
                                        className="form-control mb-3"
                                        placeholder="Question Title (optional)"
                                        value={question.title}
                                        onChange={(e) => handleInputChange(questionIndex, 'title', e.target.value)}
                                    />

                                    <textarea
                                        className="form-control mb-3"
                                        rows="5"
                                        value={question.text}
                                        onChange={(e) => handleInputChange(questionIndex, 'text', e.target.value)}
                                    />

                                    <div className="mb-3">
                                        <label>Question Image</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            onChange={(e) => handleFileUpload(questionIndex, e)}
                                        />
                                        {imageUploadProgress[questionIndex] && (
                                            <div className="progress mt-2">
                                                <div
                                                    className="progress-bar"
                                                    role="progressbar"
                                                    style={{ width: `${imageUploadProgress[questionIndex]}%` }}
                                                    aria-valuenow={imageUploadProgress[questionIndex]}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                >
                                                    {Math.round(imageUploadProgress[questionIndex])}%
                                                </div>
                                            </div>
                                        )}
                                        {question.imageUrl && <img src={question.imageUrl} alt="Question" className="mt-2" style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }} />}
                                    </div>

                                    <div className="mt-2 p-2 border">
                                        <BlockMath>{question.text}</BlockMath>
                                    </div>

                                    <ol type="a" className="list-group">
                                        {question.choices.map((choice, choiceIndex) => (
                                            <li key={choiceIndex} className="list-group-item border-0">
                                                <input
                                                    className="form-control mb-2"
                                                    placeholder={`Answer Choice ${choiceIndex + 1}`}
                                                    value={choice}
                                                    onChange={(e) => handleChoiceChange(questionIndex, choiceIndex, e.target.value)}
                                                    style={getChoiceStyle(questionIndex, choiceIndex)}
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
                                        onClick={() => handleAddOption(questionIndex)}
                                    >
                                        Add Option
                                    </button>

                                    <h6 className="mt-3">Correct Answer:</h6>
                                    <select
                                        className="form-select"
                                        value={question.correctAnswer}
                                        onChange={(e) => handleInputChange(questionIndex, 'correctAnswer', e.target.value)}
                                    >
                                        {question.choices.map((_, index) => (
                                            <option key={index} value={String.fromCharCode(97 + index)}>
                                                {String.fromCharCode(97 + index)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="mb-4">
                        <button type="button" className="btn btn-primary btn-lg me-2" onClick={handleAddQuestion}>
                            Add Question
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg">
                            Save Changes
                        </button>
                    </div>
                </form>
            </main>

            {successMessage && (
                <div className="alert alert-success fixed-bottom m-3" style={{ zIndex: 9999 }}>
                    <p className="text-center mb-0">
                        Your test was updated successfully!
                    </p>
                </div>
            )}
        </div>
    );
}

export default EditTest;