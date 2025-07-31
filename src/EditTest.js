import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from './firebase';
import { getAuth } from "firebase/auth";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function EditTest() {
    const { testId } = useParams();
    const [successMessage, setSuccessMessage] = useState(false);
    const [testName, setTestName] = useState("");
    const [questions, setQuestions] = useState([]);
    const [inputModes, setInputModes] = useState({});
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
                    const modes = {};
                    data.questions.forEach((_, i) => { modes[i] = "latex"; });
                    setInputModes(modes);
                }
            } catch (error) {
                console.error("Error fetching test: ", error);
            }
        };
        fetchTest();
    }, [testId]);

    const convertTextToLatex = (text) => {
        if (!text.trim()) return text;
        if (text.includes("\\text{")) return text;

        const tokens = text.split(/\s+/);
        return tokens
            .map(token => (/[0-9+\-*/=]/.test(token) ? token : `\\text{${token}}`))
            .join(" \\ ");
    };

    const handleInputChange = (qIndex, field, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex][field] = value;
        setQuestions(newQuestions);
    };

    const handleChoiceChange = (qIndex, cIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].choices[cIndex] = value;
        setQuestions(newQuestions);
    };

    const handleConvertQuestionToLatex = (qIndex) => {
        const converted = convertTextToLatex(questions[qIndex].text);
        handleInputChange(qIndex, "text", converted);
    };

    const handleConvertChoiceToLatex = (qIndex, cIndex) => {
        const converted = convertTextToLatex(questions[qIndex].choices[cIndex]);
        handleChoiceChange(qIndex, cIndex, converted);
    };

    const handleAddQuestion = () => {
        const newQuestion = {
            id: questions.length + 1,
            title: "",
            text: "",
            choices: ["", ""],
            correctAnswer: "a"
        };
        setQuestions([...questions, newQuestion]);
        setInputModes(prev => ({ ...prev, [questions.length]: "regular" }));
    };

    const handleAddOption = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].choices.push("");
        setQuestions(newQuestions);
    };

    const handleDeleteQuestion = (qIndex) => {
        const newQuestions = [...questions];
        newQuestions.splice(qIndex, 1);
        setQuestions(newQuestions);
    };

    const getChoiceStyle = (qIndex, cIndex) => {
        return questions[qIndex].correctAnswer === String.fromCharCode(97 + cIndex)
            ? { backgroundColor: "lightgreen" }
            : {};
    };

    const handleSaveTest = async (e) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error("No user is logged in");
            return;
        }

        const finalQuestions = questions.map((q, qIndex) => {
            if (inputModes[qIndex] === "regular") {
                return {
                    ...q,
                    text: convertTextToLatex(q.text),
                    choices: q.choices.map(choice => convertTextToLatex(choice))
                };
            }
            return q;
        });

        try {
            const testRef = doc(db, "tests", testId);
            await updateDoc(testRef, {
                testName,
                questions: finalQuestions,
                userId: currentUser.uid
            });
            setSuccessMessage(true);
            setTimeout(() => {
                setSuccessMessage(false);
                navigate("/test-viewer");
            }, 2000);
        } catch (error) {
            console.error("Error updating test: ", error);
        }
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

                    {questions.map((question, qIndex) => (
                        <div key={qIndex} className="form-group mb-4">
                            <div className="card">
                                <div className="card-body position-relative">
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                        onClick={() => handleDeleteQuestion(qIndex)}
                                    >
                                        X
                                    </button>

                                    <h3 className="card-title">{qIndex + 1}.</h3>

                                    <input
                                        className="form-control mb-3"
                                        placeholder="Question Title (optional)"
                                        value={question.title}
                                        onChange={(e) => handleInputChange(qIndex, 'title', e.target.value)}
                                    />

                                    <div className="mb-2">
                                        <label className="me-3">Input Mode:</label>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`inputMode-${qIndex}`}
                                                value="regular"
                                                checked={inputModes[qIndex] === "regular"}
                                                onChange={() => setInputModes(prev => ({ ...prev, [qIndex]: "regular" }))}
                                            />
                                            <label className="form-check-label">Regular</label>
                                        </div>
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name={`inputMode-${qIndex}`}
                                                value="latex"
                                                checked={inputModes[qIndex] === "latex"}
                                                onChange={() => setInputModes(prev => ({ ...prev, [qIndex]: "latex" }))}
                                            />
                                            <label className="form-check-label">LaTeX</label>
                                        </div>
                                    </div>

                                    <div className="alert alert-info py-2">
                                        <strong>Note:</strong> If you are using regular text, format to LaTeX prior to saving your test.
                                    </div>

                                    <textarea
                                        className="form-control mb-2"
                                        rows="4"
                                        value={question.text}
                                        onChange={(e) => handleInputChange(qIndex, 'text', e.target.value)}
                                        placeholder={inputModes[qIndex] === "regular" ? "Enter plain text" : "Enter LaTeX"}
                                    />
                                    {inputModes[qIndex] === "regular" && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm mb-3"
                                            onClick={() => handleConvertQuestionToLatex(qIndex)}
                                        >
                                            Convert Question to LaTeX
                                        </button>
                                    )}

                                    <div className="mt-2 p-2 border bg-light"
                                        style={{ maxHeight: "auto", overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap" }}>
                                        <BlockMath>{question.text}</BlockMath>
                                    </div>


                                    <ol type="a" className="list-group mt-3">
                                        {question.choices.map((choice, cIndex) => (
                                            <li key={cIndex} className="list-group-item border-0" style={getChoiceStyle(qIndex, cIndex)}>
                                                <input
                                                    className="form-control mb-2"
                                                    placeholder={`Answer Choice ${cIndex + 1}`}
                                                    value={choice}
                                                    onChange={(e) => handleChoiceChange(qIndex, cIndex, e.target.value)}
                                                />
                                                {inputModes[qIndex] === "regular" && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary btn-sm mb-2"
                                                        onClick={() => handleConvertChoiceToLatex(qIndex, cIndex)}
                                                    >
                                                        Convert to LaTeX
                                                    </button>
                                                )}
                                                <div className="mt-2 p-2 border bg-light"
                                                    style={{ maxHeight: "auto", overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap" }}>
                                                    <InlineMath>{choice}</InlineMath>
                                                </div>

                                            </li>
                                        ))}
                                    </ol>

                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm mt-3"
                                        onClick={() => handleAddOption(qIndex)}
                                    >
                                        Add Option
                                    </button>

                                    <h6 className="mt-3">Correct Answer:</h6>
                                    <select
                                        className="form-select"
                                        value={question.correctAnswer}
                                        onChange={(e) => handleInputChange(qIndex, 'correctAnswer', e.target.value)}
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
                        <button type="submit" className="btn btn-success btn-lg">
                            Save Changes
                        </button>
                    </div>
                </form>
            </main>

            {successMessage && (
                <div className="alert alert-success fixed-bottom m-3 text-center">
                    Your test was updated successfully!
                </div>
            )}
        </div>
    );
}

export default EditTest;
