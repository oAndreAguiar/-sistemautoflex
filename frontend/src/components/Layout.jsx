import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const location = useLocation();

  function closeMenu() {
    setOpen(false);
  }

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    function onClickOutside(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  return (
    <>
      <header className="header">
        <div className="nav" ref={wrapRef}>
          <div className="brand">Inventory</div>

          <button
            type="button"
            className="navToggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>

          <nav className={`navLinks ${open ? "open" : ""}`}>
            <NavLink to="/products" onClick={closeMenu}>
              Products
            </NavLink>
            <NavLink to="/raw-materials" onClick={closeMenu}>
              Raw materials
            </NavLink>
            <NavLink to="/production" onClick={closeMenu}>
              Production
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
