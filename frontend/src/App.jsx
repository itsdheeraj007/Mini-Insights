import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import InsightDetail from './pages/InsightDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/"           element={<Dashboard />} />
      <Route path="/insights/:id" element={<InsightDetail />} />
    </Routes>
  );
}
