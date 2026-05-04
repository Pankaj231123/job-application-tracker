import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../lib/api';

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        await getMe();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    }

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}