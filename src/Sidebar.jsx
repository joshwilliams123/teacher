import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import homeImg from "./imgs/home.png";
import testImg from "./imgs/test.png";
import monitorImg from "./imgs/monitor.png";
import pencilImg from "./imgs/pencil.png"

const Sidebar = () => {
    return (
      <nav className="d-flex flex-column vh-100 p-3" style={{ width: "200px", backgroundColor: "#A45EE5" }}>
        <Link to="/" className="text-center text-decoration-none mb-3">
          <img src={homeImg} alt="home" className="img-fluid" style={{ width: "50px", height: "50px" }} />
          <p>Home</p>
        </Link>
        <Link to="/create-test" className="text-center text-decoration-none mb-3">
          <img src={testImg} alt="create tests" className="img-fluid" style={{ width: "50px", height: "50px" }} />
          <p>Create Tests</p>
        </Link>
        <Link to="/test-viewer" className="text-center text-decoration-none">
          <img src={pencilImg} alt="edit and publish tests" className="img-fluid" style={{ width: "60px", height: "60px" }} />
          <p>Edit/Publish Tests</p>
        </Link>
        <Link to="/monitor-progress" className="text-center text-decoration-none">
          <img src={monitorImg} alt="monitor test progress" className="img-fluid" style={{ width: "50px", height: "50px" }} />
          <p>Monitor Test Progress</p>
        </Link>
      </nav>
    );
  };    

export default Sidebar;