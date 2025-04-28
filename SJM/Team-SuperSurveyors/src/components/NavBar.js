import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Box,
  Container,
  Menu,
  MenuItem,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { logoutUser, getCurrentUser, getUserInfo } from '../services/userService';
import { ReactComponent as SSLogo } from '../styles/logoDraft.svg';

const NavBar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState({ coins: 0 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    async function fetchInfo() {
      const data = await getUserInfo();
      setUserInfo(data);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    if (isAuthenticated) {
      fetchInfo();
      onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
        setUserInfo(doc.data());
      });
    }

    return () => unsubscribe();
  }, [isAuthenticated, auth]);

  const handleLogout = async () => {
    await logoutUser();
    handleMenuClose();
    navigate('/login');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const navItems = [
    { text: 'View', path: '/view' },
    { text: 'Trending', path: '/trending' },
    { text: 'Create', path: '/create' },
    { text: 'Answer', path: '/answer' },
  ];

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchor}
      open={Boolean(mobileMenuAnchor)}
      onClose={handleMobileMenuClose}
      PaperProps={{
        elevation: 0,
        sx: {
          mt: 1.5,
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {navItems.map((item) => (
        <MenuItem
          key={item.text}
          onClick={() => {
            handleMobileMenuClose();
            navigate(item.path);
          }}
          sx={{ py: 1, px: 2.5 }}
        >
          <Typography variant="body2">{item.text}</Typography>
        </MenuItem>
      ))}
      <Divider />
      <MenuItem onClick={handleLogout} sx={{ py: 1, px: 2.5 }}>
        <Typography variant="body2" color="error">Sign Out</Typography>
      </MenuItem>
    </Menu>
  );

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 64 }}>
          {/* Logo and Brand */}
          <Box
            component={Link}
            to={isAuthenticated ? "/view" : "/"}
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'primary.main'
            }}
          >
            <SSLogo width="30" length="30" className='d-inline-block align-top' />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                letterSpacing: '-0.5px',
                color: 'text.primary',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              SuperSurveyors
            </Typography>
          </Box>

          {isAuthenticated ? (
            <>
              {/* Desktop Navigation */}
              {!isMobile && (
                <Stack 
                  direction="row" 
                  spacing={1} 
                  sx={{ 
                    ml: 4,
                    display: { xs: 'none', md: 'flex' } 
                  }}
                >
                  {navItems.map((item) => (
                    <Button
                      key={item.text}
                      component={Link}
                      to={item.path}
                      size="small"
                      sx={{
                        color: 'text.primary',
                        fontSize: '0.875rem',
                        px: 2,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      {item.text}
                    </Button>
                  ))}
                </Stack>
              )}

              {/* Right Section */}
              <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Coins Display */}
                <Button
                  startIcon={<AccountBalanceWalletIcon />}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.hover' },
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  {userInfo.coins}
                </Button>

                {/* Mobile Menu Button */}
                {isMobile && (
                  <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={handleMobileMenuOpen}
                    sx={{ color: 'text.primary' }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}

                {/* Profile Menu */}
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{ 
                    ml: 1,
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                >
                  <Avatar
                    src={getCurrentUser().photoURL ?? 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg'}
                    alt="Profile"
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      mt: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      minWidth: 180
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      navigate('/profile');
                    }}
                    sx={{ py: 1, px: 2.5 }}
                  >
                    <Typography variant="body2">Profile</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ py: 1, px: 2.5 }}>
                    <Typography variant="body2" color="error">
                      Sign Out
                    </Typography>
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            // Non-authenticated state
            <Box sx={{ ml: 'auto' }}>
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="small"
                sx={{
                  borderRadius: 1,
                  textTransform: 'none',
                  px: 3
                }}
              >
                Sign Up
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
      {renderMobileMenu}
    </AppBar>
  );
};

export default NavBar;