import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="d-flex">
      {user && <Sidebar />}
      <div className="flex-grow-1 p-4">
         <Routes>
          {!user ? (
            <>
              <Route path="/" element={<AuthRoute />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
            </>
          ) : (
            <>
              <Route path="/" element={<TeacherHome />} />
              <Route path="/teacher-home" element={<TeacherHome />} />
              <Route path="/teacher-choice" element={<TeacherChoice />} />
              <Route path="/create-item" element={<CreateItem />} />
              <Route path="/create-test" element={<CreateTest />} />
              <Route path="/view-items" element={<ViewItems />} />
              <Route path="/monitor-progress" element={<MonitorProgress />} />
              <Route path="/test-viewer" element={<TestViewer />} />
              <Route path="/edit-item/:itemId" element={<EditItem />} />
              <Route path="/edit-test/:testId" element={<EditTest />} />
              <Route path="/add-classes" element={<AddClasses />} />
              <Route path="/published-tests" element={<PublishedTests />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}

export default App;