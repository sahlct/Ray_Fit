import { PrismaClient, PlatformRole, TenantStatus, FieldType, HealthMetricType, BenchmarkOperator, FrequencyType, DeviceStatus, EvaluationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Ray Fit database seeding...');

  // 1. Clean up existing data
  await (prisma as any).adBanner?.deleteMany?.().catch(() => {});
  await (prisma as any).registrationRequest?.deleteMany?.().catch(() => {});
  await (prisma as any).tenantSubscriptionPayment?.deleteMany?.().catch(() => {});
  await prisma.auditLog.deleteMany();
  await prisma.taskEvaluationResult.deleteMany();
  await prisma.healthMetricRecord.deleteMany();
  await prisma.wearableDevice.deleteMany();
  await prisma.timetableAssignment.deleteMany();
  await prisma.healthTaskAssignment.deleteMany();
  await prisma.benchmarkVersion.deleteMany();
  await prisma.healthTask.deleteMany();
  await prisma.studentEnrollment.deleteMany();
  await prisma.batchInstructor.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.class.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.userType.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🧹 Existing data cleaned.');

  // 2. Seed System Permissions
  const modules = [
    {
      module: 'TENANTS',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'],
    },
    {
      module: 'ROLES',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN'],
    },
    {
      module: 'USER_TYPES',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE_FIELDS'],
    },
    {
      module: 'USERS',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'EXPORT', 'MANAGE'],
    },
    {
      module: 'CLASSES',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN'],
    },
    {
      module: 'BATCHES',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN'],
    },
    {
      module: 'TASKS',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN'],
    },
    {
      module: 'BENCHMARKS',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'],
    },
    {
      module: 'TIMETABLES',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'MANAGE'],
    },
    {
      module: 'WEARABLES',
      actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ASSIGN', 'INGEST'],
    },
    {
      module: 'REPORTS',
      actions: ['VIEW', 'EXPORT', 'MANAGE'],
    },
    {
      module: 'AUDIT',
      actions: ['VIEW', 'EXPORT'],
    },
  ];

  const permissionsToCreate: { module: string; action: string; description: string }[] = [];
  for (const m of modules) {
    for (const action of m.actions) {
      permissionsToCreate.push({
        module: m.module,
        action,
        description: `Can ${action.toLowerCase()} in ${m.module.toLowerCase()} module`,
      });
    }
  }
  await prisma.permission.createMany({
    data: permissionsToCreate,
    skipDuplicates: true,
  });
  const allCreatedPerms = await prisma.permission.findMany();
  const permissionRecords: Record<string, string> = {};
  for (const p of allCreatedPerms) {
    permissionRecords[`${p.module}:${p.action}`] = p.id;
  }
  console.log(`✅ Seeded ${Object.keys(permissionRecords).length} system permissions.`);

  // 3. Seed Platform Super Admin
  const superAdminPasswordHash = await bcrypt.hash('admin@123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'sahl.prosevo@gmail.com',
      fullName: 'Ray Fit Master Administrator',
      phone: '+1-555-0100',
      passwordHash: superAdminPasswordHash,
      platformRole: PlatformRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('👑 Platform Super Admin created:', superAdmin.email);

  // 4. Seed Tenant 1: Green Valley School
  const greenValley = await prisma.tenant.create({
    data: {
      name: 'Green Valley International School',
      slug: 'green-valley-school',
      contactEmail: 'contact@greenvalley.edu',
      contactPhone: '+1-555-0199',
      address: '742 Evergreen Terrace, Springfield',
      primaryColor: '#0f766e', // Teal
      secondaryColor: '#f59e0b', // Amber
      status: TenantStatus.ACTIVE,
      subscriptionPlan: 'enterprise',
    },
  });

  // 5. Seed Tenant 2: Oakridge Academy
  const oakridge = await prisma.tenant.create({
    data: {
      name: 'Oakridge Sports & Health Academy',
      slug: 'oakridge-academy',
      contactEmail: 'admissions@oakridge.edu',
      contactPhone: '+1-555-0288',
      address: '100 Olympic Way, Boulder, CO',
      primaryColor: '#4f46e5', // Indigo
      secondaryColor: '#f43f5e', // Rose
      status: TenantStatus.ACTIVE,
      subscriptionPlan: 'standard',
    },
  });

  // Setup helper for a Tenant
  async function setupTenant(tenantId: string, slug: string) {
    console.log(`🏢 Setting up tenant: ${slug}...`);

    // A. Roles
    const schoolAdminRole = await prisma.role.create({
      data: {
        tenantId,
        name: 'School Admin',
        description: 'Complete administrative control over the school domain',
        isSystem: true,
      },
    });

    const coachRole = await prisma.role.create({
      data: {
        tenantId,
        name: 'Head Coach',
        description: 'Manages athletic tasks, monitoring, benchmarks, and batch performance',
        isSystem: false,
      },
    });

    const teacherRole = await prisma.role.create({
      data: {
        tenantId,
        name: 'Teacher',
        description: 'Class teacher with viewing and attendance tracking rights',
        isSystem: false,
      },
    });

    const physioRole = await prisma.role.create({
      data: {
        tenantId,
        name: 'Physiotherapist',
        description: 'Medical health professional managing physiological benchmarks and alerts',
        isSystem: false,
      },
    });

    const studentRole = await prisma.role.create({
      data: {
        tenantId,
        name: 'Student',
        description: 'Views assigned tasks, personal health metrics, and timetables',
        isSystem: true,
      },
    });

    const parentRole = await prisma.role.create({
      data: {
        tenantId,
        name: 'Parent',
        description: 'Views child health metrics, evaluations, and school notices',
        isSystem: true,
      },
    });

    // Assign all permissions to School Admin
    await prisma.rolePermission.createMany({
      data: Object.values(permissionRecords).map((permId) => ({
        roleId: schoolAdminRole.id,
        permissionId: permId,
      })),
      skipDuplicates: true,
    });

    // Assign Coach permissions: Tasks, Benchmarks, Timetables, Wearables, Reports, Classes View, Users View
    const coachPermKeys = [
      'CLASSES:VIEW', 'BATCHES:VIEW', 'USERS:VIEW', 'TASKS:VIEW', 'TASKS:CREATE', 'TASKS:EDIT', 'TASKS:ASSIGN',
      'BENCHMARKS:VIEW', 'BENCHMARKS:CREATE', 'BENCHMARKS:EDIT', 'TIMETABLES:VIEW', 'TIMETABLES:CREATE',
      'WEARABLES:VIEW', 'WEARABLES:ASSIGN', 'WEARABLES:INGEST', 'REPORTS:VIEW', 'REPORTS:EXPORT'
    ];
    await prisma.rolePermission.createMany({
      data: coachPermKeys
        .filter((key) => permissionRecords[key])
        .map((key) => ({
          roleId: coachRole.id,
          permissionId: permissionRecords[key],
        })),
      skipDuplicates: true,
    });

    // Assign Physio permissions: Health Benchmarks, Wearables, Reports, Tasks View
    const physioPermKeys = [
      'TASKS:VIEW', 'BENCHMARKS:VIEW', 'BENCHMARKS:CREATE', 'BENCHMARKS:EDIT', 'BENCHMARKS:MANAGE',
      'WEARABLES:VIEW', 'REPORTS:VIEW', 'REPORTS:EXPORT', 'USERS:VIEW'
    ];
    await prisma.rolePermission.createMany({
      data: physioPermKeys
        .filter((key) => permissionRecords[key])
        .map((key) => ({
          roleId: physioRole.id,
          permissionId: permissionRecords[key],
        })),
      skipDuplicates: true,
    });

    // B. User Types & Custom Fields
    const studentType = await prisma.userType.create({
      data: {
        tenantId,
        name: 'Student',
        slug: 'student',
        iconName: 'GraduationCap',
        isSystem: true,
      },
    });

    const coachType = await prisma.userType.create({
      data: {
        tenantId,
        name: 'Coach',
        slug: 'coach',
        iconName: 'Activity',
        isSystem: true,
      },
    });

    const teacherType = await prisma.userType.create({
      data: {
        tenantId,
        name: 'Teacher',
        slug: 'teacher',
        iconName: 'BookOpen',
        isSystem: true,
      },
    });

    const physioType = await prisma.userType.create({
      data: {
        tenantId,
        name: 'Physiotherapist',
        slug: 'physiotherapist',
        iconName: 'HeartPulse',
        isSystem: true,
      },
    });

    const parentType = await prisma.userType.create({
      data: {
        tenantId,
        name: 'Parent',
        slug: 'parent',
        iconName: 'Users',
        isSystem: true,
      },
    });

    // Custom Fields for Student
    await prisma.customField.createMany({
      data: [
        {
          userTypeId: studentType.id,
          label: 'Date of Birth',
          fieldKey: 'date_of_birth',
          fieldType: FieldType.DATE,
          isRequired: true,
          displayOrder: 1,
        },
        {
          userTypeId: studentType.id,
          label: 'Blood Group',
          fieldKey: 'blood_group',
          fieldType: FieldType.DROPDOWN,
          isRequired: true,
          options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
          displayOrder: 2,
        },
        {
          userTypeId: studentType.id,
          label: 'Guardian Name',
          fieldKey: 'guardian_name',
          fieldType: FieldType.TEXT,
          isRequired: true,
          displayOrder: 3,
        },
        {
          userTypeId: studentType.id,
          label: 'Emergency Phone',
          fieldKey: 'emergency_phone',
          fieldType: FieldType.PHONE,
          isRequired: true,
          displayOrder: 4,
        },
        {
          userTypeId: studentType.id,
          label: 'Height (cm)',
          fieldKey: 'height_cm',
          fieldType: FieldType.NUMBER,
          isRequired: false,
          displayOrder: 5,
        },
        {
          userTypeId: studentType.id,
          label: 'Weight (kg)',
          fieldKey: 'weight_kg',
          fieldType: FieldType.NUMBER,
          isRequired: false,
          displayOrder: 6,
        },
        {
          userTypeId: studentType.id,
          label: 'Known Medical Allergies',
          fieldKey: 'allergies',
          fieldType: FieldType.TEXTAREA,
          isRequired: false,
          displayOrder: 7,
        },
      ],
    });

    // Custom Fields for Coach
    await prisma.customField.createMany({
      data: [
        {
          userTypeId: coachType.id,
          label: 'Athletic Specialization',
          fieldKey: 'specialization',
          fieldType: FieldType.DROPDOWN,
          isRequired: true,
          options: ['Track & Field', 'Swimming', 'Cardio Fitness', 'Strength & Conditioning', 'Soccer'],
          displayOrder: 1,
        },
        {
          userTypeId: coachType.id,
          label: 'Certification License #',
          fieldKey: 'certification_number',
          fieldType: FieldType.TEXT,
          isRequired: true,
          displayOrder: 2,
        },
      ],
    });

    return {
      roles: { schoolAdminRole, coachRole, teacherRole, physioRole, studentRole, parentRole },
      userTypes: { studentType, coachType, teacherType, physioType, parentType },
    };
  }

  // Setup Green Valley
  const gv = await setupTenant(greenValley.id, greenValley.slug);
  const genericPasswordHash = await bcrypt.hash('RayFit@2026', 10);

  // Users for Green Valley
  const gvAdmin = await prisma.user.create({
    data: {
      tenantId: greenValley.id,
      email: 'admin@greenvalley.edu',
      fullName: 'Dr. Arthur Pendelton',
      phone: '+1-555-0111',
      passwordHash: genericPasswordHash,
      roleId: gv.roles.schoolAdminRole.id,
      platformRole: PlatformRole.TENANT_USER,
      isActive: true,
    },
  });

  const gvCoach = await prisma.user.create({
    data: {
      tenantId: greenValley.id,
      email: 'coach.sarah@greenvalley.edu',
      fullName: 'Coach Sarah Jenkins',
      phone: '+1-555-0222',
      passwordHash: genericPasswordHash,
      roleId: gv.roles.coachRole.id,
      userTypeId: gv.userTypes.coachType.id,
      platformRole: PlatformRole.TENANT_USER,
      isActive: true,
      profileData: {
        specialization: 'Cardio Fitness',
        certification_number: 'US-ATH-98442',
      },
    },
  });

  const gvPhysio = await prisma.user.create({
    data: {
      tenantId: greenValley.id,
      email: 'physio.marcus@greenvalley.edu',
      fullName: 'Dr. Marcus Vance (PT)',
      phone: '+1-555-0333',
      passwordHash: genericPasswordHash,
      roleId: gv.roles.physioRole.id,
      userTypeId: gv.userTypes.physioType.id,
      platformRole: PlatformRole.TENANT_USER,
      isActive: true,
    },
  });

  // Students for Green Valley
  const studentData = [
    {
      name: 'Alex Morgan',
      email: 'alex.morgan@greenvalley.edu',
      dob: '2010-04-12',
      blood: 'O+',
      guardian: 'Robert Morgan',
      phone: '+1-555-1001',
      height: 168,
      weight: 58,
    },
    {
      name: 'Liam Chen',
      email: 'liam.chen@greenvalley.edu',
      dob: '2010-08-25',
      blood: 'A+',
      guardian: 'Mei Chen',
      phone: '+1-555-1002',
      height: 172,
      weight: 62,
    },
    {
      name: 'Emma Watson',
      email: 'emma.watson@greenvalley.edu',
      dob: '2010-11-15',
      blood: 'B+',
      guardian: 'Eleanor Watson',
      phone: '+1-555-1003',
      height: 163,
      weight: 52,
    },
    {
      name: 'Noah Smith',
      email: 'noah.smith@greenvalley.edu',
      dob: '2011-01-30',
      blood: 'AB+',
      guardian: 'James Smith',
      phone: '+1-555-1004',
      height: 165,
      weight: 55,
    },
    {
      name: 'Olivia Davis',
      email: 'olivia.davis@greenvalley.edu',
      dob: '2010-06-19',
      blood: 'O-',
      guardian: 'Patricia Davis',
      phone: '+1-555-1005',
      height: 170,
      weight: 59,
    },
  ];

  const gvStudents = [];
  for (const s of studentData) {
    const studentUser = await prisma.user.create({
      data: {
        tenantId: greenValley.id,
        email: s.email,
        fullName: s.name,
        phone: s.phone,
        passwordHash: genericPasswordHash,
        roleId: gv.roles.studentRole.id,
        userTypeId: gv.userTypes.studentType.id,
        platformRole: PlatformRole.TENANT_USER,
        isActive: true,
        profileData: {
          date_of_birth: s.dob,
          blood_group: s.blood,
          guardian_name: s.guardian,
          emergency_phone: s.phone,
          height_cm: s.height,
          weight_kg: s.weight,
        },
      },
    });
    gvStudents.push(studentUser);
  }

  // C. Classes & Batches for Green Valley
  const grade10 = await prisma.class.create({
    data: {
      tenantId: greenValley.id,
      name: 'Grade 10',
      academicPeriod: '2026-2027',
      description: 'Sophomore High School Cohort',
      isActive: true,
    },
  });

  const batchA = await prisma.batch.create({
    data: {
      classId: grade10.id,
      name: 'Batch A - Morning Athletics',
      capacity: 25,
      schedule: 'Mon, Wed, Fri 08:00 - 09:30',
      isActive: true,
    },
  });

  const batchB = await prisma.batch.create({
    data: {
      classId: grade10.id,
      name: 'Batch B - General Fitness',
      capacity: 30,
      schedule: 'Tue, Thu 14:00 - 15:30',
      isActive: true,
    },
  });

  // Assign Coach to Batch A
  await prisma.batchInstructor.create({
    data: {
      batchId: batchA.id,
      userId: gvCoach.id,
      role: 'Head Athletic Coach',
    },
  });

  // Enroll Students into Batch A and B
  for (let i = 0; i < gvStudents.length; i++) {
    const targetBatch = i < 3 ? batchA.id : batchB.id;
    await prisma.studentEnrollment.create({
      data: {
        batchId: targetBatch,
        studentId: gvStudents[i].id,
        rollNumber: `G10-00${i + 1}`,
        isActive: true,
      },
    });
  }

  // D. Wearable Devices for Green Valley
  const band1 = await prisma.wearableDevice.create({
    data: {
      tenantId: greenValley.id,
      studentId: gvStudents[0].id, // Alex Morgan
      deviceUuid: 'RF-BAND-AA101',
      vendorName: 'RayBand Pro',
      modelNumber: 'RB-2026-X',
      batteryLevel: 94,
      status: DeviceStatus.ACTIVE,
      lastSyncAt: new Date(),
    },
  });

  const band2 = await prisma.wearableDevice.create({
    data: {
      tenantId: greenValley.id,
      studentId: gvStudents[1].id, // Liam Chen
      deviceUuid: 'RF-BAND-BB102',
      vendorName: 'Fitbit Charge',
      modelNumber: 'FB-CHG-6',
      batteryLevel: 78,
      status: DeviceStatus.ACTIVE,
      lastSyncAt: new Date(),
    },
  });

  const band3 = await prisma.wearableDevice.create({
    data: {
      tenantId: greenValley.id,
      studentId: gvStudents[2].id, // Emma Watson
      deviceUuid: 'RF-BAND-CC103',
      vendorName: 'Garmin Vivosmart',
      modelNumber: 'VS-5',
      batteryLevel: 62,
      status: DeviceStatus.ACTIVE,
      lastSyncAt: new Date(Date.now() - 48 * 3600 * 1000), // 2 days ago
    },
  });

  // E. Health Tasks & Benchmarks
  // Task 1: Daily Active Steps
  const stepsTask = await prisma.healthTask.create({
    data: {
      tenantId: greenValley.id,
      createdById: gvCoach.id,
      title: 'Daily Active Step Goal',
      description: 'Target daily ambulatory activity for cardiovascular stamina',
      metricType: HealthMetricType.STEPS,
      unit: 'steps',
      frequency: FrequencyType.DAILY,
      isActive: true,
    },
  });

  const stepsBenchmark = await prisma.benchmarkVersion.create({
    data: {
      taskId: stepsTask.id,
      tenantId: greenValley.id,
      versionNumber: 1,
      operator: BenchmarkOperator.GREATER_THAN_OR_EQUAL,
      minValue: 8000,
      targetValue: 8000,
      clinicalNotes: 'Endorsed by Physical Education board for Grade 10 development',
      effectiveFrom: new Date('2026-09-01'),
    },
  });

  // Task 2: Resting Heart Rate
  const hrTask = await prisma.healthTask.create({
    data: {
      tenantId: greenValley.id,
      createdById: gvCoach.id,
      title: 'Resting Heart Rate Target',
      description: 'Morning resting pulse measurement prior to strenuous training',
      metricType: HealthMetricType.HEART_RATE,
      unit: 'bpm',
      frequency: FrequencyType.DAILY,
      isActive: true,
    },
  });

  const hrBenchmark = await prisma.benchmarkVersion.create({
    data: {
      taskId: hrTask.id,
      tenantId: greenValley.id,
      versionNumber: 1,
      operator: BenchmarkOperator.LESS_THAN_OR_EQUAL,
      maxValue: 75,
      targetValue: 75,
      clinicalNotes: 'Physiotherapist guideline: Resting pulse should not exceed 75 bpm',
      effectiveFrom: new Date('2026-09-01'),
    },
  });

  // Task 3: Blood Pressure Systolic Range
  const bpTask = await prisma.healthTask.create({
    data: {
      tenantId: greenValley.id,
      createdById: gvPhysio.id,
      title: 'Systolic Blood Pressure Range',
      description: 'Normotensive blood pressure range check',
      metricType: HealthMetricType.BLOOD_PRESSURE_SYSTOLIC,
      unit: 'mmHg',
      frequency: FrequencyType.DAILY,
      isActive: true,
    },
  });

  const bpBenchmark = await prisma.benchmarkVersion.create({
    data: {
      taskId: bpTask.id,
      tenantId: greenValley.id,
      versionNumber: 1,
      operator: BenchmarkOperator.BETWEEN_INCLUSIVE,
      minValue: 90,
      maxValue: 120,
      clinicalNotes: 'Clinical normotension window for adolescents',
      effectiveFrom: new Date('2026-09-01'),
    },
  });

  // F. Health Task Assignment & Timetable for Batch A
  const stepsAssignment = await prisma.healthTaskAssignment.create({
    data: {
      taskId: stepsTask.id,
      batchId: batchA.id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-30'),
      isActive: true,
    },
  });

  const hrAssignment = await prisma.healthTaskAssignment.create({
    data: {
      taskId: hrTask.id,
      batchId: batchA.id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-30'),
      isActive: true,
    },
  });

  // Timetable Entries for Today and Past 3 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timetableEntries = [];
  for (let d = 3; d >= 0; d--) {
    const entryDate = new Date(today);
    entryDate.setDate(today.getDate() - d);

    const ttSteps = await prisma.timetableAssignment.create({
      data: {
        tenantId: greenValley.id,
        assignmentId: stepsAssignment.id,
        benchmarkVersionId: stepsBenchmark.id,
        scheduledDate: entryDate,
        windowStartTime: '06:00',
        windowEndTime: '20:00',
        status: d === 0 ? 'ACTIVE' : 'COMPLETED',
      },
    });
    timetableEntries.push({ date: entryDate, ttSteps, isToday: d === 0 });
  }

  // G. Health Telemetry & Evaluations
  // 1. Alex Morgan (Band 1) -> Consistently exceeds benchmark (MET)
  // 2. Liam Chen (Band 2) -> Below benchmark (NOT_MET)
  // 3. Emma Watson (Band 3) -> No telemetry on some days (NO_DATA)

  for (const entry of timetableEntries) {
    // Alex Morgan: 9500-11000 steps
    const alexSteps = 9850;
    await prisma.healthMetricRecord.create({
      data: {
        tenantId: greenValley.id,
        studentId: gvStudents[0].id,
        deviceId: band1.id,
        metricType: HealthMetricType.STEPS,
        numericVal: alexSteps,
        unit: 'steps',
        recordedAt: entry.date,
      },
    });

    await prisma.taskEvaluationResult.create({
      data: {
        tenantId: greenValley.id,
        studentId: gvStudents[0].id,
        timetableEntryId: entry.ttSteps.id,
        benchmarkVersionId: stepsBenchmark.id,
        evaluationDate: entry.date,
        status: EvaluationStatus.MET,
        aggregatedValue: alexSteps,
        thresholdSummary: `Achieved ${alexSteps.toLocaleString()} steps (Target: >= 8,000 steps)`,
      },
    });

    // Liam Chen: 5400 steps (NOT_MET)
    const liamSteps = 5420;
    await prisma.healthMetricRecord.create({
      data: {
        tenantId: greenValley.id,
        studentId: gvStudents[1].id,
        deviceId: band2.id,
        metricType: HealthMetricType.STEPS,
        numericVal: liamSteps,
        unit: 'steps',
        recordedAt: entry.date,
      },
    });

    await prisma.taskEvaluationResult.create({
      data: {
        tenantId: greenValley.id,
        studentId: gvStudents[1].id,
        timetableEntryId: entry.ttSteps.id,
        benchmarkVersionId: stepsBenchmark.id,
        evaluationDate: entry.date,
        status: EvaluationStatus.NOT_MET,
        aggregatedValue: liamSteps,
        thresholdSummary: `Recorded ${liamSteps.toLocaleString()} steps (Target: >= 8,000 steps)`,
      },
    });

    // Emma Watson: Only recorded on past days, today is NO_DATA
    if (!entry.isToday) {
      const emmaSteps = 8400;
      await prisma.healthMetricRecord.create({
        data: {
          tenantId: greenValley.id,
          studentId: gvStudents[2].id,
          deviceId: band3.id,
          metricType: HealthMetricType.STEPS,
          numericVal: emmaSteps,
          unit: 'steps',
          recordedAt: entry.date,
        },
      });

      await prisma.taskEvaluationResult.create({
        data: {
          tenantId: greenValley.id,
          studentId: gvStudents[2].id,
          timetableEntryId: entry.ttSteps.id,
          benchmarkVersionId: stepsBenchmark.id,
          evaluationDate: entry.date,
          status: EvaluationStatus.MET,
          aggregatedValue: emmaSteps,
          thresholdSummary: `Achieved ${emmaSteps.toLocaleString()} steps (Target: >= 8,000 steps)`,
        },
      });
    } else {
      // Today: NO_DATA
      await prisma.taskEvaluationResult.create({
        data: {
          tenantId: greenValley.id,
          studentId: gvStudents[2].id,
          timetableEntryId: entry.ttSteps.id,
          benchmarkVersionId: stepsBenchmark.id,
          evaluationDate: entry.date,
          status: EvaluationStatus.NO_DATA,
          aggregatedValue: null,
          thresholdSummary: 'No wearable synchronization telemetry received for this evaluation window',
        },
      });
    }
  }

  // H. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: greenValley.id,
        userId: gvAdmin.id,
        action: 'TENANT_INITIALIZED',
        module: 'TENANTS',
        details: { message: 'Green Valley School provisioned with standard roles and student cohort' },
      },
      {
        tenantId: greenValley.id,
        userId: gvCoach.id,
        action: 'HEALTH_TASK_ASSIGNED',
        module: 'TASKS',
        details: { task: 'Daily Active Step Goal', batch: 'Batch A - Morning Athletics' },
      },
      {
        tenantId: greenValley.id,
        userId: gvPhysio.id,
        action: 'BENCHMARK_CONFIGURED',
        module: 'BENCHMARKS',
        details: { metric: 'RESTING_HEART_RATE', maxTarget: 75 },
      },
    ],
  });

  // Setup Oakridge Academy with its own isolated data
  await setupTenant(oakridge.id, oakridge.slug);
  await prisma.user.create({
    data: {
      tenantId: oakridge.id,
      email: 'admin@oakridge.edu',
      fullName: 'Dean Victoria Sterling',
      phone: '+1-555-0909',
      passwordHash: genericPasswordHash,
      platformRole: PlatformRole.TENANT_USER,
      isActive: true,
    },
  });

  console.log('🎉 Ray Fit database successfully seeded with complete multi-tenant demonstration data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
