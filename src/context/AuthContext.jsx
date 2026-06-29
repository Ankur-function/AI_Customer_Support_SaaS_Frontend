import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

// Check if a valid session cookie already exists when the user opens/refreshes the app
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log(err)
        // If it fails (401), cookie is missing or expired, keep them unauthenticated
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = (userMetadata) => {
    setUser(userMetadata);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // You can call a backend /logout route here to clear the cookie if needed
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be executed within an active AuthProvider layout.");
  }
  return context;
};