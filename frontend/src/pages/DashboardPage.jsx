import { useDashboard } from '../hooks/useDashboard.js';
import DashboardView from './dashboard/DashboardView.jsx';

export default function DashboardPage() {
  const d = useDashboard();
  return <DashboardView {...d} />;
}
