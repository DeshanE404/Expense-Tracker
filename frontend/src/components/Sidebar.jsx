import React, { useRef, useState, useEffect } from 'react';
import { cn, sidebarStyles } from '../assets/dummyStyles';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard as Home,
  ArrowUpCircle as ArrowUp,
  ArrowDownCircle as ArrowDown,
  User,
  HelpCircle,
  LogOut,
  X,
  Menu
} from 'lucide-react';

const MENU_ITEMS = [
  { text: "Dashboard", path: "/", icon: <Home size={20} /> },
  { text: "Income", path: "/income", icon: <ArrowUp size={20} /> },
  { text: "Expenses", path: "/expense", icon: <ArrowDown size={20} /> },
  { text: "Profile", path: "/profile", icon: <User size={20} /> },
];

const Sidebar = ({ user, isCollapsed, setIsCollapsed }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileHover, setMobileHover] = useState(false);
  const [activeHover, setActiveHover] = useState(null);

  const { name: username = "User", email = "Email" } = user || {};
  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed((c) => !c);
  };

  const renderMenuItem = ({ text, path, icon }) => {
    const isActive = pathname === path;

    return (
      <motion.li key={text} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          to={path}
          className={cn(
            sidebarStyles.menuItem.base,
            isActive ? sidebarStyles.menuItem.active : sidebarStyles.menuItem.inactive,
            isCollapsed
              ? sidebarStyles.menuItem.collapsed
              : sidebarStyles.menuItem.expanded
          )}
          onMouseEnter={() => setActiveHover(text)}
          onMouseLeave={() => setActiveHover(null)}
        >
          <span className={isActive ? sidebarStyles.menuIcon.active : sidebarStyles.menuIcon.inactive}>
            {icon}
          </span>

          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {text}
            </motion.span>
          )}

          {activeHover === text && !isActive && !isCollapsed && (
            <span className={sidebarStyles.activeIndicator}></span>
          )}
        </Link>
      </motion.li>
    );
  };

  return (
    <>
      <motion.div
        ref={sidebarRef}
        className={sidebarStyles.sidebarContainer.base}
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        exit={{ x: -250 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className={sidebarStyles.sidebarInner.base}>
          <div className={cn(sidebarStyles.userProfileContainer.base, 
            isCollapsed ? sidebarStyles.userProfileContainer.collapsed : sidebarStyles.userProfileContainer.expanded)}>
            <div className="flex items-center gap-3">
              <div className={sidebarStyles.userInitials.base}>
                {initial}
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <p className="font-semibold text-gray-800 text-sm">{username}</p>
                  <p className="text-xs text-gray-500">{email}</p>
                </motion.div>
              )}
            </div>
          </div>

          <button
            onClick={toggleSidebar}
            className={sidebarStyles.toggleButton.base}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline
                  points={isCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}
                />
              </svg>
            </motion.div>
          </button>

          <ul>
            {MENU_ITEMS.map((item) => renderMenuItem(item))}
          </ul>
        </div>

        <div className={cn(sidebarStyles.footerContainer.base,
          isCollapsed ? sidebarStyles.footerContainer.collapsed : sidebarStyles.footerContainer.expanded)
        }>
          <a
            className={cn(
              sidebarStyles.footerLink.base,
              isCollapsed && sidebarStyles.footerLink.collapsed
            )}
            href="https://my-portfolio-mu-ten-79.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HelpCircle size={20} className="text-gray-400" />
            {!isCollapsed && <span className="ml-2">Help & Support</span>}
          </a>

          <button
            onClick={handleLogout}
            className={cn(sidebarStyles.logoutButton.base,
              isCollapsed && sidebarStyles.logoutButton.collapsed
            )}
          >
            <LogOut size={20} className="text-gray-400" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </button>
        </div>
      </motion.div>

      <motion.button 
        onClick={() => setMobileOpen((prev) => !prev)} 
        className={sidebarStyles.mobileMenuButton}
        whileHover={{ scale: 1.05}}
        whileTap={{ scale: 0.95}}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={20} />}
      </motion.button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={sidebarStyles.mobileOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
          >
            <div className={sidebarStyles.mobileBackdrop} />

            <motion.div
              ref={sidebarRef}
              className={`${sidebarStyles.mobileSidebar.base} lg:hidden`}
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={sidebarStyles.mobileHeader}>
                <div className="flex items-center gap-2">
                  <div className={sidebarStyles.userInitials.base}>
                    {initial}
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-semibold text-gray-800">{username}</p>
                    <p className="text-xs text-gray-500">{email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className={sidebarStyles.mobileCloseButton}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <ul className={sidebarStyles.mobileMenuList}>
                  {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <motion.li
                        key={item.text}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            sidebarStyles.mobileMenuItem.base,
                            isActive
                              ? sidebarStyles.mobileMenuItem.active
                              : sidebarStyles.mobileMenuItem.inactive
                          )}
                        >
                          <span
                            className={
                              isActive
                                ? "text-teal-600"
                                : "text-gray-500"
                            }
                          >
                            {item.icon}
                          </span>
                          <span>{item.text}</span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>

              <div className={sidebarStyles.mobileFooter}>
                <a
                  className={sidebarStyles.mobileFooterLink}
                  href="https://my-portfolio-mu-ten-79.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HelpCircle size={20} className="text-gray-400" />
                  <span>Help & Support</span>
                </a>

                <button
                  onClick={handleLogout}
                  className={sidebarStyles.mobileLogoutButton}
                >
                  <LogOut size={20} className="text-gray-400" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;