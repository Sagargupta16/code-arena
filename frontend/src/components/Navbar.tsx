import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Navbar() {
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">
        Code Arena
      </Link>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="hover:text-gray-300">
              Dashboard
            </Link>
            <span className="text-gray-400">{username}</span>
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
