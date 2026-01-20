// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter
        v7_startTransition
        v7_relativeSplatPath
      >
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
