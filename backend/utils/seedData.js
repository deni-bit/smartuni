const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
const User       = require('../models/User');
const Student    = require('../models/Student');
const Faculty    = require('../models/Faculty');
const Department = require('../models/Department');
const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Fee        = require('../models/Fee');
const Notification = require('../models/Notification');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    // Clear all
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Fee.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing data');

    // ── Departments ──────────────────────────────────
    const departments = await Department.create([
      { name: 'Computer Science',        code: 'CS',   description: 'Computing and software engineering' },
      { name: 'Business Administration', code: 'BBA',  description: 'Business and management studies'   },
      { name: 'Electrical Engineering',  code: 'EE',   description: 'Electrical and electronics'        },
      { name: 'Mathematics',             code: 'MATH', description: 'Pure and applied mathematics'      },
      { name: 'Medicine',                code: 'MED',  description: 'Medical and health sciences'       },
    ]);
    console.log(`Created ${departments.length} departments`);

    const cs   = departments.find(d => d.code === 'CS');
    const bba  = departments.find(d => d.code === 'BBA');
    const ee   = departments.find(d => d.code === 'EE');
    const math = departments.find(d => d.code === 'MATH');
    const med  = departments.find(d => d.code === 'MED');

    // ── Admin ─────────────────────────────────────────
    const admin = await User.create({
      name:     'Super Admin',
      email:    'admin@smartuni.com',
      password: 'Admin@1234',
      role:     'admin',
      phone:    '+255700000001',
    });

    // ── Faculty users ─────────────────────────────────
    const facultyUsers = await User.create([
      { name: 'Dr. James Okonkwo',  email: 'james@smartuni.com',  password: '123456', role: 'faculty', phone: '+255700000002' },
      { name: 'Prof. Amina Hassan', email: 'amina@smartuni.com',  password: '123456', role: 'faculty', phone: '+255700000003' },
      { name: 'Dr. Luca Bianchi',   email: 'luca@smartuni.com',   password: '123456', role: 'faculty', phone: '+255700000004' },
      { name: 'Dr. Sofia Reyes',    email: 'sofia@smartuni.com',  password: '123456', role: 'faculty', phone: '+255700000005' },
      { name: 'Prof. Yuki Tanaka',  email: 'yuki@smartuni.com',   password: '123456', role: 'faculty', phone: '+255700000006' },
    ]);

    // ── Faculty profiles ──────────────────────────────
    const facultyProfiles = await Faculty.create([
      { user: facultyUsers[0]._id, facultyId: 'FAC2401', department: cs._id,   designation: 'Associate Professor', qualification: 'PhD Computer Science',  specialization: 'AI & Machine Learning' },
      { user: facultyUsers[1]._id, facultyId: 'FAC2402', department: bba._id,  designation: 'Professor',           qualification: 'PhD Business Admin',     specialization: 'Strategic Management'  },
      { user: facultyUsers[2]._id, facultyId: 'FAC2403', department: ee._id,   designation: 'Assistant Professor', qualification: 'PhD Electrical Eng',     specialization: 'Power Systems'         },
      { user: facultyUsers[3]._id, facultyId: 'FAC2404', department: math._id, designation: 'Lecturer',            qualification: 'MSc Mathematics',        specialization: 'Statistics & Calculus' },
      { user: facultyUsers[4]._id, facultyId: 'FAC2405', department: cs._id,   designation: 'Professor',           qualification: 'PhD Software Engineering',specialization: 'Distributed Systems'  },
    ]);

    // Set department heads
    await Department.findByIdAndUpdate(cs._id,   { head: facultyUsers[0]._id });
    await Department.findByIdAndUpdate(bba._id,  { head: facultyUsers[1]._id });
    await Department.findByIdAndUpdate(ee._id,   { head: facultyUsers[2]._id });
    await Department.findByIdAndUpdate(math._id, { head: facultyUsers[3]._id });
    console.log(`Created ${facultyProfiles.length} faculty profiles`);

    // ── Courses ───────────────────────────────────────
    const courses = await Course.create([
      // CS courses
      {
        title: 'Introduction to Programming',   code: 'CS101',
        department: cs._id, faculty: facultyProfiles[0]._id,
        credits: 3, semester: 1, year: 1, capacity: 60, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Mon','Wed','Fri'], startTime: '08:00', endTime: '09:00', room: 'CS-101' },
      },
      {
        title: 'Data Structures & Algorithms',  code: 'CS201',
        department: cs._id, faculty: facultyProfiles[0]._id,
        credits: 4, semester: 2, year: 2, capacity: 50, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Tue','Thu'], startTime: '10:00', endTime: '12:00', room: 'CS-201' },
      },
      {
        title: 'Database Management Systems',   code: 'CS301',
        department: cs._id, faculty: facultyProfiles[4]._id,
        credits: 3, semester: 1, year: 3, capacity: 45, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Mon','Wed'], startTime: '14:00', endTime: '15:30', room: 'CS-301' },
      },
      {
        title: 'Artificial Intelligence',       code: 'CS401',
        department: cs._id, faculty: facultyProfiles[0]._id,
        credits: 4, semester: 1, year: 4, capacity: 40, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Tue','Thu','Fri'], startTime: '09:00', endTime: '10:00', room: 'CS-401' },
      },
      // BBA courses
      {
        title: 'Principles of Management',      code: 'BBA101',
        department: bba._id, faculty: facultyProfiles[1]._id,
        credits: 3, semester: 1, year: 1, capacity: 70, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Mon','Wed','Fri'], startTime: '11:00', endTime: '12:00', room: 'BBA-101' },
      },
      {
        title: 'Business Finance',              code: 'BBA201',
        department: bba._id, faculty: facultyProfiles[1]._id,
        credits: 3, semester: 2, year: 2, capacity: 55, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Tue','Thu'], startTime: '13:00', endTime: '14:30', room: 'BBA-201' },
      },
      // EE courses
      {
        title: 'Circuit Theory',                code: 'EE101',
        department: ee._id, faculty: facultyProfiles[2]._id,
        credits: 4, semester: 1, year: 1, capacity: 50, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Mon','Wed','Fri'], startTime: '13:00', endTime: '14:00', room: 'EE-101' },
      },
      // MATH courses
      {
        title: 'Calculus I',                    code: 'MATH101',
        department: math._id, faculty: facultyProfiles[3]._id,
        credits: 4, semester: 1, year: 1, capacity: 80, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Mon','Tue','Wed','Thu'], startTime: '07:00', endTime: '08:00', room: 'MATH-101' },
      },
      {
        title: 'Linear Algebra',                code: 'MATH201',
        department: math._id, faculty: facultyProfiles[3]._id,
        credits: 3, semester: 2, year: 2, capacity: 60, enrolled: 0,
        academicYear: '2025/2026',
        schedule: { days: ['Tue','Thu'], startTime: '15:00', endTime: '16:30', room: 'MATH-201' },
      },
    ]);
    console.log(`Created ${courses.length} courses`);

    // ── Students ──────────────────────────────────────
    const studentData = [
      { name: 'Denis Mwangi',    email: 'denis@student.com',    dept: cs._id,   year: 3, semester: 5 },
      { name: 'Fatuma Said',     email: 'fatuma@student.com',   dept: cs._id,   year: 2, semester: 3 },
      { name: 'John Kimani',     email: 'john@student.com',     dept: bba._id,  year: 1, semester: 1 },
      { name: 'Zara Abdullah',   email: 'zara@student.com',     dept: bba._id,  year: 2, semester: 4 },
      { name: 'Marcus Juma',     email: 'marcus@student.com',   dept: ee._id,   year: 1, semester: 2 },
      { name: 'Aisha Banda',     email: 'aisha@student.com',    dept: cs._id,   year: 4, semester: 7 },
      { name: 'Peter Oduya',     email: 'peter@student.com',    dept: math._id, year: 2, semester: 3 },
      { name: 'Grace Mutua',     email: 'grace@student.com',    dept: cs._id,   year: 1, semester: 1 },
      { name: 'Samuel Njoroge',  email: 'samuel@student.com',   dept: bba._id,  year: 3, semester: 5 },
      { name: 'Linet Atieno',    email: 'linet@student.com',    dept: ee._id,   year: 2, semester: 3 },
    ];

    const studentUsers   = [];
    const studentProfiles = [];

    for (let i = 0; i < studentData.length; i++) {
      const s    = studentData[i];
      const user = await User.create({
        name: s.name, email: s.email,
        password: '123456', role: 'student',
      });
      const profile = await Student.create({
        user:       user._id,
        studentId:  `STU26${String(i + 1).padStart(4, '0')}`,
        department: s.dept,
        year:       s.year,
        semester:   s.semester,
        gpa:        parseFloat((2.5 + Math.random() * 1.5).toFixed(2)),
      });
      studentUsers.push(user);
      studentProfiles.push(profile);
    }
    console.log(`Created ${studentProfiles.length} students`);

    // ── Enrollments ───────────────────────────────────
    const enrollments = [];
    const csStudents  = studentProfiles.filter(s =>
      s.department.toString() === cs._id.toString()
    );
    const csCourses   = courses.filter(c =>
      c.department.toString() === cs._id.toString()
    );

    for (const student of csStudents) {
      for (const course of csCourses.slice(0, 2)) {
        const enr = await Enrollment.create({
          student:      student._id,
          course:       course._id,
          semester:     student.semester,
          academicYear: '2025/2026',
          status:       'enrolled',
        });
        enrollments.push(enr);
        await Course.findByIdAndUpdate(course._id, { $inc: { enrolled: 1 } });
      }
    }
    console.log(`Created ${enrollments.length} enrollments`);

    // ── Fees ──────────────────────────────────────────
    const fees = [];
    for (const student of studentProfiles) {
      const isPaid = Math.random() > 0.3;
      const fee = await Fee.create({
        student:      student._id,
        type:         'tuition',
        semester:     student.semester,
        academicYear: '2025/2026',
        amount:       850000,
        paid:         isPaid ? 850000 : Math.random() > 0.5 ? 425000 : 0,
        dueDate:      new Date('2026-02-28'),
        paymentMethod:'bank_transfer',
        receiptNumber: isPaid ? `RCP${Date.now()}` : '',
        createdBy:    admin._id,
      });
      fees.push(fee);
    }
    console.log(`Created ${fees.length} fee records`);

    // ── Notifications ─────────────────────────────────
    const notifications = [];
    for (const user of studentUsers) {
      notifications.push({
        recipient: user._id,
        title:     'Welcome to SmartUni!',
        message:   'Your account has been created. Please check your course enrollment.',
        type:      'info',
        createdBy: admin._id,
      });
    }
    await Notification.create(notifications);
    console.log(`Created ${notifications.length} notifications`);

    console.log('\n✅ Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin:    admin@smartuni.com   / Admin@1234');
    console.log('  Faculty:  james@smartuni.com   / 123456');
    console.log('            amina@smartuni.com   / 123456');
    console.log('            luca@smartuni.com    / 123456');
    console.log('  Students: denis@student.com    / 123456');
    console.log('            fatuma@student.com   / 123456');
    console.log('            john@student.com     / 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n  Departments: ${departments.length}`);
    console.log(`  Courses:     ${courses.length}`);
    console.log(`  Faculty:     ${facultyProfiles.length}`);
    console.log(`  Students:    ${studentProfiles.length}`);
    console.log(`  Enrollments: ${enrollments.length}`);
    console.log(`  Fee records: ${fees.length}`);

    process.exit();
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();