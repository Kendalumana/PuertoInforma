import React from "react";
import ReactDOM from "react-dom/client";
// Ruta corregida: App.jsx está dentro de assets
import App from "./assets/App.jsx"; 
// Ruta corregida: App.css está dentro de styles
import "./styles/App.css"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);