import { Link } from "react-router";

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-5xl sm:text-6xl font-bold mb-4 text-center">Code Arena</h1>
      <p className="text-xl text-gray-400 mb-8 max-w-md text-center">
        Race your friends to solve coding problems. Real-time competition with built-in C++ and Python execution.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link to="/demo" className="bg-emerald-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-emerald-500">
          Try the demo
        </Link>
        <Link to="/login" className="bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-500">
          Sign in with GitHub
        </Link>
      </div>
      <p className="mt-4 text-sm text-gray-500 max-w-sm text-center">
        The demo needs no account: you race two bots through a 3-minute match on a simulated judge that runs in your browser.
      </p>
    </div>
  );
}
