// ./components/Login.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, loginGoogleUser } from '../services/userService';
import '../styles/signup.css';
import { getAuth } from 'firebase/auth';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  InputAdornment,
  Fade,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showFailure, setShowFailure] = useState(false);
    const [failureMsg, setFailureMsg] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const auth = getAuth();
        if (auth.currentUser) {
            navigate('/');
        }

    }, [navigate]);

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      navigate('/home'); // Redirect authenticated users to /home
    }

  }, [navigate]);

  const handleLogin = async (e) => { // Renamed from handleSignUp to handleLogin
    e.preventDefault();

    try {
      await loginUser(email, password);
      setShowFailure(false);
      setShowSuccess(true);
      // Redirect to /home instead of /
      setTimeout(() => navigate('/home'), 1000);
    } catch (error) {
      if (error.name === 'FirebaseError' && error.code === 'auth/invalid-email') {
        setFailureMsg("Please enter a valid email address");
      } else if (error.name === 'FirebaseError' && error.code === 'auth/invalid-credential') {
        setFailureMsg("Invalid email and/or password. Press Sign Up if you don't have an account!");
      } else {
        setFailureMsg(error.message);
      }
      setShowFailure(true);
    }
  }

  const handleGoogleLogin = async (e) => {
    e.preventDefault();

    try {
        let userInfo = await loginGoogleUser();
        if (userInfo.isNewUser) {
            navigate(`/onboarding/${userInfo.user.uid}`);
        } else {
            navigate('/home');
        }
        
    } catch(error) {
        console.log("Error trying to login with Google: " + error);
    };

  }

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 6,
          marginBottom: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Welcome Back
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to SuperSurveyors
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mb: 3,
                height: 50,
                borderRadius: 2,
              }}
            >
              Sign In
            </Button>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              onClick={(e) => handleGoogleLogin(e)}
              sx={{ 
                mb: 3,
                height: 50,
                borderRadius: 2,
              }}
            >
              Login with&nbsp;
              <img src='https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' className="d-inline-block align-top" alt="Google logo" />
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button
                  variant="text"
                  onClick={() => navigate('/signup')}
                  sx={{ textTransform: 'none' }}
                >
                  Sign up
                </Button>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ width: '100%', mt: 3 }}>
            <Fade in={showSuccess}>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: showSuccess ? 2 : 0,
                  width: '100%'
                }}
              >
                Successfully signed in!
              </Alert>
            </Fade>

            <Fade in={showFailure}>
              <Alert 
                severity="error"
                sx={{ 
                  mb: showFailure ? 2 : 0,
                  width: '100%'
                }}
              >
                {failureMsg}
              </Alert>
            </Fade>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
