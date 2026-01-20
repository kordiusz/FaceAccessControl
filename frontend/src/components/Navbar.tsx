import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../firebase-config";
import { signOut } from "firebase/auth";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <NavLink
          to="/"
          className="text-gray-900 text-xl font-bold tracking-tight hover:text-indigo-600 transition"
        >
          FaceVerify
        </NavLink>

        {/* Navigation */}
        <div className="flex items-center gap-8">
          <NavLink
            to="/users/new"
            className={({ isActive }) =>
              `text-sm font-medium transition ${
                isActive
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`
            }
          >
            Create User
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              `text-sm font-medium transition ${
                isActive
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`
            }
          >
            Browse Users
          </NavLink>

                    <NavLink
            to="/logs"
            className={({ isActive }) =>
              `text-sm font-medium transition ${
                isActive
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`
            }
          >
            Logs
          </NavLink>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            Logout
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;