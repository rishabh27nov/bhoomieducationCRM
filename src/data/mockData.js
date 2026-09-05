export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
  name: 'System Admin',
  role: 'Admin',
  email: 'admin@lakshyaedu.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

export const INSTITUTE_CREDENTIALS = {
  username: 'institute',
  password: 'inst123',
  name: 'Lakshya Institute Manager',
  role: 'Institute',
  email: 'institute@lakshyaedu.com',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
};

export const isCounselorMatch = (counselorField, empName) => {
  if (!counselorField || !empName) return false;
  const c = counselorField.toLowerCase().trim();
  const e = empName.toLowerCase().trim();
  if (c === e) return true;
  const cFirst = c.split(' ')[0];
  const eFirst = e.split(' ')[0];
  if (cFirst.length > 2 && eFirst.length > 2 && cFirst === eFirst) return true;
  return c.includes(e) || e.includes(c);
};

export const COUNSELORS = [
  {
    "id": "EMP-106",
    "name": "Niharika",
    "role": "Manager",
    "email": "niharika@lakshyaedu.com",
    "phone": "+91 98765 88990",
    "username": "niharika",
    "password": "emp123",
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "activeLeads": 0,
    "conversion": "0%",
    "status": "Active",
    "joinedDate": "2024-05-10"
  },
  {
    "id": "EMP-107",
    "name": "Supriya",
    "role": "Employee",
    "email": "supriya@lakshyaedu.com",
    "phone": "+91 98765 77665",
    "username": "supriya",
    "password": "emp123",
    "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    "activeLeads": 0,
    "conversion": "0%",
    "status": "Active",
    "joinedDate": "2024-08-01"
  },
  {
    "id": "EMP-105",
    "name": "Rishabh yadav",
    "role": "Employee",
    "email": "rishubh27nov@gmail.com",
    "phone": "9170072278",
    "username": "rishabh",
    "password": "emp123",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "activeLeads": 0,
    "conversion": "0%",
    "status": "Active",
    "joinedDate": "2025-02-01"
  }
];

export const INITIAL_ACTIVITIES = [];

export const DEFAULT_COURSES = [
  'NEET Class 11',
  'NEET Class 12',
  'JEE Class 11',
  'JEE Class 12',
  'NEET & JEE Integrated'
];

export const INITIAL_LEADS = [];

export const INITIAL_BATCHES = [];

export const INITIAL_TASKS = [];

export const STUDENT_DOCUMENTS = [];

export const KPI_SUMMARY = {
  totalLeads: 0,
  activeCounseling: 0,
  admissionsEnrolled: 0,
  revenueCollected: '₹0',
  conversionRate: '0%',
  targetAchieved: '0%'
};

export const PIPELINE_STAGES_B2B2C = [
  'Out Reach',
  'Applitude Test',
  'Seminar',
  'Website/Test Portal/Demo Class Attended-Not Converted',
  'Fee Paid & Enrolled',
  'Not Interested'
];

export const PIPELINE_STAGES_B2C = [
  'New Lead',
  'Contacted / Engaged',
  'Action Pending',
  'Action Booked',
  'Action Completed',
  'Qualified Opportunity',
  'Recommendation Made',
  'Decision Pending',
  'Payment Link Sent',
  'Won - Enrolled',
  'Lost / Not Interested',
  'Long-Term Nurture'
];

export const PIPELINE_STAGES = Array.from(new Set([...PIPELINE_STAGES_B2B2C, ...PIPELINE_STAGES_B2C]));

export const getPipelineStagesForLead = (leadType) => {
  if (leadType === 'B2B2C' || leadType === 'B2B') {
    return PIPELINE_STAGES_B2B2C;
  }
  return PIPELINE_STAGES_B2C;
};
