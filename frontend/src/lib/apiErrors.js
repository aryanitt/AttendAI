import axios from "axios";

export function getApiErrorMessage(err, fallback = "Something went wrong") {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.error;
    if (typeof msg === "string" && msg) return msg;
    if (err.response?.status === 503) {
      return "Database unavailable. Start MongoDB or set MONGO_URI in backend/.env.";
    }
    if (err.code === "ECONNREFUSED" || err.message === "Network Error") {
      return "Cannot reach the API. Run: backend folder → python run.py. Use http://localhost:5173 (Vite dev), not opening index.html directly.";
    }
    if (!err.response) {
      return "No response from server. Is the backend running on port 5000?";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
