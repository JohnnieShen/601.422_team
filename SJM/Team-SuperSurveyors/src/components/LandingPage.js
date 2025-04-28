import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
} from '@mui/material';
import {
  Assessment,
  People,
  TrendingUp,
  Psychology,
  Person,
  GitHub,
  CheckCircle,
  CompareArrows,
  Timeline,
  Category,
  Search,
  Recommend,
  Security,
} from '@mui/icons-material';

const LandingPage = () => {
  const navigate = useNavigate();

  // Updated lighter color palette
  const colors = {
    background: '#f9f9f9', // Light background
    paper: '#ffffff',       // White paper
    accent: '#f0f0f0',      // Light grey accent
    primary: '#1976d2',     // MUI primary color
    secondary: '#9c27b0',   // MUI secondary color
    text: '#333333',        // Dark text for readability
    textSecondary: '#555555',// Medium dark text
    border: '#e0e0e0',      // Light border
    success: '#4caf50',     // MUI success color
  };

  const teamMembers = [
    { name: 'Larry Cai', github: 'larrythelog' },
    { name: 'Jianwei Chen', github: 'jchen362' },
    { name: 'Mia Jin', github: 'zhengyue4499' },
    { name: 'Noah Park', github: 'noahpark101' },
    { name: 'Xin Tan', github: 'tanx3036' },
    { name: 'Jiayi Zhang', github: 'jiayizhang-evelynn' },
  ];

  const features = [
    {
      icon: <Assessment />,
      title: 'Survey Creation',
      description: 'Create customized surveys with multiple question types',
    },
    {
      icon: <CompareArrows />,
      title: 'Survey Coins',
      description: 'Earn and spend coins through active participation',
    },
    {
      icon: <Timeline />,
      title: 'Analytics',
      description: 'Comprehensive data visualization and analysis tools',
    },
    {
      icon: <Category />,
      title: 'Categorization',
      description: 'Organize surveys with tags and categories',
    },
  ];

  return (
    <Box sx={{ bgcolor: colors.background, color: colors.text, minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: colors.paper,
          py: 12,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                fontWeight="bold"
                sx={{ color: colors.text }}
              >
                SuperSurveyors
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mb: 4, color: colors.textSecondary }}
              >
                Revolutionizing Survey Distribution
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ mb: 4, color: colors.textSecondary }}
              >
                Break free from convenience bias with our innovative survey platform.
                Connect with diverse participants and get meaningful responses.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/signup')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    bgcolor: colors.primary,
                    '&:hover': {
                      bgcolor: colors.secondary,
                    },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    color: colors.primary,
                    borderColor: colors.primary,
                    '&:hover': {
                      borderColor: colors.secondary,
                      color: colors.secondary,
                    },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={1}
                sx={{
                  p: 4,
                  bgcolor: colors.accent,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ color: colors.text }}>
                  Platform Benefits
                </Typography>
                <List>
                  {[
                    'Eliminate survey bias',
                    'Incentivized participation',
                    'Reach diverse audiences',
                    'Detailed analytics',
                  ].map((text, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle sx={{ color: colors.success }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={text} 
                        sx={{ 
                          '& .MuiListItemText-primary': { 
                            color: colors.textSecondary 
                          } 
                        }} 
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ color: colors.text }}
        >
          Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  bgcolor: colors.paper,
                  border: `1px solid ${colors.border}`,
                  transition: '0.3s',
                  '&:hover': {
                    bgcolor: colors.accent,
                    transform: 'translateY(-5px)',
                  },
                }}
                elevation={2}
              >
                <Avatar
                  sx={{
                    bgcolor: colors.primary,
                    width: 56,
                    height: 56,
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ color: colors.text }}>
                  {feature.title}
                </Typography>
                <Typography sx={{ color: colors.textSecondary }}>
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works */}
      <Box sx={{ bgcolor: colors.paper, py: 8 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            textAlign="center" 
            gutterBottom
            sx={{ color: colors.text }}
          >
            How It Works
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: colors.accent, height: '100%' }} elevation={1}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: colors.text }}>
                    For Survey Creators
                  </Typography>
                  <List>
                    {['Create surveys', 'Reach participants', 'Analyze results'].map((text, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle sx={{ color: colors.success }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={text} 
                          sx={{ 
                            '& .MuiListItemText-primary': { 
                              color: colors.textSecondary 
                            } 
                          }} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: colors.accent, height: '100%' }} elevation={1}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: colors.text }}>
                    For Participants
                  </Typography>
                  <List>
                    {['Earn coins', 'Complete surveys', 'Get matched'].map((text, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle sx={{ color: colors.success }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={text} 
                          sx={{ 
                            '& .MuiListItemText-primary': { 
                              color: colors.textSecondary 
                            } 
                          }} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ color: colors.text }}
        >
          Our Team
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: colors.paper,
                  border: `1px solid ${colors.border}`,
                  transition: '0.3s',
                  '&:hover': {
                    bgcolor: colors.accent,
                    transform: 'translateY(-3px)',
                  },
                }}
                elevation={2}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: colors.primary,
                  }}
                >
                  <Person />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ color: colors.text }}>
                  {member.name}
                </Typography>
                <Chip
                  icon={<GitHub />}
                  label={member.github}
                  variant="outlined"
                  sx={{
                    color: colors.textSecondary,
                    borderColor: colors.border,
                    '&:hover': {
                      borderColor: colors.primary,
                      backgroundColor: colors.accent,
                    },
                  }}
                  component="a"
                  href={`https://github.com/${member.github}`}
                  target="_blank"
                  clickable
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: colors.paper, py: 4, borderTop: `1px solid ${colors.border}` }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center" sx={{ color: colors.textSecondary }}>
            © 2024 SuperSurveyors. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
