import { Link, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { auth } from "../config/firebase";
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from "../config/firebase";
import { useFavorites } from '../components/FavoritesContext';
import "../App.css";

export default function Header() {
    const [userName, setUserName] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const { favoriteCount } = useFavorites();
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        let unsubscribeUser: () => void;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setLoading(true);
            if (user) {
                setIsAuthenticated(true);

                // Real-time user document listener
                const userRef = doc(db, 'users', user.uid);
                unsubscribeUser = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        setUserName(`${userData.firstName} ${userData.lastName}`);
                        setIsAdmin(userData.isAdmin || false);
                    }
                    setLoading(false);
                });
            } else {
                setUserName(null);
                setIsAuthenticated(false);
                setIsAdmin(false);
                setLoading(false);
                if (unsubscribeUser) unsubscribeUser();
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeUser?.();
        };
    }, [location.pathname]);

    const handleLogout = () => {
        auth.signOut().then(() => {
            navigate("/login");
        });
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar
                position="static"
                sx={{
                    background: 'linear-gradient(45deg, #1E3A8A, #3B82F6)',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                }}
            >
                <Toolbar sx={{ padding: '0 20px', display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 3 }}
                        >
                            {/* Add a logo or icon here if necessary */}
                        </IconButton>
                        <Typography
                            variant="h6"
                            component={Link}
                            to="/"
                            sx={{
                                fontFamily: 'Roboto, sans-serif',
                                fontWeight: 'bold',
                                textDecoration: 'none',
                                color: 'inherit',
                            }}
                        >
                            Flat Finder
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {loading ? (
                            <Typography variant="h6" color="inherit">Loading...</Typography>
                        ) : isAuthenticated && userName ? (
                            <Typography variant="h6" color="inherit">
                                Hi, {userName}!
                            </Typography>
                        ) : null}

                        <Button
                            color="inherit"
                            component={Link}
                            to="/"
                            sx={{
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: "20px",
                                willChange: "background-color, transform",
                                "&:before": {
                                    content: '""',
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "#4C8BF5",
                                    borderRadius: "inherit",
                                    opacity: 0,
                                    transition: "opacity 0.15s ease-in-out",
                                    zIndex: -1,
                                },
                                "&:hover:before": {
                                    opacity: 1,
                                },
                                "&:hover": {
                                    color: "#fff",
                                }
                            }}
                        >
                            Home
                        </Button>

                        {isAuthenticated && (
                            <>
                                <Button
                                    color="inherit"
                                    onClick={handleMenuOpen}
                                    sx={{
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: "20px",
                                        willChange: "background-color, transform",
                                        "&:before": {
                                            content: '""',
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "#4C8BF5",
                                            borderRadius: "inherit",
                                            opacity: 0,
                                            transition: "opacity 0.15s ease-in-out",
                                            zIndex: -1,
                                        },
                                        "&:hover:before": {
                                            opacity: 1,
                                        },
                                        "&:hover": {
                                            color: "#fff",
                                        }
                                    }}
                                >
                                    Flats
                                </Button>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem
                                        component={Link}
                                        to="/new-flat"
                                        onClick={handleMenuClose}
                                    >
                                        New Flat
                                    </MenuItem>
                                    <MenuItem
                                        component={Link}
                                        to="/my-flats"
                                        onClick={handleMenuClose}
                                    >
                                        My Flats
                                    </MenuItem>
                                </Menu>
                            </>
                        )}

                        <IconButton
                            color="inherit"
                            component={Link}
                            to="/favorites"
                            sx={{
                                position: "relative",
                                borderRadius: "20px",
                                willChange: "background-color, transform",
                                padding: "8px",
                                "&:before": {
                                    content: '""',
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "#4C8BF5",
                                    borderRadius: "inherit",
                                    opacity: 0,
                                    transition: "opacity 0.15s ease-in-out",
                                    zIndex: -1,
                                },
                                "&:hover:before": {
                                    opacity: 1,
                                },
                                "&:hover": {
                                    color: "#fff",
                                }
                            }}
                        >
                            <Badge
                                badgeContent={favoriteCount}
                                color="error"
                                sx={{ margin: "4px" }}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                            >
                                <FavoriteIcon />
                            </Badge>
                        </IconButton>

                        {isAuthenticated && (
                            <Button
                                color="inherit"
                                component={Link}
                                to="/profile"
                                sx={{
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: "20px",
                                    willChange: "background-color, transform",
                                    "&:before": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        backgroundColor: "#4C8BF5",
                                        borderRadius: "inherit",
                                        opacity: 0,
                                        transition: "opacity 0.15s ease-in-out",
                                        zIndex: -1,
                                    },
                                    "&:hover:before": {
                                        opacity: 1,
                                    },
                                    "&:hover": {
                                        color: "#fff",
                                    }
                                }}
                            >
                                Profile
                            </Button>
                        )}

                        {isAuthenticated && isAdmin && (
                            <Button
                                color="inherit"
                                component={Link}
                                to="/admin"
                                sx={{
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: "20px",
                                    willChange: "background-color, transform",
                                    "&:before": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        backgroundColor: "#4C8BF5",
                                        borderRadius: "inherit",
                                        opacity: 0,
                                        transition: "opacity 0.15s ease-in-out",
                                        zIndex: -1,
                                    },
                                    "&:hover:before": {
                                        opacity: 1,
                                    },
                                    "&:hover": {
                                        color: "#fff",
                                    }
                                }}
                            >
                                Admin Panel
                            </Button>
                        )}

                        {!isAuthenticated && (
                            <>
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/login"
                                    sx={{
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: "20px",
                                        willChange: "background-color, transform",
                                        "&:before": {
                                            content: '""',
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "#4C8BF5",
                                            borderRadius: "inherit",
                                            opacity: 0,
                                            transition: "opacity 0.15s ease-in-out",
                                            zIndex: -1,
                                        },
                                        "&:hover:before": {
                                            opacity: 1,
                                        },
                                        "&:hover": {
                                            color: "#fff",
                                        }
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    color="inherit"
                                    component={Link}
                                    to="/sign-up"
                                    sx={{
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: "20px",
                                        willChange: "background-color, transform",
                                        "&:before": {
                                            content: '""',
                                            position: "absolute",
                                            inset: 0,
                                            backgroundColor: "#4C8BF5",
                                            borderRadius: "inherit",
                                            opacity: 0,
                                            transition: "opacity 0.15s ease-in-out",
                                            zIndex: -1,
                                        },
                                        "&:hover:before": {
                                            opacity: 1,
                                        },
                                        "&:hover": {
                                            color: "#fff",
                                        }
                                    }}
                                >
                                    Sign Up
                                </Button>
                            </>
                        )}

                        {isAuthenticated && (
                            <Button
                                color="inherit"
                                onClick={handleLogout}
                                sx={{
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: "20px",
                                    willChange: "background-color, transform",
                                    "&:before": {
                                        content: '""',
                                        position: "absolute",
                                        inset: 0,
                                        backgroundColor: "#4C8BF5",
                                        borderRadius: "inherit",
                                        opacity: 0,
                                        transition: "opacity 0.15s ease-in-out",
                                        zIndex: -1,
                                    },
                                    "&:hover:before": {
                                        opacity: 1,
                                    },
                                    "&:hover": {
                                        color: "#fff",
                                    }
                                }}
                            >
                                Logout
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>
    );
}