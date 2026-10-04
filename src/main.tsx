import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./app/providers";
import { router } from "./app/router";
import "./design-system/global.css";
import { initializeBrowserAppCheck } from "./firebase/app-check";

initializeBrowserAppCheck();

createRoot(document.getElementById("root")!).render(
  <StrictMode><AppProviders><RouterProvider router={router} /></AppProviders></StrictMode>,
);
