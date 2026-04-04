import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">Code Arena</h1>
      <p className="text-xl text-gray-400 mb-8 max-w-md text-center">
        Race your friends to solve coding problems. Real-time competition with built-in C++ and Python execution.
      </p>
      <Link to="/login" className="bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-500">
        Sign in with GitHub
      </Link>
    </div>
  );
}
