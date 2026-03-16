const mongoose     = require('mongoose');
const dotenv       = require('dotenv');
const User         = require('../models/User');
const Student      = require('../models/Student');
const Faculty      = require('../models/Faculty');
const Department   = require('../models/Department');
const Course       = require('../models/Course');
const Enrollment   = require('../models/Enrollment');
const Attendance   = require('../models/Attendance');
const Grade        = require('../models/Grade');
const Fee          = require('../models/Fee');
const Notification = require('../models/Notification');

dotenv.config();

const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    await Promise.all([
      User.deleteMany({}), Student.deleteMany({}), Faculty.deleteMany({}),
      Department.deleteMany({}), Course.deleteMany({}), Enrollment.deleteMany({}),
      Attendance.deleteMany({}), Grade.deleteMany({}), Fee.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // ── Departments ───────────────────────────────────
    const departments = await Department.create([
      { name: 'Computer Science',        code: 'CS',   description: 'Computing, software engineering and AI' },
      { name: 'Business Administration', code: 'BBA',  description: 'Business, management and entrepreneurship' },
      { name: 'Electrical Engineering',  code: 'EE',   description: 'Electrical systems, electronics and power' },
      { name: 'Mathematics',             code: 'MATH', description: 'Pure and applied mathematics' },
      { name: 'Medicine',                code: 'MED',  description: 'Medical and health sciences' },
    ]);
    const [cs, bba, ee, math, med] = departments;

    // ── Admin ─────────────────────────────────────────
    const admin = await User.create({
      name: 'Super Admin', email: 'admin@smartuni.com',
      password: 'Admin@1234', role: 'admin', phone: '+255700000001',
    });

    // ── Faculty ───────────────────────────────────────
    const facultyData = [
      { name: 'Dr. James Okonkwo',  email: 'james@smartuni.com',  dept: cs,   id: 'FAC2401', desig: 'Associate Professor', qual: 'PhD Computer Science',    spec: 'AI & Machine Learning' },
      { name: 'Prof. Amina Hassan', email: 'amina@smartuni.com',  dept: bba,  id: 'FAC2402', desig: 'Professor',           qual: 'PhD Business Admin',      spec: 'Strategic Management'  },
      { name: 'Dr. Luca Bianchi',   email: 'luca@smartuni.com',   dept: ee,   id: 'FAC2403', desig: 'Assistant Professor', qual: 'PhD Electrical Eng',      spec: 'Power Systems'         },
      { name: 'Dr. Sofia Reyes',    email: 'sofia@smartuni.com',  dept: math, id: 'FAC2404', desig: 'Lecturer',            qual: 'MSc Mathematics',         spec: 'Statistics & Calculus' },
      { name: 'Prof. Yuki Tanaka',  email: 'yuki@smartuni.com',   dept: cs,   id: 'FAC2405', desig: 'Professor',           qual: 'PhD Software Engineering',spec: 'Distributed Systems'   },
      { name: 'Dr. Fatuma Ally',    email: 'fatuma@smartuni.com', dept: med,  id: 'FAC2406', desig: 'Associate Professor', qual: 'PhD Medicine',            spec: 'Internal Medicine'     },
      { name: 'Mr. Peter Kamau',    email: 'pkamau@smartuni.com', dept: ee,   id: 'FAC2407', desig: 'Lecturer',            qual: 'MSc Electrical Eng',      spec: 'Digital Electronics'   },
      { name: 'Dr. Grace Mwangi',   email: 'grace@smartuni.com',  dept: bba,  id: 'FAC2408', desig: 'Assistant Professor', qual: 'PhD Finance',             spec: 'Corporate Finance'     },
      { name: 'Prof. Samuel Oduya', email: 'samuel@smartuni.com', dept: math, id: 'FAC2409', desig: 'Professor',           qual: 'PhD Applied Mathematics', spec: 'Numerical Analysis'    },
      { name: 'Dr. Zara Abdallah',  email: 'zara@smartuni.com',   dept: cs,   id: 'FAC2410', desig: 'Lecturer',            qual: 'MSc Computer Science',    spec: 'Cybersecurity'         },
    ];

    const facultyUsers = [], facultyProfiles = [];
    for (const f of facultyData) {
      const u = await User.create({ name: f.name, email: f.email, password: '123456', role: 'faculty' });
      const p = await Faculty.create({ user: u._id, facultyId: f.id, department: f.dept._id, designation: f.desig, qualification: f.qual, specialization: f.spec });
      facultyUsers.push(u); facultyProfiles.push(p);
    }
    const fp = (i) => facultyProfiles[i]._id;

    await Department.findByIdAndUpdate(cs._id,   { head: facultyUsers[0]._id });
    await Department.findByIdAndUpdate(bba._id,  { head: facultyUsers[1]._id });
    await Department.findByIdAndUpdate(ee._id,   { head: facultyUsers[2]._id });
    await Department.findByIdAndUpdate(math._id, { head: facultyUsers[3]._id });
    await Department.findByIdAndUpdate(med._id,  { head: facultyUsers[5]._id });
    console.log(`Created ${facultyProfiles.length} faculty`);

    // ── Courses — 7 per year per semester per dept ────
    const ay = '2025/2026';
    const mkCourse = (title, code, dept, fac, cr, sem, yr, cap, room, days, st, et) => ({
      title, code, description: `${title} — ${dept.code} Year ${yr} Sem ${sem}`,
      department: dept._id, faculty: fac, credits: cr, semester: sem, year: yr,
      capacity: cap, enrolled: 0, academicYear: ay, status: 'active',
      schedule: { days, startTime: st, endTime: et, room },
    });

    const courseList = [
      // CS Y1S1
      mkCourse('Introduction to Programming',     'CS101', cs, fp(0), 3, 1, 1, 60, 'CS-101', ['Mon','Wed','Fri'], '08:00','09:00'),
      mkCourse('Computer Fundamentals',           'CS102', cs, fp(4), 3, 1, 1, 60, 'CS-102', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Mathematics for Computing I',     'CS103', cs, fp(3), 4, 1, 1, 60, 'CS-103', ['Mon','Wed','Fri'], '11:00','12:00'),
      mkCourse('Digital Logic Design',            'CS104', cs, fp(9), 3, 1, 1, 55, 'CS-104', ['Tue','Thu'],       '13:00','14:30'),
      mkCourse('Communication Skills',            'CS105', cs, fp(1), 2, 1, 1, 70, 'LH-01',  ['Mon','Wed'],       '14:00','15:00'),
      mkCourse('Introduction to Internet',        'CS106', cs, fp(4), 2, 1, 1, 60, 'CS-Lab', ['Fri'],            '09:00','12:00'),
      mkCourse('Study Skills & Academic Writing', 'CS107', cs, fp(0), 2, 1, 1, 70, 'LH-02',  ['Thu'],            '08:00','10:00'),
      // CS Y1S2
      mkCourse('Object-Oriented Programming',     'CS111', cs, fp(0), 4, 2, 1, 60, 'CS-101', ['Mon','Wed','Fri'], '08:00','09:00'),
      mkCourse('Mathematics for Computing II',    'CS112', cs, fp(3), 4, 2, 1, 60, 'CS-103', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Computer Architecture',           'CS113', cs, fp(4), 3, 2, 1, 55, 'CS-102', ['Mon','Wed'],       '11:00','12:30'),
      mkCourse('Discrete Mathematics',            'CS114', cs, fp(8), 3, 2, 1, 55, 'CS-104', ['Tue','Thu'],       '13:00','14:30'),
      mkCourse('Introduction to Databases',       'CS115', cs, fp(9), 3, 2, 1, 60, 'CS-Lab', ['Fri'],            '09:00','12:00'),
      mkCourse('Web Technologies I',              'CS116', cs, fp(0), 3, 2, 1, 55, 'CS-105', ['Mon','Wed'],       '14:00','15:30'),
      mkCourse('Ethics in Computing',             'CS117', cs, fp(9), 2, 2, 1, 70, 'LH-01',  ['Thu'],            '08:00','10:00'),
      // CS Y2S1
      mkCourse('Data Structures & Algorithms',    'CS201', cs, fp(0), 4, 1, 2, 50, 'CS-201', ['Tue','Thu'],       '10:00','12:00'),
      mkCourse('Database Management Systems',     'CS202', cs, fp(4), 3, 1, 2, 45, 'CS-Lab', ['Mon','Wed'],       '14:00','15:30'),
      mkCourse('Operating Systems',               'CS203', cs, fp(4), 3, 1, 2, 45, 'CS-202', ['Mon','Wed','Fri'], '09:00','10:00'),
      mkCourse('Computer Networks I',             'CS204', cs, fp(9), 3, 1, 2, 50, 'CS-203', ['Tue','Thu'],       '13:00','14:30'),
      mkCourse('Probability & Statistics',        'CS205', cs, fp(3), 3, 1, 2, 55, 'CS-204', ['Mon','Wed'],       '11:00','12:30'),
      mkCourse('Software Engineering I',          'CS206', cs, fp(0), 3, 1, 2, 50, 'CS-205', ['Fri'],            '09:00','12:00'),
      mkCourse('Web Technologies II',             'CS207', cs, fp(9), 3, 1, 2, 50, 'CS-Lab', ['Thu'],            '14:00','17:00'),
      // CS Y2S2
      mkCourse('Algorithms & Complexity',         'CS211', cs, fp(0), 4, 2, 2, 50, 'CS-201', ['Mon','Wed','Fri'], '08:00','09:00'),
      mkCourse('Computer Networks II',            'CS212', cs, fp(9), 3, 2, 2, 45, 'CS-203', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Software Engineering II',         'CS213', cs, fp(0), 3, 2, 2, 45, 'CS-205', ['Mon','Wed'],       '14:00','15:30'),
      mkCourse('Human-Computer Interaction',      'CS214', cs, fp(4), 3, 2, 2, 50, 'CS-202', ['Tue','Thu'],       '13:00','14:30'),
      mkCourse('Mobile App Development',          'CS215', cs, fp(9), 3, 2, 2, 45, 'CS-Lab', ['Fri'],            '09:00','12:00'),
      mkCourse('Information Security I',          'CS216', cs, fp(9), 3, 2, 2, 45, 'CS-204', ['Mon','Wed'],       '11:00','12:30'),
      mkCourse('Technical Research Methods',      'CS217', cs, fp(0), 2, 2, 2, 55, 'LH-02',  ['Thu'],            '08:00','10:00'),
      // CS Y3S1
      mkCourse('Artificial Intelligence',         'CS301', cs, fp(0), 4, 1, 3, 40, 'CS-301', ['Tue','Thu','Fri'],'09:00','10:00'),
      mkCourse('Machine Learning',                'CS302', cs, fp(0), 4, 1, 3, 40, 'CS-Lab', ['Mon','Wed'],       '14:00','16:00'),
      mkCourse('Cloud Computing',                 'CS303', cs, fp(4), 3, 1, 3, 40, 'CS-302', ['Mon','Wed','Fri'], '08:00','09:00'),
      mkCourse('Information Security II',         'CS304', cs, fp(9), 3, 1, 3, 40, 'CS-303', ['Tue','Thu'],       '11:00','12:30'),
      mkCourse('Distributed Systems',             'CS305', cs, fp(4), 3, 1, 3, 40, 'CS-304', ['Mon','Wed'],       '10:00','11:30'),
      mkCourse('Project Management',              'CS306', cs, fp(1), 3, 1, 3, 45, 'LH-03',  ['Thu'],            '14:00','17:00'),
      mkCourse('Final Year Project I',            'CS307', cs, fp(0), 4, 1, 3, 40, 'CS-Lab', ['Fri'],            '09:00','13:00'),
      // CS Y3S2
      mkCourse('Deep Learning',                   'CS311', cs, fp(0), 4, 2, 3, 35, 'CS-Lab', ['Mon','Wed'],       '14:00','16:00'),
      mkCourse('Natural Language Processing',     'CS312', cs, fp(0), 3, 2, 3, 35, 'CS-301', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Big Data Analytics',              'CS313', cs, fp(4), 3, 2, 3, 38, 'CS-Lab', ['Mon','Wed','Fri'], '08:00','09:00'),
      mkCourse('Internet of Things',              'CS314', cs, fp(9), 3, 2, 3, 40, 'CS-303', ['Tue','Thu'],       '13:00','14:30'),
      mkCourse('Blockchain Technology',           'CS315', cs, fp(9), 3, 2, 3, 38, 'CS-304', ['Mon','Wed'],       '11:00','12:30'),
      mkCourse('Entrepreneurship & Innovation',   'CS316', cs, fp(1), 2, 2, 3, 50, 'LH-03',  ['Thu'],            '14:00','16:00'),
      mkCourse('Final Year Project II',           'CS317', cs, fp(0), 6, 2, 3, 35, 'CS-Lab', ['Fri'],            '09:00','15:00'),

      // BBA Y1S1
      mkCourse('Principles of Management',        'BBA101', bba, fp(1), 3, 1, 1, 70, 'BBA-101', ['Mon','Wed','Fri'],'11:00','12:00'),
      mkCourse('Business Mathematics',            'BBA102', bba, fp(3), 3, 1, 1, 70, 'BBA-102', ['Tue','Thu'],      '08:00','09:30'),
      mkCourse('Introduction to Economics',       'BBA103', bba, fp(1), 3, 1, 1, 75, 'LH-04',   ['Mon','Wed'],      '13:00','14:30'),
      mkCourse('Business Communication',          'BBA104', bba, fp(7), 2, 1, 1, 75, 'LH-05',   ['Tue','Thu'],      '10:00','11:00'),
      mkCourse('Introduction to Accounting',      'BBA105', bba, fp(7), 4, 1, 1, 70, 'BBA-103', ['Mon','Wed','Fri'],'09:00','10:00'),
      mkCourse('Business Law I',                  'BBA106', bba, fp(1), 3, 1, 1, 70, 'LH-04',   ['Thu'],            '14:00','17:00'),
      mkCourse('Entrepreneurship Basics',         'BBA107', bba, fp(7), 2, 1, 1, 75, 'LH-05',   ['Fri'],            '11:00','13:00'),
      // BBA Y1S2
      mkCourse('Organizational Behaviour',        'BBA111', bba, fp(1), 3, 2, 1, 70, 'BBA-101', ['Mon','Wed','Fri'],'11:00','12:00'),
      mkCourse('Financial Accounting',            'BBA112', bba, fp(7), 4, 2, 1, 70, 'BBA-103', ['Tue','Thu'],      '08:00','09:30'),
      mkCourse('Microeconomics',                  'BBA113', bba, fp(1), 3, 2, 1, 75, 'LH-04',   ['Mon','Wed'],      '13:00','14:30'),
      mkCourse('Business Statistics',             'BBA114', bba, fp(3), 3, 2, 1, 70, 'BBA-102', ['Mon','Wed','Fri'],'09:00','10:00'),
      mkCourse('Marketing Fundamentals',          'BBA115', bba, fp(7), 3, 2, 1, 70, 'LH-05',   ['Tue','Thu'],      '10:00','11:30'),
      mkCourse('Business Law II',                 'BBA116', bba, fp(1), 3, 2, 1, 70, 'LH-04',   ['Thu'],            '14:00','17:00'),
      mkCourse('Computer Applications in Biz',   'BBA117', bba, fp(0), 2, 2, 1, 70, 'CS-Lab',  ['Fri'],            '09:00','11:00'),
      // BBA Y2S1
      mkCourse('Business Finance',                'BBA201', bba, fp(7), 3, 1, 2, 55, 'BBA-201', ['Tue','Thu'],      '13:00','14:30'),
      mkCourse('Human Resource Management',       'BBA202', bba, fp(1), 3, 1, 2, 55, 'BBA-202', ['Mon','Wed','Fri'],'11:00','12:00'),
      mkCourse('Macroeconomics',                  'BBA203', bba, fp(1), 3, 1, 2, 60, 'LH-04',   ['Mon','Wed'],      '13:00','14:30'),
      mkCourse('Cost Accounting',                 'BBA204', bba, fp(7), 4, 1, 2, 55, 'BBA-203', ['Tue','Thu'],      '08:00','09:30'),
      mkCourse('Operations Management',           'BBA205', bba, fp(1), 3, 1, 2, 55, 'BBA-204', ['Mon','Wed','Fri'],'09:00','10:00'),
      mkCourse('Business Research Methods',       'BBA206', bba, fp(7), 3, 1, 2, 60, 'LH-05',   ['Thu'],            '14:00','17:00'),
      mkCourse('Management Info Systems',         'BBA207', bba, fp(0), 3, 1, 2, 55, 'CS-Lab',  ['Fri'],            '09:00','12:00'),
      // BBA Y2S2
      mkCourse('Strategic Management',            'BBA211', bba, fp(1), 3, 2, 2, 55, 'BBA-201', ['Mon','Wed','Fri'],'11:00','12:00'),
      mkCourse('Investment Analysis',             'BBA212', bba, fp(7), 3, 2, 2, 55, 'BBA-203', ['Tue','Thu'],      '08:00','09:30'),
      mkCourse('Supply Chain Management',         'BBA213', bba, fp(1), 3, 2, 2, 55, 'BBA-202', ['Mon','Wed'],      '13:00','14:30'),
      mkCourse('Auditing & Assurance',            'BBA214', bba, fp(7), 4, 2, 2, 55, 'BBA-204', ['Tue','Thu'],      '13:00','14:30'),
      mkCourse('E-Commerce',                      'BBA215', bba, fp(0), 3, 2, 2, 55, 'CS-Lab',  ['Fri'],            '09:00','12:00'),
      mkCourse('International Business',          'BBA216', bba, fp(1), 3, 2, 2, 55, 'LH-04',   ['Mon','Wed'],      '11:00','12:30'),
      mkCourse('Business Ethics',                 'BBA217', bba, fp(1), 2, 2, 2, 60, 'LH-05',   ['Thu'],            '14:00','16:00'),

      // EE Y1S1
      mkCourse('Circuit Theory I',                'EE101', ee, fp(2), 4, 1, 1, 50, 'EE-101', ['Mon','Wed','Fri'], '13:00','14:00'),
      mkCourse('Engineering Mathematics I',       'EE102', ee, fp(3), 4, 1, 1, 50, 'EE-102', ['Tue','Thu'],       '08:00','09:30'),
      mkCourse('Engineering Drawing',             'EE103', ee, fp(6), 3, 1, 1, 45, 'EE-Lab', ['Mon','Wed'],       '11:00','12:30'),
      mkCourse('Intro to Electrical Engineering', 'EE104', ee, fp(2), 3, 1, 1, 50, 'EE-103', ['Mon','Wed','Fri'], '09:00','10:00'),
      mkCourse('Digital Electronics I',           'EE105', ee, fp(6), 3, 1, 1, 48, 'EE-104', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Physics for Engineers',           'EE106', ee, fp(3), 3, 1, 1, 50, 'LH-06',  ['Thu'],             '14:00','17:00'),
      mkCourse('Communication Skills for Eng',    'EE107', ee, fp(1), 2, 1, 1, 60, 'LH-01',  ['Fri'],             '11:00','13:00'),
      // EE Y1S2
      mkCourse('Circuit Theory II',               'EE111', ee, fp(2), 4, 2, 1, 50, 'EE-101', ['Mon','Wed','Fri'], '13:00','14:00'),
      mkCourse('Engineering Mathematics II',      'EE112', ee, fp(3), 4, 2, 1, 50, 'EE-102', ['Tue','Thu'],       '08:00','09:30'),
      mkCourse('Digital Electronics II',          'EE113', ee, fp(6), 3, 2, 1, 48, 'EE-104', ['Mon','Wed'],       '11:00','12:30'),
      mkCourse('Electrical Machines I',           'EE114', ee, fp(2), 3, 2, 1, 48, 'EE-103', ['Mon','Wed','Fri'], '09:00','10:00'),
      mkCourse('Programming for Engineers',       'EE115', ee, fp(0), 3, 2, 1, 48, 'CS-Lab', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Engineering Thermodynamics',      'EE116', ee, fp(2), 3, 2, 1, 45, 'LH-06',  ['Thu'],             '14:00','17:00'),
      mkCourse('Technical Report Writing',        'EE117', ee, fp(1), 2, 2, 1, 55, 'LH-01',  ['Fri'],             '11:00','13:00'),
      // EE Y2S1
      mkCourse('Power Systems I',                 'EE201', ee, fp(2), 4, 1, 2, 45, 'EE-201', ['Tue','Thu'],       '10:00','12:00'),
      mkCourse('Electromagnetic Fields',          'EE202', ee, fp(2), 3, 1, 2, 45, 'EE-202', ['Mon','Wed','Fri'], '09:00','10:00'),
      mkCourse('Signal Processing I',             'EE203', ee, fp(6), 3, 1, 2, 45, 'EE-Lab', ['Mon','Wed'],       '14:00','15:30'),
      mkCourse('Control Systems I',               'EE204', ee, fp(2), 3, 1, 2, 45, 'EE-203', ['Tue','Thu'],       '13:00','14:30'),
      mkCourse('Microprocessors',                 'EE205', ee, fp(6), 3, 1, 2, 48, 'EE-204', ['Mon','Wed'],       '11:00','12:30'),
      mkCourse('Electrical Machines II',          'EE206', ee, fp(2), 3, 1, 2, 45, 'EE-Lab', ['Fri'],             '09:00','12:00'),
      mkCourse('Engineering Probability',         'EE207', ee, fp(3), 3, 1, 2, 48, 'EE-205', ['Thu'],             '14:00','17:00'),

      // MATH Y1S1
      mkCourse('Calculus I',                      'MATH101', math, fp(3), 4, 1, 1, 80, 'MATH-101', ['Mon','Tue','Wed','Thu'], '07:00','08:00'),
      mkCourse('Algebra I',                       'MATH102', math, fp(8), 4, 1, 1, 80, 'MATH-102', ['Mon','Wed','Fri'],       '09:00','10:00'),
      mkCourse('Intro to Statistics',             'MATH103', math, fp(3), 3, 1, 1, 75, 'MATH-103', ['Tue','Thu'],             '10:00','11:30'),
      mkCourse('Geometry & Trigonometry',         'MATH104', math, fp(8), 3, 1, 1, 75, 'MATH-104', ['Mon','Wed'],             '13:00','14:30'),
      mkCourse('Logic & Set Theory',              'MATH105', math, fp(3), 3, 1, 1, 80, 'MATH-105', ['Tue','Thu'],             '08:00','09:30'),
      mkCourse('History of Mathematics',          'MATH106', math, fp(8), 2, 1, 1, 80, 'LH-07',    ['Fri'],                   '11:00','13:00'),
      mkCourse('Mathematical Reasoning',          'MATH107', math, fp(3), 2, 1, 1, 80, 'LH-07',    ['Thu'],                   '14:00','16:00'),
      // MATH Y1S2
      mkCourse('Calculus II',                     'MATH111', math, fp(3), 4, 2, 1, 78, 'MATH-101', ['Mon','Tue','Wed','Thu'], '07:00','08:00'),
      mkCourse('Linear Algebra',                  'MATH112', math, fp(8), 4, 2, 1, 78, 'MATH-102', ['Tue','Thu'],             '15:00','16:30'),
      mkCourse('Probability Theory',              'MATH113', math, fp(3), 3, 2, 1, 75, 'MATH-103', ['Mon','Wed','Fri'],       '10:00','11:00'),
      mkCourse('Numerical Methods I',             'MATH114', math, fp(8), 3, 2, 1, 75, 'MATH-104', ['Mon','Wed'],             '13:00','14:30'),
      mkCourse('Differential Equations I',        'MATH115', math, fp(3), 3, 2, 1, 75, 'MATH-105', ['Tue','Thu'],             '11:00','12:30'),
      mkCourse('Abstract Algebra',                'MATH116', math, fp(8), 3, 2, 1, 70, 'MATH-106', ['Mon','Wed','Fri'],       '08:00','09:00'),
      mkCourse('Mathematical Programming',        'MATH117', math, fp(3), 2, 2, 1, 75, 'CS-Lab',   ['Fri'],                   '09:00','11:00'),
      // MATH Y2S1
      mkCourse('Calculus III',                    'MATH201', math, fp(8), 4, 1, 2, 65, 'MATH-201', ['Mon','Tue','Wed','Thu'], '07:00','08:00'),
      mkCourse('Real Analysis I',                 'MATH202', math, fp(3), 4, 1, 2, 60, 'MATH-202', ['Mon','Wed','Fri'],       '09:00','10:00'),
      mkCourse('Numerical Methods II',            'MATH203', math, fp(8), 3, 1, 2, 65, 'CS-Lab',   ['Tue','Thu'],             '10:00','11:30'),
      mkCourse('Differential Equations II',       'MATH204', math, fp(3), 3, 1, 2, 65, 'MATH-203', ['Mon','Wed'],             '13:00','14:30'),
      mkCourse('Complex Analysis',                'MATH205', math, fp(8), 3, 1, 2, 60, 'MATH-204', ['Tue','Thu'],             '08:00','09:30'),
      mkCourse('Mathematical Statistics',         'MATH206', math, fp(3), 3, 1, 2, 65, 'MATH-205', ['Mon','Wed'],             '11:00','12:30'),
      mkCourse('Operations Research',             'MATH207', math, fp(8), 3, 1, 2, 65, 'MATH-206', ['Fri'],                   '09:00','12:00'),
      // MATH Y2S2
      mkCourse('Real Analysis II',                'MATH211', math, fp(3), 4, 2, 2, 60, 'MATH-201', ['Mon','Wed','Fri'],       '09:00','10:00'),
      mkCourse('Topology',                        'MATH212', math, fp(8), 3, 2, 2, 55, 'MATH-202', ['Tue','Thu'],             '10:00','11:30'),
      mkCourse('Number Theory',                   'MATH213', math, fp(3), 3, 2, 2, 60, 'MATH-203', ['Mon','Wed'],             '13:00','14:30'),
      mkCourse('Graph Theory',                    'MATH214', math, fp(8), 3, 2, 2, 60, 'MATH-204', ['Tue','Thu'],             '08:00','09:30'),
      mkCourse('Applied Statistics',              'MATH215', math, fp(3), 3, 2, 2, 65, 'MATH-205', ['Mon','Wed'],             '11:00','12:30'),
      mkCourse('Mathematical Modelling',          'MATH216', math, fp(8), 3, 2, 2, 60, 'MATH-206', ['Mon','Wed','Fri'],       '08:00','09:00'),
      mkCourse('Research Project I',              'MATH217', math, fp(3), 2, 2, 2, 65, 'LH-07',    ['Thu'],                   '14:00','16:00'),

      // MED Y1S1
      mkCourse('Anatomy I',                       'MED101', med, fp(5), 4, 1, 1, 45, 'MED-101', ['Mon','Wed','Fri'], '08:00','09:00'),
      mkCourse('Physiology I',                    'MED102', med, fp(5), 4, 1, 1, 45, 'MED-102', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Biochemistry I',                  'MED103', med, fp(5), 3, 1, 1, 45, 'MED-103', ['Mon','Wed'],       '13:00','14:30'),
      mkCourse('Medical Ethics',                  'MED104', med, fp(5), 2, 1, 1, 50, 'LH-08',   ['Thu'],             '14:00','16:00'),
      mkCourse('Introduction to Medicine',        'MED105', med, fp(5), 3, 1, 1, 50, 'MED-104', ['Mon','Wed','Fri'], '11:00','12:00'),
      mkCourse('Communication in Healthcare',     'MED106', med, fp(1), 2, 1, 1, 50, 'LH-09',   ['Tue','Thu'],       '08:00','09:00'),
      mkCourse('Basic Life Sciences',             'MED107', med, fp(5), 3, 1, 1, 50, 'MED-Lab', ['Fri'],             '09:00','12:00'),
      // MED Y1S2
      mkCourse('Anatomy II',                      'MED111', med, fp(5), 4, 2, 1, 45, 'MED-101', ['Mon','Wed','Fri'], '08:00','09:00'),
      mkCourse('Physiology II',                   'MED112', med, fp(5), 4, 2, 1, 45, 'MED-102', ['Tue','Thu'],       '10:00','11:30'),
      mkCourse('Biochemistry II',                 'MED113', med, fp(5), 3, 2, 1, 45, 'MED-103', ['Mon','Wed'],       '13:00','14:30'),
      mkCourse('Pathology I',                     'MED114', med, fp(5), 3, 2, 1, 45, 'MED-104', ['Mon','Wed','Fri'], '11:00','12:00'),
      mkCourse('Microbiology I',                  'MED115', med, fp(5), 3, 2, 1, 45, 'MED-Lab', ['Tue','Thu'],       '13:00','14:30'),
      mkCourse('Pharmacology I',                  'MED116', med, fp(5), 3, 2, 1, 45, 'MED-105', ['Thu'],             '14:00','17:00'),
      mkCourse('Clinical Skills I',               'MED117', med, fp(5), 2, 2, 1, 45, 'MED-Lab', ['Fri'],             '09:00','12:00'),
    ];

    const courses = await Course.create(courseList);
    console.log(`Created ${courses.length} courses`);

    // Course lookup helper
    const getCourses = (deptId, yr, sem) =>
      courses.filter(c =>
        c.department.toString() === deptId.toString() &&
        c.year === yr && c.semester === sem
      );

    // ── Students ──────────────────────────────────────
    const yearNow  = new Date().getFullYear().toString().slice(-2);
    const monthNow = String(new Date().getMonth() + 1).padStart(2, '0');

    // Students with full academic history
    // yr = current year, sem = current semester
    // completedSems = list of {yr, sem} already completed
    const studentData = [
      // CS — Year 3 (completed Y1S1, Y1S2, Y2S1, Y2S2, currently Y3S1)
      { name: 'Denis Mwangi',   email: 'denis@student.com',   dept: cs,   yr: 3, sem: 5, ability: 0.92 },
      { name: 'Aisha Banda',    email: 'aisha@student.com',   dept: cs,   yr: 3, sem: 6, ability: 0.95 },
      { name: 'Brian Mutuku',   email: 'brian@student.com',   dept: cs,   yr: 3, sem: 5, ability: 0.70 },
      // CS — Year 2
      { name: 'Fatuma Said',    email: 'fatuma@student.com',  dept: cs,   yr: 2, sem: 3, ability: 0.82 },
      { name: 'Kevin Ochieng',  email: 'kevin@student.com',   dept: cs,   yr: 2, sem: 4, ability: 0.73 },
      { name: 'Salma Juma',     email: 'salma@student.com',   dept: cs,   yr: 2, sem: 3, ability: 0.86 },
      // CS — Year 1
      { name: 'Grace Mutua',    email: 'grace@student.com',   dept: cs,   yr: 1, sem: 1, ability: 0.78 },
      { name: 'Ali Hassan',     email: 'ali@student.com',     dept: cs,   yr: 1, sem: 2, ability: 0.80 },
      // BBA — Year 2
      { name: 'Samuel Njoroge', email: 'samuel@student.com',  dept: bba,  yr: 2, sem: 3, ability: 0.88 },
      { name: 'Zara Abdullah',  email: 'zara@student.com',    dept: bba,  yr: 2, sem: 4, ability: 0.84 },
      { name: 'Tom Odhiambo',   email: 'tom@student.com',     dept: bba,  yr: 2, sem: 3, ability: 0.71 },
      // BBA — Year 1
      { name: 'John Kimani',    email: 'john@student.com',    dept: bba,  yr: 1, sem: 1, ability: 0.75 },
      { name: 'Amina Rashid',   email: 'amina@student.com',   dept: bba,  yr: 1, sem: 2, ability: 0.79 },
      // EE — Year 2
      { name: 'Marcus Juma',    email: 'marcus@student.com',  dept: ee,   yr: 2, sem: 3, ability: 0.85 },
      { name: 'Linet Atieno',   email: 'linet@student.com',   dept: ee,   yr: 2, sem: 4, ability: 0.77 },
      // EE — Year 1
      { name: 'Hassan Mwenda',  email: 'hassan@student.com',  dept: ee,   yr: 1, sem: 1, ability: 0.72 },
      { name: 'Faith Wambua',   email: 'faith@student.com',   dept: ee,   yr: 1, sem: 2, ability: 0.81 },
      // MATH — Year 2
      { name: 'Peter Oduya',    email: 'peter@student.com',   dept: math, yr: 2, sem: 3, ability: 0.97 },
      { name: 'Daniel Kariuki', email: 'daniel@student.com',  dept: math, yr: 2, sem: 4, ability: 0.90 },
      // MATH — Year 1
      { name: 'Rose Wanjiku',   email: 'rose@student.com',    dept: math, yr: 1, sem: 1, ability: 0.83 },
      { name: 'Ian Muthomi',    email: 'ian@student.com',     dept: math, yr: 1, sem: 2, ability: 0.76 },
      // MED — Year 1
      { name: 'Mercy Achieng',  email: 'mercy@student.com',   dept: med,  yr: 1, sem: 1, ability: 0.87 },
      { name: 'Joseph Mutiso',  email: 'joseph@student.com',  dept: med,  yr: 1, sem: 2, ability: 0.82 },
      { name: 'Celine Mutua',   email: 'celine@student.com',  dept: med,  yr: 1, sem: 1, ability: 0.79 },
    ];

    const studentUsers = [], studentProfiles = [], regNumbers = [];

    for (let i = 0; i < studentData.length; i++) {
      const sd    = studentData[i];
      const seq   = String(i + 1).padStart(5, '0');
      const regNo = `T${yearNow}-${monthNow}-${seq}`;

      const user = await User.create({
        name: sd.name, email: sd.email, password: '123456', role: 'student',
      });
      const profile = await Student.create({
        user: user._id, studentId: regNo, registrationNo: regNo,
        department: sd.dept._id, year: sd.yr, semester: sd.sem, gpa: 0,
      });
      studentUsers.push(user);
      studentProfiles.push(profile);
      regNumbers.push({ name: sd.name, email: sd.email, regNo, dept: sd.dept.code });
    }
    console.log(`Created ${studentProfiles.length} students`);

    // ── Build full academic history per student ────────
    // For each student, enroll + grade + attendance for all past semesters
    // then enroll in current semester

    const feeTypes = [
      { type: 'tuition',      amount: 850000 },
      { type: 'registration', amount: 50000  },
      { type: 'library',      amount: 30000  },
      { type: 'exam',         amount: 40000  },
    ];

    let totalEnrollments = 0, totalGrades = 0, totalAttendance = 0, totalFees = 0;
    const gradeDocs = [], attendanceDocs = [], feeDocs = [];

    for (let si = 0; si < studentProfiles.length; si++) {
      const sp = studentProfiles[si];
      const sd = studentData[si];

      // Determine all semesters this student has gone through
      // Semester map: Y1S1=1, Y1S2=2, Y2S1=3, Y2S2=4, Y3S1=5, Y3S2=6
      const semMap = [
        { yr: 1, sem: 1, semNo: 1 },
        { yr: 1, sem: 2, semNo: 2 },
        { yr: 2, sem: 1, semNo: 3 },
        { yr: 2, sem: 2, semNo: 4 },
        { yr: 3, sem: 1, semNo: 5 },
        { yr: 3, sem: 2, semNo: 6 },
      ];

      const currentSemNo = sd.sem;
      const allSems = semMap.filter(s => s.semNo <= currentSemNo);

      for (const semInfo of allSems) {
        const isCurrent = semInfo.semNo === currentSemNo;
        const semCourses = getCourses(sd.dept._id, semInfo.yr, semInfo.sem);

        if (semCourses.length === 0) continue;

        // Take up to 7 courses
        const selected = semCourses.slice(0, 7);

        for (const course of selected) {
          const enrStatus = isCurrent ? 'enrolled' : 'completed';

          const enr = await Enrollment.create({
            student:      sp._id,
            course:       course._id,
            semester:     semInfo.sem,
            academicYear: ay,
            status:       enrStatus,
          });
          await Course.findByIdAndUpdate(course._id, { $inc: { enrolled: 1 } });
          totalEnrollments++;

          // Grades for all semesters (approved for past, submitted for current)
          const baseScore = Math.min(95, Math.max(48, sd.ability * 100 + rand(-8, 8)));
          const assignment = Math.min(20, Math.max(8,  Math.round(baseScore * 0.20 + rand(-2, 2))));
          const midterm    = Math.min(30, Math.max(12, Math.round(baseScore * 0.30 + rand(-3, 3))));
          const finalExam  = Math.min(50, Math.max(18, Math.round(baseScore * 0.50 + rand(-4, 4))));

          // Find faculty for this course
          const courseFac = await Faculty.findById(course.faculty);

          gradeDocs.push({
            student:      sp._id,
            course:       course._id,
            enrollment:   enr._id,
            semester:     semInfo.sem,
            academicYear: ay,
            assignment, midterm, finalExam,
            status:      isCurrent ? 'submitted' : 'approved',
            submittedBy: courseFac?.user || admin._id,
          });
          totalGrades++;

          // Attendance: 20 sessions per course
          const baseDate = new Date('2026-01-06');
          baseDate.setMonth(baseDate.getMonth() - (currentSemNo - semInfo.semNo) * 4);

          for (let week = 0; week < 10; week++) {
            for (let session = 0; session < 2; session++) {
              const classDate = new Date(baseDate);
              classDate.setDate(baseDate.getDate() + (week * 7) + (session * 3));

              const present = Math.random() < (sd.ability * 0.95);
              const status  = present ? 'present'
                : Math.random() < 0.3 ? 'late'
                : Math.random() < 0.4 ? 'excused'
                : 'absent';

              attendanceDocs.push({
                student:  sp._id,
                course:   course._id,
                date:     new Date(classDate),
                status,
                markedBy: courseFac?.user || admin._id,
              });
              totalAttendance++;
            }
          }
        }

        // Fees per semester
        for (const ft of feeTypes) {
          const isPaid    = Math.random() < (isCurrent ? 0.7 : 0.92);
          const isPartial = !isPaid && Math.random() < 0.5;

          feeDocs.push({
            student:       sp._id,
            type:          ft.type,
            semester:      semInfo.sem,
            academicYear:  ay,
            amount:        ft.amount,
            paid:          isPaid ? ft.amount : isPartial ? Math.round(ft.amount * 0.5) : 0,
            currency:      'TZS',
            dueDate:       new Date('2026-02-28'),
            paymentMethod: pick(['bank_transfer','mobile_money','cash']),
            receiptNumber: isPaid ? `RCP${Date.now()}${Math.random().toString(36).slice(2,6).toUpperCase()}` : '',
            createdBy:     admin._id,
          });
          totalFees++;
        }
      }
    }

    // Batch insert grades
    await Grade.insertMany(gradeDocs, { ordered: false }).catch(() => {});
    console.log(`Created ${totalGrades} grade records`);

    // Batch insert attendance
    const batchSize = 200;
    for (let i = 0; i < attendanceDocs.length; i += batchSize) {
      await Attendance.insertMany(attendanceDocs.slice(i, i + batchSize), { ordered: false }).catch(() => {});
    }
    console.log(`Created ~${totalAttendance} attendance records`);

    // Batch insert fees
    await Fee.insertMany(feeDocs, { ordered: false }).catch(() => {});
    console.log(`Created ${totalFees} fee records`);

    // ── Update student GPAs from grades ───────────────
    for (const sp of studentProfiles) {
      const grades = await Grade.find({ student: sp._id, status: 'approved' }).populate('course', 'credits');
      if (grades.length === 0) continue;

      let totalPoints = 0, totalCredits = 0;
      for (const g of grades) {
        const cr = g.course?.credits || 3;
        totalPoints  += g.gradePoints * cr;
        totalCredits += cr;
      }
      const gpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
      await Student.findByIdAndUpdate(sp._id, { gpa, totalCredits });
    }
    console.log('Updated student GPAs');

    // ── Notifications ─────────────────────────────────
    const notifs = [];
    for (let i = 0; i < studentUsers.length; i++) {
      notifs.push({
        recipient: studentUsers[i]._id,
        title:     'Welcome to SmartUni! 🎓',
        message:   `Welcome ${studentData[i].name}! Your registration number is ${regNumbers[i].regNo}. Use it to login.`,
        type:      'info', createdBy: admin._id,
      });
      notifs.push({
        recipient: studentUsers[i]._id,
        title:     'Semester Registration Confirmed',
        message:   `You are registered for Semester ${studentProfiles[i].semester}, AY ${ay}. Check your courses and fees.`,
        type:      'success', createdBy: admin._id,
      });
    }
    await Notification.create(notifs);

    // ── Final output ──────────────────────────────────
    const finalStudents = await Student.find({}).populate('user', 'name');
    const totalInvoiced = feeDocs.reduce((s, f) => s + f.amount, 0);
    const totalCollected= feeDocs.reduce((s, f) => s + f.paid, 0);

    console.log('\n✅ Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ADMIN');
    console.log('  admin@smartuni.com                    / Admin@1234');
    console.log('');
    console.log('  FACULTY (password: 123456)');
    facultyData.forEach(f => console.log(`  ${f.email.padEnd(30)} ${f.id}  ${f.dept.code}`));
    console.log('');
    console.log('  STUDENTS (login with reg no or email / password: 123456)');
    for (let i = 0; i < regNumbers.length; i++) {
      const s   = regNumbers[i];
      const sp  = finalStudents.find(p => p.registrationNo === s.regNo);
      const gpa = sp ? sp.gpa.toFixed(2) : '0.00';
      console.log(`  ${s.regNo}  ${s.name.padEnd(20)} ${s.dept}  GPA:${gpa}  ${s.email}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n  Departments:   ${departments.length}`);
    console.log(`  Faculty:       ${facultyProfiles.length}`);
    console.log(`  Courses:       ${courses.length}`);
    console.log(`  Students:      ${studentProfiles.length}`);
    console.log(`  Enrollments:   ${totalEnrollments}`);
    console.log(`  Grades:        ${totalGrades}`);
    console.log(`  Attendance:    ~${totalAttendance} records`);
    console.log(`  Fee records:   ${totalFees}`);
    console.log(`  Total invoiced:  TZS ${totalInvoiced.toLocaleString()}`);
    console.log(`  Total collected: TZS ${totalCollected.toLocaleString()}`);

    process.exit();
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
