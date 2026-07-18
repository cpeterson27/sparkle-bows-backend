import React from "react";
import { createPortal } from "react-dom";

export default function ModalManager({ children }) {
  // This will render the modal children in the #modal-root div outside the main app
  return createPortal(children, document.getElementById("modal-root"));
}
