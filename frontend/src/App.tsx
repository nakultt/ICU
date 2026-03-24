import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastProvider';
import { ThemeProvider } from './hooks/useTheme';
import FamilyDashboard from './pages/FamilyDashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotificationsPage from './pages/Notifications';
import NurseDashboard from './pages/NurseDashboard';
import PatientDetails from './pages/PatientDetails';
import RoleSelection from './pages/RoleSelection';
import ScheduleVisit from './pages/ScheduleVisit';
import VideoCall from './pages/VideoCall';

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
          <Route path="/family" element={<FamilyDashboard />} />
          <Route path="/admin" element={<NurseDashboard />} />
          <Route path="/schedule" element={<ScheduleVisit />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/patient/:id" element={<PatientDetails />} />
          <Route path="/call/:id" element={<VideoCall />} />
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
