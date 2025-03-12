import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import Sidebar from "./Sidebar";
import AuthRoute from "./AuthRoute";
import TeacherHome from "./TeacherHome";
import CreateTest from "./CreateTest";
import MonitorProgress from "./MonitorProgress";
import TestViewer from "./TestViewer";
import EditTest from "./EditTest";
import TeacherChoice from "./TeacherChoice";
import CreateItem from "./CreateItem";
import ViewItems from "./ViewItems";
import EditItem from "./EditItem";
import Signup from "./Signup";
import Login from "./Login";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const auth = getAuth();

  useEffect(() => {
    const handleTabClose = async () => {
      try {
        await signOut(auth);
        console.log("User logged out on tab close.");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };

    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, []);

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 p-4">
        <Routes>
          <Route path="/" element={<AuthRoute />} />
          <Route path="/teacher-home" element={<TeacherHome />} />
          <Route path="/teacher-choice" element={<TeacherChoice />} />
          <Route path="/create-item" element={<CreateItem />} />
          <Route path="/create-test" element={<CreateTest />} />
          <Route path="/view-items" element={<ViewItems />} />
          <Route path="/monitor-progress" element={<MonitorProgress />} />
          <Route path="/test-viewer" element={<TestViewer />} />
          <Route path="/edit-item/:itemId" element={<EditItem />} />
          <Route path="/edit-test/:testId" element={<EditTest />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;