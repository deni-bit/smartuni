import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ── Attach token ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('smartuniUser'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// ── Handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartuniUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser    = (data) => api.post('/auth/login',    data);
export const getProfile   = ()     => api.get('/auth/profile');
export const updateProfile      = (data) => api.put('/auth/profile',         data);
export const changePassword     = (data) => api.put('/auth/change-password', data);

// ── Students ──────────────────────────────────────────
export const getAllStudents      = (params) => api.get('/students',              { params });
export const getStudentById      = (id)     => api.get(`/students/${id}`);
export const getMyStudentProfile = ()       => api.get('/students/me');
export const updateStudent       = (id, data) => api.put(`/students/${id}`,     data);
export const getStudentGrades    = (id)     => api.get(`/students/${id}/grades`);
export const getStudentAttendance= (id)     => api.get(`/students/${id}/attendance`);
export const getStudentFees      = (id)     => api.get(`/students/${id}/fees`);

// ── Faculty ───────────────────────────────────────────
export const getAllFaculty        = (params) => api.get('/faculty',              { params });
export const getFacultyById       = (id)     => api.get(`/faculty/${id}`);
export const getMyFacultyProfile  = ()       => api.get('/faculty/me');
export const getMyStudents        = ()       => api.get('/faculty/my-students');
export const updateFaculty        = (id, data) => api.put(`/faculty/${id}`,     data);

// ── Courses ───────────────────────────────────────────
export const getCourses           = (params) => api.get('/courses',             { params });
export const getCourseById        = (id)     => api.get(`/courses/${id}`);
export const createCourse         = (data)   => api.post('/courses',            data);
export const updateCourse         = (id, data) => api.put(`/courses/${id}`,     data);
export const deleteCourse         = (id)     => api.delete(`/courses/${id}`);
export const getMyCourses         = ()       => api.get('/courses/my');

// ── Enrollments ───────────────────────────────────────
export const getAllEnrollments     = (params) => api.get('/enrollments',         { params });
export const getMyEnrollments      = ()       => api.get('/enrollments/my');
export const enrollCourse          = (data)   => api.post('/enrollments',        data);
export const dropCourse            = (id)     => api.patch(`/enrollments/${id}/drop`);
export const getCourseEnrollments  = (id)     => api.get(`/enrollments/course/${id}`);

// ── Attendance ────────────────────────────────────────
export const markAttendance        = (data)   => api.post('/attendance/mark',    data);
export const getMyAttendance       = (params) => api.get('/attendance/my',       { params });
export const getCourseAttendance   = (id, params) => api.get(`/attendance/course/${id}`, { params });
export const getFacultyAttSummary  = ()       => api.get('/attendance/faculty-summary');

// ── Grades ────────────────────────────────────────────
export const submitGrades          = (data)   => api.post('/grades/submit',      data);
export const getMyGrades           = ()       => api.get('/grades/my');
export const getCourseGrades       = (id, params) => api.get(`/grades/course/${id}`, { params });
export const approveGrades         = (id, data)   => api.patch(`/grades/approve/${id}`, data);

// ── Fees ─────────────────────────────────────────────
export const getAllFees             = (params) => api.get('/fees',               { params });
export const getMyFees             = ()       => api.get('/fees/my');
export const createFee             = (data)   => api.post('/fees',               data);
export const recordPayment         = (id, data) => api.patch(`/fees/${id}/pay`,  data);
export const waiveFee              = (id, data) => api.patch(`/fees/${id}/waive`,data);
export const getFeeStats           = (params) => api.get('/fees/stats',          { params });

// ── Notifications ─────────────────────────────────────
export const getMyNotifications    = (params) => api.get('/notifications',       { params });
export const markNotifAsRead       = (id)     => api.patch(`/notifications/${id}/read`);
export const markAllNotifAsRead    = ()       => api.patch('/notifications/read-all');
export const sendNotification      = (data)   => api.post('/notifications/send', data);
export const deleteNotification    = (id)     => api.delete(`/notifications/${id}`);

// ── Admin ─────────────────────────────────────────────
export const getAllUsers            = ()       => api.get('/admin/users');
export const toggleUserStatus      = (id)     => api.patch(`/admin/users/${id}/toggle`);
export const getAdminDepartments   = ()       => api.get('/admin/departments');
export const createDepartment      = (data)   => api.post('/admin/departments',  data);
export const updateDepartment      = (id, data) => api.put(`/admin/departments/${id}`, data);

// ── Reports ───────────────────────────────────────────
export const getReportSummary      = ()       => api.get('/reports/summary');
export const getEnrollByDept       = ()       => api.get('/reports/enrollment-by-department');
export const getGradeDistribution  = ()       => api.get('/reports/grade-distribution');
export const getFeeCollection      = (params) => api.get('/reports/fee-collection',     { params });
export const getFinancialOverview  = (params) => api.get('/reports/financial-overview', { params });
export const getTopStudents        = (params) => api.get('/reports/top-students',       { params });
export const getAttendanceReport   = (params) => api.get('/reports/attendance',         { params });

export default api;