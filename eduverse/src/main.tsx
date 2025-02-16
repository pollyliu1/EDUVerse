import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import Game from "./Game";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

const game = new Game();
game.init();
