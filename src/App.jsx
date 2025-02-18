import React from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from "./Sidebar";
import TeacherHome from "./TeacherHome";
import CreateTest from "./CreateTest";
import MonitorProgress from "./MonitorProgress";
import TestViewer from "./TestViewer"
import EditTest from "./EditTest";
import TeacherChoice from "./TeacherChoice";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <Routes>
          <Route path="/" element={<TeacherHome />} />
          <Route path="/teacher-choice" element={<TeacherChoice />} />
          <Route path="/create-test" element={<CreateTest />} />
          <Route path="/monitor-progress" element={<MonitorProgress />} />
          <Route path="/test-viewer" element={<TestViewer />} />
          <Route path="/edit-test/:testId" element={<EditTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;