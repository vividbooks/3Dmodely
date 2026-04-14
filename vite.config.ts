import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://vividbooks.github.io/3Dmodely/ — produkční build musí mít base podle názvu repa.
const repoName = "3Dmodely";

export default defineConfig(({ command }) => ({
  base: command === "build" ? `/${repoName}/` : "/",
  plugins: [react()],
}));
