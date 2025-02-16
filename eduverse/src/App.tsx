import React, { useEffect, useRef } from "react";
import { initThreeScene } from "./ThreeScene";
import "./App.css";

const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cleanup = initThreeScene(mountRef as unknown as React.RefObject<HTMLDivElement>);
    return cleanup;
  }, []);

  return <div ref={mountRef} style={{ width: "70vw", height: "50vh" }} />;
};

export default App;
