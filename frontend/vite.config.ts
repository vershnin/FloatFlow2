import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    server: {
      host: "localhost",
      port: 5173,
      proxy: {
        "/api": {
          target: process.env.VITE_API_BASE_URL?.replace('/api', '') || "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: {
        overlay: false,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Code splitting for better performance
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            charts: ['recharts'],
            utils: ['axios', 'date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },
      // Enable source maps for production debugging
      sourcemap: !isProduction,
      // Minify for production
      minify: isProduction ? 'terser' : false,
      // Compression
      reportCompressedSize: false,
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  };
});
