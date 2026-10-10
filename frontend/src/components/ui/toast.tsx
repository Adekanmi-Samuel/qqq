"use client";

import { Toaster } from "react-hot-toast";

function SchoolPilotToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--surface, #ffffff)",
          color: "var(--text, #111612)",
          border: "1px solid var(--border, #e8efe9)",
          borderRadius: "0.875rem",
          padding: "0.875rem 1.25rem",
          fontSize: "0.875rem",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)",
          maxWidth: "min(400px, calc(100vw - 2rem))",
        },
        success: {
          iconTheme: {
            primary: "var(--brand)",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#f43f5e",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}

export { SchoolPilotToaster };
export { default as toast } from "react-hot-toast";
