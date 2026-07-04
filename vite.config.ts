import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svgr(), react()],
  resolve: {
    alias: {
      src: path.resolve("./src"),
      types: path.resolve("./types"),
    },
  },
  build: {
    copyPublicDir: false,
  },
});
