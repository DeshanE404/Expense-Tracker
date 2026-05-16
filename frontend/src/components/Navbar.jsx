import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navbarStyles } from '../assets/dummyStyles';
import img1 from '../assets/logo.svg';
import { ChevronDown, LogOut, User, Settings } from 'lucide-react';
import axios from 'axios';


import { API_URL as BASE_URL } from '../config';

const Navbar = ({ user: propUser, onLogout }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(propUser || { name: "", email: "" });
    const menuRef = useRef();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (propUser) {
            setUser(propUser);
        }
    }, [propUser]);

    const toggleMenu = () => setMenuOpen((prev) => !prev);

    const handleLogout = () => {
        setMenuOpen(false);
        localStorage.removeItem("token");
        onLogout?.();
        navigate("/login");
    };


    //fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const response = await axios.get(`${BASE_URL}/user/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const userData = response.data.user || response.data;
                setUser(userData); // Adjust based on actual response structure
            } catch (err) { console.error('Error fetching user data:', err) }
        };
        if (!propUser) {
            fetchUserData();
        }
    }, [propUser]);



    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className={navbarStyles.header}>
            <div className={navbarStyles.container}>
                {/*logo */}
                <div onClick={() => navigate('/')} className={navbarStyles.logoContainer}>
                    <div className={navbarStyles.logoImage}>
                        <img src={img1} alt="Logo" className={navbarStyles.logo} />
                    </div>
                    <span className={navbarStyles.logoText}>Expense Tracker</span>
                </div>
                {/*if user is logged in */}
                {user && (
                    <div className={navbarStyles.userContainer} ref={menuRef}>
                        <button onClick={toggleMenu} className={navbarStyles.userButton}>
                            <div className={navbarStyles.userRelative}>
                                <div className={navbarStyles.userAvatar}>
                                    {user?.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div className={navbarStyles.statusIndicator}></div>
                            </div>
                            <div className={navbarStyles.userTextContainer}>
                                <p className={navbarStyles.userName}>{user?.name || "User"}</p>
                                <p className={navbarStyles.userEmail}>{user?.email || "Email"}</p>
                            </div>
                            <ChevronDown className={navbarStyles.chevronIcon(menuOpen)} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div className={navbarStyles.dropdownMenu}>
                                <div className={navbarStyles.dropdownHeader}>
                                    <p className={navbarStyles.dropdownName}>{user?.name || "User"}</p>
                                    <p className={navbarStyles.dropdownEmail}>{user?.email || "Email"}</p>
                                </div>
                                <div className={navbarStyles.menuItemContainer}>
                                    <button onClick={() => { navigate('/profile'); setMenuOpen(false); }} className={navbarStyles.menuItem}>
                                        <User size={18} /> Profile
                                    </button>

                                </div>
                                <div className={navbarStyles.menuItemBorder}>
                                    <button onClick={handleLogout} className={navbarStyles.logoutButton}>
                                        <LogOut size={18} /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;

