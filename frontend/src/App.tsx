import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastProvider';
import { ThemeProvider } from './hooks/useTheme';
import { getToken, getUserRole } from './api';

import FamilyDashboard from './pages/FamilyDashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotificationsPage from './pages/Notifications';
import NurseDashboard from './pages/NurseDashboard';
import NursePatients from './pages/NursePatients';
import PatientDetails from './pages/PatientDetails';
import RoleSelection from './pages/RoleSelection';
import ScheduleVisit from './pages/ScheduleVisit';
import VisitRoom from './pages/VisitRoom';
import MessagesPage from './pages/Messages';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const token = getToken();
  const role = getUserRole();

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'nurse' || role === 'admin' ? '/admin' : '/family'} replace />;
  }
  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/roles" element={<RoleSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/family" element={<ProtectedRoute allowedRoles={['family']}><FamilyDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['nurse', 'admin']}><NurseDashboard /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['nurse', 'admin']}><NursePatients /></ProtectedRoute>} />
          
          <Route path="/schedule" element={<ProtectedRoute allowedRoles={['family']}><ScheduleVisit /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['family', 'nurse', 'admin']}><NotificationsPage /></ProtectedRoute>} />
          <Route path="/patient/:id" element={<ProtectedRoute allowedRoles={['family']}><PatientDetails /></ProtectedRoute>} />
          <Route path="/call/:id" element={<ProtectedRoute allowedRoles={['family', 'nurse', 'admin']}><VisitRoom /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute allowedRoles={['family']}><MessagesPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
