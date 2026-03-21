import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import NurseDashboard from './pages/NurseDashboard';
import FamilyPortal from './pages/FamilyPortal';
import VisitRoom from './pages/VisitRoom';
import { getUserId } from './api';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/nurse" element={<NurseDashboard />} />
          <Route path="/family" element={<FamilyPortal />} />
          <Route path="/visit/:id" element={<VisitRoom />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
