import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: new URL("./index.html", import.meta.url).pathname,
        deploy: new URL("./deploy.html", import.meta.url).pathname,
        lifecycle: new URL("./lifecycle.html", import.meta.url).pathname,
      },
    },
  },
});
