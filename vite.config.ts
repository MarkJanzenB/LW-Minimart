import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc"; 
import { componentTagger } from "lovable-tagger"; 

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::", 
      port: 5173, 
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});