import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import App from './App.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import GitHubWorkspacePage from './pages/GitHubWorkspacePage.jsx';
import IntegrationWorkspacePage from './pages/IntegrationWorkspacePage.jsx';
import BlogPage from './pages/BlogPage.jsx';

function RequireAuth({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();
  if (!currentUser) {
    const redirect = location.pathname !== '/' ? `?redirect=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${redirect}`} replace />;
  }
  return children;
}

function GuestOnly({ children }) {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/" replace />;
  return children;
}

function ProfileRoute() {
  const { profileComplete } = useAuth();
  const location = useLocation();
  if (profileComplete && new URLSearchParams(location.search).get('edit') !== '1') {
    return <Navigate to="/" replace />;
  }
  return <ProfilePage />;
}

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <RequireAuth><DashboardPage /></RequireAuth> },
      { path: 'login', element: <GuestOnly><LoginPage /></GuestOnly> },
      { path: 'register', element: <GuestOnly><RegisterPage /></GuestOnly> },
      { path: 'profile', element: <RequireAuth><ProfileRoute /></RequireAuth> },
      { path: 'integrations/github', element: <RequireAuth><GitHubWorkspacePage /></RequireAuth> },
      { path: 'integrations/:platform', element: <RequireAuth><IntegrationWorkspacePage /></RequireAuth> },
      { path: 'integrations', element: <RequireAuth><IntegrationsPage /></RequireAuth> },
      { path: 'blog', element: <RequireAuth><BlogPage /></RequireAuth> },
    ],
  },
];
