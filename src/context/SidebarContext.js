// src/context/SidebarContext.js
import React, { createContext, useState, useContext } from "react";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(
    localStorage.getItem("sidebar") === "true" || true // Default to open
  );

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebar", `${newState}`); // Use setItem instead of set
      return newState;
    });
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);