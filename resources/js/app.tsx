import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

const Home = lazy(() => import("./Home"));
const AdminApp = lazy(() => import("./admin/AdminApp"));

const root = document.getElementById("app");

if (!root) {
  throw new Error("Missing #app mount element");
}

const page = root.dataset.page;

createRoot(root).render(
  <StrictMode>
    <Suspense fallback={null}>
      {page === "admin" ? <AdminApp /> : <Home />}
    </Suspense>
  </StrictMode>,
);
