import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import PostJob from './pages/PostJob';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import CompanyProfile from './pages/CompanyProfile';
import OfferLetter from './pages/OfferLetter';

// Create Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists in localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'var(--font-family)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Loading CareerSphere...</div>
      </div>
    );
  }

  // Route wrapper to restrict access to authenticated users
  const PrivateRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Route wrapper to restrict access to Employers only
  const EmployerRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (user.role !== 'employer') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // Route wrapper to restrict access to Admins only
  const AdminRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 80px - 142px)' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/job/:id" element={<JobDetails />} />
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
              <Route 
                path="/post-job" 
                element={
                  <EmployerRoute>
                    <PostJob />
                  </EmployerRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <PrivateRoute>
                    <Chat />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/company/:id" 
                element={<CompanyProfile />} 
              />
              <Route 
                path="/offers/:id" 
                element={
                  <PrivateRoute>
                    <OfferLetter />
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer>
            <div className="container">
              <p>&copy; {new Date().getFullYear()} CareerSphere Inc. All rights reserved. Created with modern aesthetics.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
