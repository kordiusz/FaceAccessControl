import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        
        <NavLink
          to="/"
          className="text-white text-lg font-semibold tracking-tight hover:text-zinc-300 transition"
        >
          FaceVerify
        </NavLink>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm transition ${
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            Relogin
          </NavLink>
      <NavLink
            to="/users/new"
            className={({ isActive }) =>
              `text-sm transition ${
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            Create User
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              `text-sm transition ${
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            Browse users
          </NavLink>

          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `text-sm transition ${
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            Global logs
          </NavLink>

                    <NavLink
            to="/logs/daily"
            className={({ isActive }) =>
              `text-sm transition ${
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`
            }
          >
            Today
          </NavLink>

        </div>
      </nav>
    </header>
  );
};

export default Navbar;
