import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
import AddClasses from "./AddClasses";
import PublishedTests from "./PublishedTests";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return null; 
  }

  return (
    <div className="d-flex">
      {user && <Sidebar />}
      <div className="flex-grow-1 p-4">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/teacher-home" replace /> : <AuthRoute />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/teacher-home" replace /> : <Signup />}
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/teacher-home" replace /> : <Login />}
          />

          <Route
            path="/teacher-home"
            element={user ? <TeacherHome /> : <Navigate to="/" replace />}
          />
          <Route
            path="/teacher-choice"
            element={user ? <TeacherChoice /> : <Navigate to="/" replace />}
          />
          <Route
            path="/create-item"
            element={user ? <CreateItem /> : <Navigate to="/" replace />}
          />
          <Route
            path="/create-test"
            element={user ? <CreateTest /> : <Navigate to="/" replace />}
          />
          <Route
            path="/view-items"
            element={user ? <ViewItems /> : <Navigate to="/" replace />}
          />
          <Route
            path="/monitor-progress"
            element={user ? <MonitorProgress /> : <Navigate to="/" replace />}
          />
          <Route
            path="/test-viewer"
            element={user ? <TestViewer /> : <Navigate to="/" replace />}
          />
          <Route
            path="/edit-item/:itemId"
            element={user ? <EditItem /> : <Navigate to="/" replace />}
          />
          <Route
            path="/edit-test/:testId"
            element={user ? <EditTest /> : <Navigate to="/" replace />}
          />
          <Route
            path="/add-classes"
            element={user ? <AddClasses /> : <Navigate to="/" replace />}
          />
          <Route
            path="/published-tests"
            element={user ? <PublishedTests /> : <Navigate to="/" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
