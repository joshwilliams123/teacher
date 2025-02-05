import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Sidebar from "./Sidebar";
import TeacherHome from "./TeacherHome";
import CreateTest from "./CreateTest";
import MonitorProgress from "./MonitorProgress";
import TestViewer from "./TestViewer"
import TeacherChoice from "./TeacherChoice";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <Router>
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-4">
          <Routes>
            <Route path="/" element={<TeacherHome />} />
            <Route path="/teacher-choice" element={<TeacherChoice />} />
            <Route path="/create-test" element={<CreateTest />} />
            <Route path="/monitor-progress" element={<MonitorProgress />} />
            <Route path="/test-viewer" element={<TestViewer />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;