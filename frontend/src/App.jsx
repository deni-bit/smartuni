import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';

// ── Public ────────────────────────────────────────────
import Landing  from './pages/Landing';
import Login    from './pages/Login';
import Register from './pages/Register';

// ── Student ───────────────────────────────────────────
import StudentDashboard from './pages/student/StudentDashboard';
import MyCourses        from './pages/student/MyCourses';
import Attendance       from './pages/student/Attendance';
import Grades           from './pages/student/Grades';
import Fees             from './pages/student/Fees';

// ── Faculty ───────────────────────────────────────────
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ManageCoursesFac from './pages/faculty/ManageCourses';
import TakeAttendance   from './pages/faculty/TakeAttendance';
import SubmitGrades     from './pages/faculty/SubmitGrades';

// ── Admin ─────────────────────────────────────────────
import AdminDashboard   from './pages/admin/AdminDashboard';
import ManageUsers      from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCourses    from './pages/admin/ManageCourses';
import FeeManagement    from './pages/admin/FeeManagement';
import Reports          from './pages/admin/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"         element={<Landing  />} />
          <Route path="/login"    element={<Login    />} />
          <Route path="/register" element={<Register />} />

          {/* ── Student ── */}
          <Route path="/student" element={
            <ProtectedRoute studentOnly>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/courses" element={
            <ProtectedRoute studentOnly>
              <MyCourses />
            </ProtectedRoute>
          } />
          <Route path="/student/attendance" element={
            <ProtectedRoute studentOnly>
              <Attendance />
            </ProtectedRoute>
          } />
          <Route path="/student/grades" element={
            <ProtectedRoute studentOnly>
              <Grades />
            </ProtectedRoute>
          } />
          <Route path="/student/fees" element={
            <ProtectedRoute studentOnly>
              <Fees />
            </ProtectedRoute>
          } />

          {/* ── Faculty ── */}
          <Route path="/faculty" element={
            <ProtectedRoute facultyOnly>
              <FacultyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/faculty/courses" element={
            <ProtectedRoute facultyOnly>
              <ManageCoursesFac />
            </ProtectedRoute>
          } />
          <Route path="/faculty/attendance" element={
            <ProtectedRoute facultyOnly>
              <TakeAttendance />
            </ProtectedRoute>
          } />
          <Route path="/faculty/grades" element={
            <ProtectedRoute facultyOnly>
              <SubmitGrades />
            </ProtectedRoute>
          } />

          {/* ── Admin ── */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute adminOnly>
              <ManageUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/departments" element={
            <ProtectedRoute adminOnly>
              <ManageDepartments />
            </ProtectedRoute>
          } />
          <Route path="/admin/courses" element={
            <ProtectedRoute adminOnly>
              <ManageCourses />
            </ProtectedRoute>
          } />
          <Route path="/admin/fees" element={
            <ProtectedRoute adminOnly>
              <FeeManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute adminOnly>
              <Reports />
            </ProtectedRoute>
          } />

          {/* ── Catch all ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;