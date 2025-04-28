import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoutes";

// Component imports
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import NavBar from "./components/NavBar";
import Signup from "./components/Signup";
import SurveyForm from "./components/Survey";
import SurveyView from "./components/SurveyView";
import UserView from "./components/UserView";
import AnswerSurvey from "./components/answerSurvey";
import Onboarding from "./components/Onboarding";
import SurveyDetailView from './components/SurveyDetailView';
import SurveyResults from './components/SurveyResults';
import TrendingView from "./components/TrendingView";

const App = () => {
  return (
    <Router>
      {/* NavBar will not show on landing page */}
      <Routes>
        <Route path="/*" element={<LandingPage />} />

        {/* Auth Routes - with NavBar */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding/:userId" element={<Onboarding />} />
        </Route>

        {/* Protected Routes - with NavBar */}
        <Route element={<ProtectedLayout />}>
          <Route path="/home" element={<SurveyView />} />
          <Route path="/create" element={<SurveyForm />} />
          <Route path="/view" element={<SurveyView />} />
          <Route path="/profile" element={<UserView />} />
          <Route path="/answer/:surveyId" element={<AnswerSurvey />} />
          <Route path="/answer" element={<AnswerSurvey />} />
          <Route path="/trending" element={<TrendingView />} />
          <Route path="/survey-view/:surveyId" element={<SurveyDetailView />} />
          <Route path="/survey-results/:surveyId" element={<SurveyResults />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/*" replace />} />
      </Routes>
    </Router>
  );
};

// Layout component for routes that need NavBar but don't need authentication
const AuthLayout = () => {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding/:userId" element={<Onboarding />} />
      </Routes>
    </>
  );
};

// Layout component for protected routes with NavBar
const ProtectedLayout = () => {
  return (
    <>
      <NavBar />
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<SurveyView />} />
          <Route path="/create" element={<SurveyForm />} />
          <Route path="/view" element={<SurveyView />} />
          <Route path="/profile" element={<UserView />} />
          <Route path="/answer" element={<AnswerSurvey />} />
          <Route path="/answer/:surveyId" element={<AnswerSurvey />} />

          <Route path="/trending" element={<TrendingView />} />
          <Route path="/survey-view/:surveyId" element={<SurveyDetailView />} />
          <Route path="/survey-results/:surveyId" element={<SurveyResults />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
