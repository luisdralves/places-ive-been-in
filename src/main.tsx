import "./index.css";
import "@fontsource/josefin-sans/300-italic.css";
import "@fontsource/josefin-sans/300.css";
import "mapbox-gl/dist/mapbox-gl.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
