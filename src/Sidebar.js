import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import homeImg from "./imgs/home.png";
import testImg from "./imgs/test.png";
import monitorImg from "./imgs/monitor.png";
import pencilImg from "./imgs/pencil.png";
import itemImg from "./imgs/itemcreate.png";
import pastImg from "./imgs/past_tests.png";
import classImg from "./imgs/class.png";
import checkImg from "./imgs/check.png";

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="d-flex flex-column p-3" style={{ width: "200px", backgroundColor: "#A45EE5", minHeight: "100vh" }}>
      {user && (
        <>
          <Link to="/teacher-home" className="text-center text-decoration-none mb-3" style={{ color: 'white' }}>
            <img src={homeImg} alt="home" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>Home</p>
          </Link>
          <Link to="/add-classes" className="text-center text-decoration-none" style={{ color: 'white' }}>
            <img src={classImg} alt="add classes" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>Add Classes</p>
          </Link>
          <Link to="/create-item" className="text-center text-decoration-none mb-3" style={{ color: 'white' }}>
            <img src={pencilImg} alt="create item" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>Create Item</p>
          </Link>
          <Link to="/create-test" className="text-center text-decoration-none mb-3" style={{ color: 'white' }}>
            <img src={itemImg} alt="create tests" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>Create Tests</p>
          </Link>
          <Link to="/view-items" className="text-center text-decoration-none mb-3" style={{ color: 'white' }}>
            <img src={testImg} alt="view tests" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>Your Items</p>
          </Link>
          <Link to="/test-viewer" className="text-center text-decoration-none" style={{ color: 'white' }}>
            <img src={pastImg} alt="edit and publish tests" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>Your Tests</p>
          </Link>
          <Link to="/published-tests" className="text-center text-decoration-none" style={{ color: 'white' }}>
            <img src={checkImg} alt="edit and publish tests" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>View Published Tests</p>
          </Link>
          <Link to="/monitor-progress" className="text-center text-decoration-none" style={{ color: 'white' }}>
            <img src={monitorImg} alt="monitor test progress" className="img-fluid" style={{ width: "35px", height: "35px" }} />
            <p style={{ color: 'black' }}>Monitor Test Progress</p>
          </Link>
        </>
      )}
      <div className="mt-auto text-center">
        <button className="btn btn-light w-100" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Sidebar;