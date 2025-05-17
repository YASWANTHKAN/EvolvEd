import React, { useRef, useState, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

const Paint = ({ onClose, isPage = false }) => {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 100px)" }}>
      <Excalidraw />
    </div>
  );
};

export default Paint;
