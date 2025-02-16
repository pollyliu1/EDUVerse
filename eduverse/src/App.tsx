import React, { useEffect, useState } from "react";
import "./App.css";
import * as THREE from "three";

interface HandPosition {
  left: {
    x: string;
    y: string;
    z: string;
  } | null;
  right: {
    x: string;
    y: string;
    z: string;
  } | null;
}

const App: React.FC = () => {
  const [handPositions, setHandPositions] = useState<HandPosition>({
    left: null,
    right: null,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const game = (globalThis as any).game as {
        getHandPositions: () => {
          left: THREE.Vector3 | null;
          right: THREE.Vector3 | null;
        };
      };
      if (game && game.getHandPositions) {
        const positions = game.getHandPositions();
        setHandPositions({
          left: positions.left
            ? {
                x: positions.left.x.toFixed(2),
                y: positions.left.y.toFixed(2),
                z: positions.left.z.toFixed(2),
              }
            : null,
          right: positions.right
            ? {
                x: positions.right.x.toFixed(2),
                y: positions.right.y.toFixed(2),
                z: positions.right.z.toFixed(2),
              }
            : null,
        });
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <div className="hand-positions">
        <h2>Hand Positions</h2>
        <div>
          <strong>Left Hand:</strong>{" "}
          {handPositions.left ? `x: ${handPositions.left.x}, y: ${handPositions.left.y}, z: ${handPositions.left.z}` : "Not Detected"}
        </div>
        <div>
          <strong>Right Hand:</strong>{" "}
          {handPositions.right ? `x: ${handPositions.right.x}, y: ${handPositions.right.y}, z: ${handPositions.right.z}` : "Not Detected"}
        </div>
      </div>
    </div>
  );
};

export default App;
