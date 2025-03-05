import React from "react";

const ErrorModal = ({ message, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          width: "90%",
          maxWidth: "400px",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: "#d9534f", marginBottom: "15px" }}>Error</h3>
        <p style={{ color: "#262626", fontSize: "16px" }}>{message}</p>
        <button
          onClick={onClose}
          style={{
            background: "#0095f6",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            marginTop: "20px",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;