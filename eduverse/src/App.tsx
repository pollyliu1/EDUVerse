import React, { useRef } from "react";
import "./App.css";

const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  return <div ref={mountRef} style={{ width: "70vw", height: "50vh" }} className="three-container" />;
};

export default App;
