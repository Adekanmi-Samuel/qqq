-- SchoolHub Database Schema
-- PostgreSQL via Prisma ORM
-- Models are defined in prisma/schema.prisma
-- This file is for Supabase management and reference

-- Helper: trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cac_number TEXT,
  school_type TEXT CHECK (school_type IN ('NURSERY', 'PRIMARY', 'SECONDARY', 'COMBINED')) NOT NULL,
  ownership_type TEXT CHECK (ownership_type IN ('PRIVATE', 'GOVERNMENT')) NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  logo_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users from Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'BURSAR', 'PARENT', 'STUDENT')) NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Class Arms
CREATE TABLE IF NOT EXISTS class_arms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  class_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, name)
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  admission_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  arm_id UUID REFERENCES class_arms(id) ON DELETE SET NULL,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_arm_id UUID REFERENCES class_arms(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')) NOT NULL,
  marked_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, class_arm_id, date)
);

-- Notices
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  target_type TEXT CHECK (target_type IN ('ALL', 'CLASS', 'ARM')) DEFAULT 'ALL',
  target_id TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  short_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Term Results
CREATE TABLE IF NOT EXISTS term_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  class_arm_id UUID REFERENCES class_arms(id) ON DELETE CASCADE NOT NULL,
  session TEXT NOT NULL,
  term INT NOT NULL CHECK (term IN (1, 2, 3)),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  ca_score DECIMAL(5,2),
  exam_score DECIMAL(5,2),
  total_score DECIMAL(5,2),
  grade TEXT,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, class_arm_id, session, term, subject_id)
);

-- Fee Items
CREATE TABLE IF NOT EXISTS fee_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  class_level TEXT,
  compulsory BOOLEAN DEFAULT TRUE,
  term INT NOT NULL CHECK (term IN (1, 2, 3)),
  session TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  fee_item_id UUID REFERENCES fee_items(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  channel TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_school ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_notices_school ON notices(school_id);
CREATE INDEX idx_results_student ON term_results(student_id);
CREATE INDEX idx_results_session ON term_results(session);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_reference ON payments(reference);
