import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function Navbar() {
  const { isAuthenticated, isDemo, username, logout } = useAuth();

  return (
    <nav className="h-13 bg-gray-900 text-white px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <Link to="/" className="text-xl font-bold">
          Code Arena
        </Link>
        {isDemo && (
          <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded">
            Demo
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 min-w-0">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="hover:text-gray-300">
              Dashboard
            </Link>
            <span className="text-gray-400 truncate max-w-[8rem] sm:max-w-none">{username}</span>
            <button onClick={logout} className="text-red-400 hover:text-red-300">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">
            Sign in with GitHub
          </Link>
        )}
      </div>
    </nav>
  );
}
