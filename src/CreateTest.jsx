import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function CreateTest() {
  const [successMessage, setSuccessMessage] = useState(false);
  const [questions, setQuestions] = useState([{
    id: 1,
    title: "",
    text: "Enter question text here.",
    choices: ["", ""],
    correctAnswer: "a"
  }]);

  const handleAddOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].choices.push("");
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      id: questions.length + 1,
      title: "",
      text: "Enter question text here.",
      choices: ["", ""],
      correctAnswer: "a"
    }]);
  };

  const handleSaveTest = (e) => {
    e.preventDefault();
    // Add your save logic here
    setSuccessMessage(true);
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

  return (
    <div className="container-fluid">
      <header>
        <div className="jumbotron jumbotron-fluid bg-light">
          <div className="container text-center">
            <h1>Create, Edit, and Publish Tests</h1>
          </div>
        </div>
      </header>

      <main className="container">
        <form onSubmit={handleSaveTest}>
          <div className="form-group mb-4">
            <label htmlFor="test-name">Test Name</label>
            <input
              id="test-name"
              className="form-control"
              placeholder="Ex: The Normal Curve"
            />
          </div>

          {questions.map((question, questionIndex) => (
            <div key={question.id} className="form-group mb-4">
              <div className="card">
                <div className="card-body">
                  <h3 className="card-title">{question.id}.</h3>
                  
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

                  <ol type="a" className="list-group">
                    {question.choices.map((choice, choiceIndex) => (
                      <li key={choiceIndex} className="list-group-item border-0">
                        <input
                          className="form-control mb-2"
                          placeholder={`Answer Choice ${choiceIndex + 1}`}
                          value={choice}
                          onChange={(e) => handleChoiceChange(questionIndex, choiceIndex, e.target.value)}
                        />
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
            <button
              type="button"
              className="btn btn-primary btn-lg me-2"
              onClick={handleAddQuestion}
            >
              Add Question
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
            >
              Save Test
            </button>
          </div>
        </form>

        {successMessage && (
          <div className="alert alert-success text-center">
            <p>
              Your test was saved successfully! To publish your test, go to the View Tests page
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default CreateTest;