import React from "react";
import SparkleBackground from "./SparkleBackground";
import Confetti from "./Confetti";

export default function MagicLayer({ children, showConfetti }) {
  return (
    <div className="relative">
      <SparkleBackground />
      {children}
      <Confetti show={showConfetti} />
    </div>
  );
}
