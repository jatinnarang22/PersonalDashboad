import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation, useRoutes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { routes } from './router.jsx';
import './style.css';

function AppRoutes() {
  const location = useLocation();
  const { refreshAuth } = useAuth();
  const element = useRoutes(routes);

  useEffect(() => {
    refreshAuth();
  }, [location.pathname, refreshAuth]);

  return element;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
