// In a real production app, this should be an environment variable.
// Using the provided key for the demo as requested.
export const DEFAULT_API_KEY = "dc7bdff46c004fcd87d050fef851f30d.lJaihNuvDsbIdL5y";

export const THEME = {
  colors: {
    primary: "#f97316", // Orange
    secondary: "#06b6d4", // Cyan
    background: "#0a0a0f",
    surface: "#12121a",
  },
  gradients: {
    primary: "from-orange-500 to-cyan-500",
    text: "bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent",
    surface: "bg-white/5 backdrop-blur-xl border border-white/10",
  }
};

export const API_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/async-result"; // General Async result endpoint
export const UPLOAD_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/files"; // File upload endpoint (if needed)

// Since we are mocking the backend logic described in the PRD (Python splitting),
// We will try to hit the direct GLM API if possible, or simulate the perfect experience
// if the browser CORS restricts us (which is common for Server-to-Server APIs).
