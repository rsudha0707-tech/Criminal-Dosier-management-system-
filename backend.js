// =========================================================
//  CDIMS — BACKEND.JS  (Supabase Data Layer)
//  Criminal Dossier & Intelligence Management System
//  UP Police Headquarters
//
//  ┌─────────────────────────────────────────────────────┐
//  │  QUICK SETUP (one-time)                             │
//  │  1. Go to https://supabase.com → New Project        │
//  │  2. SQL Editor → paste schema.sql → Run             │
//  │  3. Settings → API → copy Project URL + anon key    │
//  │  4. Paste both values below and save                 │
//  │  5. Reload the page — data auto-seeds on first run   │
//  └─────────────────────────────────────────────────────┘
//
//  If credentials are not set, the app works 100% via
//  localStorage as a fallback — no errors.
// =========================================================

// ══════════════════════════════════════════════════════════
//  ⚙️  SUPABASE CONFIGURATION
// ══════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://immwobsoziqqftaoinup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbXdvYnNvemlxcWZ0YW9pbnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODQ0NzksImV4cCI6MjA5MzQ2MDQ3OX0.utM5jrzWVajZTmRXbVH3sqc-pMDvQGt-z7dzkrWFaSw';
// ══════════════════════════════════════════════════════════

const CDIMS_DB_VERSION = 'v2-village';

// Internal state
let _sb = null;   // Supabase client
let _useSupabase = false;  // true once credentials validated
let _cache = [];     // in-memory dossier array
let _auditCache = [];     // in-memory audit log array
let _initPromise = null;   // singleton promise for initDatabase()

// ──────────────────────────────────────────────────────────
//  MASTER DATA — Districts, Circles, Stations
// ──────────────────────────────────────────────────────────
const MASTER_DATA = {
  state: 'Uttar Pradesh',
  districts: [
    {
      id: 'lucknow', name: 'Lucknow (लखनऊ)', isCommissionerate: true,
      circles: [
        { id: 'hazratganj_circle', name: 'Hazratganj Circle', stations: ['Hazratganj', 'Gautampalli', 'Hussainganj'] },
        { id: 'chowk_circle', name: 'Chowk Circle', stations: ['Chowk', 'Wazirganj', 'Thakurganj'] }
      ]
    },
    {
      id: 'varanasi', name: 'Varanasi (वाराणसी)', isCommissionerate: true,
      circles: [
        { id: 'dashashwamedh_circle', name: 'Dashashwamedh Circle', stations: ['Dashashwamedh', 'Lanka', 'Bhelupur'] },
        { id: 'cantt_circle', name: 'Cantt Circle', stations: ['Cantt', 'Shivpur'] }
      ]
    },
    {
      id: 'prayagraj', name: 'Prayagraj (प्रयागराज)', isCommissionerate: false,
      circles: [
        { id: 'civil_lines_circle', name: 'Civil Lines Circle', stations: ['Civil Lines', 'Cantonment'] },
        { id: 'georgetown_circle', name: 'Georgetown Circle', stations: ['Georgetown', 'Shivkuti'] }
      ]
    },
    {
      id: 'noida', name: 'Gautam Buddha Nagar (नोएडा)', isCommissionerate: true,
      circles: [
        { id: 'noida_1', name: 'Noida Zone 1', stations: ['Sector-20', 'Sector-39', 'Sector-58'] },
        { id: 'noida_2', name: 'Noida Zone 2', stations: ['Phase-2', 'Phase-3'] }
      ]
    }
  ],
  totals: { districts: 75, commissionerates: 7, policeStations: 1526, outposts: 4210 }
};

// ──────────────────────────────────────────────────────────
//  VILLAGE MASTER MAP
// ──────────────────────────────────────────────────────────
const VILLAGES_BY_STATION = {
  'Hazratganj': ['Madanpur', 'Sikandarpur', 'Rampur', 'Gomtipur'],
  'Gautampalli': ['Pipraghat', 'Jiamau', 'Ujariyaon'],
  'Hussainganj': ['Hussainganj Dehat', 'Charbagh Village'],
  'Chowk': ['Malihabad Village', 'Kakori Village', 'Hardoi Road Basti'],
  'Wazirganj': ['Riverbank Colony Dehat', 'Ghasyari Mandi Basti'],
  'Thakurganj': ['Sarfarazganj', 'Campbell Road Village'],
  'Dashashwamedh': ['Ghat Dehat', 'Bengali Tola'],
  'Lanka': ['Shivpur Village', 'Sunderpur', 'Bhagwanpur'],
  'Bhelupur': ['Khojwan', 'Kamachha'],
  'Cantt': ['Varanasi Cantt Dehat', 'Nadesar'],
  'Shivpur': ['Harahua', 'Phoolpur Village'],
  'Civil Lines': ['Cantonment Dehat', 'Civil Lines Village'],
  'Cantonment': ['Rajapur', 'Muirabad'],
  'Georgetown': ['Allapur Village', 'Tagore Town Basti'],
  'Shivkuti': ['Handia Village', 'Phaphamau Dehat', 'Soraon Dehat'],
  'Sector-20': ['Bisrakh', 'Nithari', 'Chhalera'],
  'Sector-39': ['Sadarpur', 'Raipur', 'Khajoorpur'],
  'Sector-58': ['Bishanpura', 'Noida Sector-58 Village'],
  'Phase-2': ['Gheja', 'Noida Phase 2 Basti'],
  'Phase-3': ['Mamura', 'Garhi Chaukhandi']
};

// ──────────────────────────────────────────────────────────
//  SEED DATA — 6 criminals inserted on first run
// ──────────────────────────────────────────────────────────
const INITIAL_DOSSIERS = [
  {
    id: 'CRM-2026-0001',
    personalInfo: {
      name: 'Rajesh Yadav', aliasName: 'Raju Kaana (राजू काणा)', nickname: 'Kaana',
      fatherName: 'Ramswaroop Yadav', motherName: 'Savitri Devi', gender: 'Male',
      dob: '1984-08-15', age: 41, mobile: '9876543210', aadhaar: 'XXXX-XXXX-8923',
      address: 'House No 42, Mohalla Chowk, Lucknow, UP',
      permanentAddress: 'Village Bhadarsa, District Ayodhya, UP',
      photograph: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      village: 'Madanpur'
    },
    biometrics: {
      fingerprints: 'FP-8923-SECURED', faceImage: 'FACE-RECOGNIZED-99.2%',
      identificationMarks: 'Deep scar on left cheek, missing upper left premolar tooth',
      height: '178 cm', weight: '82 kg', eyeColor: 'Dark Brown', bloodGroup: 'B+'
    },
    history: [
      {
        firNumber: 'FIR-324/2024', crimeNumber: 'CR-412/2024', policeStation: 'Hazratganj', district: 'lucknow',
        sections: 'IPC 302, 307, 120B (Murder, Attempt to Murder, Criminal Conspiracy)',
        chargeSheetStatus: 'Filed (CS-112/2024)', convictionDetails: 'Under Trial',
        bailStatus: 'Rejected (High Court)', courtCaseDetails: 'Session Case No 412/2024, Lucknow Bench'
      },
      {
        firNumber: 'FIR-12/2025', crimeNumber: 'CR-18/2025', policeStation: 'Sector-20', district: 'noida',
        sections: 'UP Gangsters Act, Sec 3(1)', chargeSheetStatus: 'Under Investigation',
        convictionDetails: 'Absconding', bailStatus: 'Wanted', courtCaseDetails: 'Non-Bailable Warrant Issued'
      }
    ],
    gangInfo: {
      gangName: 'Raju Kaana Gang (D-102)', gangLeader: 'Rajesh Yadav (Self)',
      gangMembers: ['Amit Mishra', 'Vikram Singh', 'Sanjay Pal'],
      areaOfOperation: 'Lucknow, Ayodhya, Noida, Varanasi',
      networkMapping: [
        { targetId: 'CRM-2026-0002', relation: 'Lieutenant / Strategist' },
        { targetId: 'CRM-2026-0003', relation: 'Hitman / Shooter' }
      ]
    },
    surveillance: {
      historySheetNumber: 'HS-42A/Hazratganj', surveillanceCategory: 'Category A (Hardened Gangster)',
      surveillanceNotes: 'Extremely active. Focuses on land grabbing, contract extortion and illegal sand mining.',
      beatOfficerRemarks: 'Not spotted in the local beat area for 3 weeks.',
      intelligenceInputs: 'Intelligence source indicates planning of real estate extortion in Gomti Nagar.'
    },
    propertyDetails: [
      { type: 'House', address: 'Gomti Nagar Phase 2, Lucknow', estimatedValue: '₹2.5 Crore', status: 'Seized under Sec 14(1) Gangsters Act' },
      { type: 'Agricultural Land', address: 'Village Bhadarsa, Ayodhya (4.2 Hectares)', estimatedValue: '₹1.8 Crore', status: 'Attached' },
      { type: 'Bank Account', bankName: 'State Bank of India, Hazratganj', accountNumber: 'XXXXXX7842', estimatedValue: '₹45 Lakhs', status: 'Frozen' }
    ],
    vehicleDetails: [
      { vehicleNumber: 'UP-32-EX-4122', vehicleType: 'SUV (Fortuner - White)', registrationDetails: 'Registered under spouse Savitri Devi' },
      { vehicleNumber: 'UP-42-AA-9999', vehicleType: 'SUV (Scorpio - Black)', registrationDetails: 'Registered under frontman Sanjay Pal' }
    ],
    status: 'Wanted', approvalStatus: 'Approved',
    submittedBy: 'SHO Hazratganj', verifiedBy: 'CO Hazratganj Office', approvedBy: 'SP Crime Lucknow',
    lastUpdated: '2026-05-28T14:32:00Z'
  },
  {
    id: 'CRM-2026-0002',
    personalInfo: {
      name: 'Amit Mishra', aliasName: 'Panditji (पंडितजी)', nickname: 'Pandit',
      fatherName: 'Dinesh Chandra Mishra', motherName: 'Kamla Mishra', gender: 'Male',
      dob: '1988-11-04', age: 37, mobile: '9415123456', aadhaar: 'XXXX-XXXX-4102',
      address: 'Sector 4, Aliganj, Lucknow, UP',
      permanentAddress: 'Gola Gokaran Nath, Lakhimpur Kheri, UP',
      photograph: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      village: 'Madanpur'
    },
    biometrics: {
      fingerprints: 'FP-4102-SECURED', faceImage: 'FACE-RECOGNIZED-95.8%',
      identificationMarks: 'Mole on the right collarbone, surgical scar on left knee',
      height: '172 cm', weight: '74 kg', eyeColor: 'Black', bloodGroup: 'O+'
    },
    history: [
      {
        firNumber: 'FIR-105/2023', crimeNumber: 'CR-112/2023', policeStation: 'Hazratganj', district: 'lucknow',
        sections: 'IPC 420, 467, 468, 471, 120B (Forgery, Cheating, Using Forged Documents)',
        chargeSheetStatus: 'Filed (CS-80/2023)', convictionDetails: 'Under Trial',
        bailStatus: 'Out on Bail (Granted by Dist Court Lucknow)', courtCaseDetails: 'ACJM-III Case No 1823/2023'
      }
    ],
    gangInfo: {
      gangName: 'Raju Kaana Gang (D-102)', gangLeader: 'Rajesh Yadav',
      gangMembers: ['Rajesh Yadav', 'Vikram Singh'],
      areaOfOperation: 'Lucknow, Lakhimpur',
      networkMapping: [{ targetId: 'CRM-2026-0001', relation: 'Advisor / Financier' }]
    },
    surveillance: {
      historySheetNumber: 'HS-89B/Hazratganj', surveillanceCategory: 'Category B (Active Associate)',
      surveillanceNotes: 'Handles financial bookkeeping, shell companies, and legal affairs for the Raju Kaana Gang.',
      beatOfficerRemarks: 'Reporting weekly at the station as per bail conditions.',
      intelligenceInputs: 'Recently met with suspect contractors at a hotel in Hazratganj.'
    },
    propertyDetails: [
      { type: 'Shop', address: 'Kapoorthala Crossing, Aliganj, Lucknow', estimatedValue: '₹85 Lakhs', status: 'Active (Under Surveillance)' },
      { type: 'Bank Account', bankName: 'HDFC Bank, Aliganj', accountNumber: 'XXXXXX2012', estimatedValue: '₹18 Lakhs', status: 'Active' }
    ],
    vehicleDetails: [
      { vehicleNumber: 'UP-32-KB-0051', vehicleType: 'Sedan (Ciaz - Grey)', registrationDetails: 'Self registered' }
    ],
    status: 'Out on Bail', approvalStatus: 'Approved',
    submittedBy: 'SHO Hazratganj', verifiedBy: 'CO Hazratganj Office', approvedBy: 'SP Crime Lucknow',
    lastUpdated: '2026-05-29T11:20:00Z'
  },
  {
    id: 'CRM-2026-0003',
    personalInfo: {
      name: 'Vikram Singh', aliasName: 'Vicky Shooter (विक्की शूटर)', nickname: 'Vicky',
      fatherName: 'Karan Bahadur Singh', motherName: 'Pushpa Singh', gender: 'Male',
      dob: '1995-03-22', age: 31, mobile: '9199887766', aadhaar: 'XXXX-XXXX-1150',
      address: 'Village Shivpur, Varanasi, UP', permanentAddress: 'Village Shivpur, Varanasi, UP',
      photograph: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      village: 'Shivpur Village'
    },
    biometrics: {
      fingerprints: 'FP-1150-SECURED', faceImage: 'FACE-RECOGNIZED-92.4%',
      identificationMarks: 'Tattoo of Lord Shiva on right forearm',
      height: '182 cm', weight: '78 kg', eyeColor: 'Light Brown', bloodGroup: 'A+'
    },
    history: [
      {
        firNumber: 'FIR-88/2025', crimeNumber: 'CR-95/2025', policeStation: 'Lanka', district: 'varanasi',
        sections: 'IPC 307, 34, Arms Act Sec 25/27 (Attempt to Murder, Common Intention)',
        chargeSheetStatus: 'Under Investigation', convictionDetails: 'Absconding',
        bailStatus: 'Wanted', courtCaseDetails: 'Case registered, arrest warrants active'
      },
      {
        firNumber: 'FIR-402/2024', crimeNumber: 'CR-480/2024', policeStation: 'Hazratganj', district: 'lucknow',
        sections: 'IPC 384, 506 (Extortion, Criminal Intimidation)',
        chargeSheetStatus: 'Filed', convictionDetails: 'Under Trial',
        bailStatus: 'Wanted', courtCaseDetails: 'Arrest warrant active'
      }
    ],
    gangInfo: {
      gangName: 'Raju Kaana Gang (D-102)', gangLeader: 'Rajesh Yadav',
      gangMembers: ['Rajesh Yadav', 'Amit Mishra'],
      areaOfOperation: 'Varanasi, Lucknow, Prayagraj',
      networkMapping: [{ targetId: 'CRM-2026-0001', relation: 'Enforcer / Shooter' }]
    },
    surveillance: {
      historySheetNumber: 'HS-15C/Lanka', surveillanceCategory: 'Category A (Wanted Shooter)',
      surveillanceNotes: 'Extremely dangerous. Handles weapon procurement and executes contract hits.',
      beatOfficerRemarks: 'Informers report he was seen in Varanasi Cantt railway station area 5 days ago.',
      intelligenceInputs: 'Suspected to be using a virtual VoIP number to contact associates.'
    },
    propertyDetails: [
      { type: 'House', address: 'Shivpur, Varanasi', estimatedValue: '₹45 Lakhs', status: 'Under attachment process' }
    ],
    vehicleDetails: [
      { vehicleNumber: 'UP-65-XY-8821', vehicleType: 'Motorcycle (Pulsar - Black)', registrationDetails: 'Registered under cousin name' }
    ],
    status: 'Wanted', approvalStatus: 'Approved',
    submittedBy: 'SHO Lanka', verifiedBy: 'CO Dashashwamedh Office', approvedBy: 'SSP Varanasi Office',
    lastUpdated: '2026-05-25T09:15:00Z'
  },
  {
    id: 'CRM-2026-0004',
    personalInfo: {
      name: 'Satish Gujjar', aliasName: 'Fauji (फौजी)', nickname: 'Subedar',
      fatherName: 'Dharampal Gujjar', motherName: 'Bimla Devi', gender: 'Male',
      dob: '1978-05-12', age: 48, mobile: '9675210041', aadhaar: 'XXXX-XXXX-9934',
      address: 'Village Bisrakh, Greater Noida, UP', permanentAddress: 'Village Bisrakh, Greater Noida, UP',
      photograph: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      village: 'Bisrakh'
    },
    biometrics: {
      fingerprints: 'FP-9934-SECURED', faceImage: 'FACE-RECOGNIZED-90.1%',
      identificationMarks: 'Gunshot wound mark on right shoulder',
      height: '185 cm', weight: '90 kg', eyeColor: 'Dark Brown', bloodGroup: 'AB+'
    },
    history: [
      {
        firNumber: 'FIR-412/2023', crimeNumber: 'CR-430/2023', policeStation: 'Sector-39', district: 'noida',
        sections: 'IPC 392, 395 (Robbery, Dacoity)',
        chargeSheetStatus: 'Filed', convictionDetails: 'Acquitted due to hostile witnesses',
        bailStatus: 'Discharged', courtCaseDetails: 'Noida District Court Case 430/2023'
      },
      {
        firNumber: 'FIR-22/2026', crimeNumber: 'CR-25/2026', policeStation: 'Sector-20', district: 'noida',
        sections: 'UP Gangsters Act & Arms Act Sec 25',
        chargeSheetStatus: 'Under Investigation', convictionDetails: 'Under Trial',
        bailStatus: 'In Jail (District Jail Luksar)', courtCaseDetails: 'Special Gangsters Court, Noida'
      }
    ],
    gangInfo: {
      gangName: 'Gujjar Syndicate (G-110)', gangLeader: 'Satish Gujjar (Self)',
      gangMembers: ['Rakesh Patel'],
      areaOfOperation: 'Noida, Greater Noida, Ghaziabad',
      networkMapping: [{ targetId: 'CRM-2026-0005', relation: 'Associate / Arms Supplier' }]
    },
    surveillance: {
      historySheetNumber: 'HS-99A/Sector-20', surveillanceCategory: 'Category A (Gang Leader)',
      surveillanceNotes: 'Ex-army personnel discharged after court-martial. Leads extortion rings in Noida/Greater Noida.',
      beatOfficerRemarks: 'Currently incarcerated in Luksar Jail.',
      intelligenceInputs: 'Continues to direct operations from jail through visiting relatives.'
    },
    propertyDetails: [
      { type: 'House', address: 'Bisrakh, Greater Noida', estimatedValue: '₹1.2 Crore', status: 'Active' },
      { type: 'Commercial Plot', address: 'Sector 142, Noida', estimatedValue: '₹3.5 Crore', status: 'Frozen by District Magistrate order' }
    ],
    vehicleDetails: [
      { vehicleNumber: 'DL-3C-CC-1122', vehicleType: 'SUV (Endeavour - White)', registrationDetails: 'Self registered' }
    ],
    status: 'In Jail', approvalStatus: 'Approved',
    submittedBy: 'SHO Sector-20', verifiedBy: 'CO Noida Zone 1', approvedBy: 'DCP Crime Noida',
    lastUpdated: '2026-05-20T16:45:00Z'
  },
  {
    id: 'CRM-2026-0005',
    personalInfo: {
      name: 'Rakesh Patel', aliasName: 'Patelji (पटेलजी)', nickname: 'Raka',
      fatherName: 'Shanti Swaroop Patel', motherName: 'Ganga Devi', gender: 'Male',
      dob: '1990-07-29', age: 35, mobile: '9450011223', aadhaar: 'XXXX-XXXX-5521',
      address: 'Katra, Prayagraj, UP', permanentAddress: 'Handia, District Prayagraj, UP',
      photograph: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
      village: 'Handia Village'
    },
    biometrics: {
      fingerprints: 'FP-5521-SECURED', faceImage: 'FACE-RECOGNIZED-94.0%',
      identificationMarks: 'Stitch mark near left eyebrow',
      height: '170 cm', weight: '68 kg', eyeColor: 'Black', bloodGroup: 'O-'
    },
    history: [
      {
        firNumber: 'FIR-192/2025', crimeNumber: 'CR-210/2025', policeStation: 'Shivkuti', district: 'prayagraj',
        sections: 'Arms Act Sec 25/30, IPC 386 (Extortion by putting in fear of death)',
        chargeSheetStatus: 'Filed', convictionDetails: 'Under Trial',
        bailStatus: 'Out on Bail (District Court Prayagraj)', courtCaseDetails: 'Sessions Court Prayagraj Case 910/2025'
      }
    ],
    gangInfo: {
      gangName: 'Independent / Gujjar Associate', gangLeader: 'None',
      gangMembers: [],
      areaOfOperation: 'Prayagraj, Noida',
      networkMapping: [{ targetId: 'CRM-2026-0004', relation: 'Supplier / Accomplice' }]
    },
    surveillance: {
      historySheetNumber: 'HS-212B/Shivkuti', surveillanceCategory: 'Category B (Active Criminal)',
      surveillanceNotes: 'Involved in illegal weapon supply network.',
      beatOfficerRemarks: 'Reporting fortnightly. Local movements monitored closely.',
      intelligenceInputs: 'Suspected connection with small workshops in Handia manufacturing illegal ordnance.'
    },
    propertyDetails: [
      { type: 'House', address: 'Handia, Prayagraj', estimatedValue: '₹35 Lakhs', status: 'Active' }
    ],
    vehicleDetails: [
      { vehicleNumber: 'UP-70-DF-4412', vehicleType: 'SUV (Bolero - White)', registrationDetails: "Registered in father's name" }
    ],
    status: 'Out on Bail', approvalStatus: 'Approved',
    submittedBy: 'SHO Shivkuti', verifiedBy: 'CO Georgetown Circle', approvedBy: 'SSP Prayagraj Office',
    lastUpdated: '2026-05-24T18:10:00Z'
  },
  {
    id: 'CRM-2026-0006',
    personalInfo: {
      name: 'Sanjay Pal', aliasName: 'Sanjeev (संजीव)', nickname: 'Palu',
      fatherName: 'Rameshwar Pal', motherName: 'Kusum Devi', gender: 'Male',
      dob: '1992-02-14', age: 34, mobile: '9451122334', aadhaar: 'XXXX-XXXX-6671',
      address: '12/45, Chowk, Lucknow, UP', permanentAddress: 'Village Malihabad, Lucknow, UP',
      photograph: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
      village: 'Malihabad Village'
    },
    biometrics: {
      fingerprints: 'FP-6671-SECURED', faceImage: 'FACE-RECOGNIZED-91.2%',
      identificationMarks: 'Burn mark on right calf',
      height: '174 cm', weight: '72 kg', eyeColor: 'Brown', bloodGroup: 'A-'
    },
    history: [
      {
        firNumber: 'FIR-15/2026', crimeNumber: 'CR-20/2026', policeStation: 'Chowk', district: 'lucknow',
        sections: 'IPC 379, 411 (Theft, Receiving Stolen Property)',
        chargeSheetStatus: 'Under Investigation', convictionDetails: 'None',
        bailStatus: 'Pending', courtCaseDetails: 'Awaiting Charge Sheet'
      }
    ],
    gangInfo: {
      gangName: 'Raju Kaana Gang (D-102)', gangLeader: 'Rajesh Yadav',
      gangMembers: ['Rajesh Yadav', 'Amit Mishra', 'Vikram Singh'],
      areaOfOperation: 'Lucknow (Chowk, Malihabad)',
      networkMapping: [{ targetId: 'CRM-2026-0001', relation: 'Frontman / Vehicle Custodian' }]
    },
    surveillance: {
      historySheetNumber: 'HS-19C/Chowk', surveillanceCategory: 'Category C (Petty Gang Associate)',
      surveillanceNotes: 'Acts as driver and frontman for properties/vehicles owned by Rajesh Yadav.',
      beatOfficerRemarks: 'Frequently spotted near Chowk market.',
      intelligenceInputs: 'Disclosed vehicle storage locations under pressure.'
    },
    propertyDetails: [
      { type: 'Bank Account', bankName: 'Punjab National Bank, Chowk', accountNumber: 'XXXXXX5120', estimatedValue: '₹4 Lakhs', status: 'Active' }
    ],
    vehicleDetails: [
      { vehicleNumber: 'UP-32-ZZ-1200', vehicleType: 'Hatchback (Swift - White)', registrationDetails: 'Self registered' }
    ],
    status: 'Active', approvalStatus: 'Pending Verification',
    submittedBy: 'SHO Chowk', verifiedBy: 'Awaiting Verification', approvedBy: 'Awaiting Approval',
    lastUpdated: '2026-05-30T10:15:00Z'
  }
];

// ══════════════════════════════════════════════════════════
//  SUPABASE CLIENT INIT (auto-detects if credentials set)
// ══════════════════════════════════════════════════════════
(function _setupSupabase() {
  if (SUPABASE_URL.includes('YOUR-PROJECT-ID') || SUPABASE_ANON_KEY.includes('YOUR-SUPABASE-ANON')) {
    console.warn('[CDIMS Backend] Supabase not configured — using localStorage fallback.');
    return;
  }
  try {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _useSupabase = true;
    console.info('[CDIMS Backend] ✓ Supabase client connected.');
  } catch (e) {
    console.error('[CDIMS Backend] Supabase init error:', e.message);
  }
})();

// ══════════════════════════════════════════════════════════
//  DATA CONVERSION — Dossier JS objects ↔ Supabase rows
// ══════════════════════════════════════════════════════════
function _dossierToRow(d) {
  return {
    id: d.id,
    name: d.personalInfo.name,
    alias_name: d.personalInfo.aliasName || '',
    nickname: d.personalInfo.nickname || '',
    father_name: d.personalInfo.fatherName || '',
    mother_name: d.personalInfo.motherName || '',
    gender: d.personalInfo.gender || 'Male',
    dob: d.personalInfo.dob || '',
    age: d.personalInfo.age || 0,
    mobile: d.personalInfo.mobile || '',
    aadhaar: d.personalInfo.aadhaar || '',
    address: d.personalInfo.address || '',
    permanent_address: d.personalInfo.permanentAddress || '',
    photograph: d.personalInfo.photograph || '',
    village: d.personalInfo.village || '',
    blood_group: d.biometrics.bloodGroup || '',
    height: d.biometrics.height || '',
    weight: d.biometrics.weight || '',
    eye_color: d.biometrics.eyeColor || '',
    fingerprints: d.biometrics.fingerprints || '',
    face_image: d.biometrics.faceImage || '',
    identification_marks: d.biometrics.identificationMarks || '',
    gang_name: d.gangInfo.gangName || '',
    gang_leader: d.gangInfo.gangLeader || '',
    gang_members: d.gangInfo.gangMembers || [],
    area_of_operation: d.gangInfo.areaOfOperation || '',
    network_mapping: d.gangInfo.networkMapping || [],
    history_sheet_number: d.surveillance.historySheetNumber || '',
    surveillance_category: d.surveillance.surveillanceCategory || '',
    surveillance_notes: d.surveillance.surveillanceNotes || '',
    beat_officer_remarks: d.surveillance.beatOfficerRemarks || '',
    intelligence_inputs: d.surveillance.intelligenceInputs || '',
    property_details: d.propertyDetails || [],
    vehicle_details: d.vehicleDetails || [],
    status: d.status || 'Active',
    approval_status: d.approvalStatus || 'Pending Verification',
    submitted_by: d.submittedBy || '',
    verified_by: d.verifiedBy || '',
    approved_by: d.approvedBy || '',
    last_updated: d.lastUpdated || new Date().toISOString()
  };
}

function _rowToDossier(row, firs) {
  return {
    id: row.id,
    personalInfo: {
      name: row.name,
      aliasName: row.alias_name,
      nickname: row.nickname,
      fatherName: row.father_name,
      motherName: row.mother_name,
      gender: row.gender,
      dob: row.dob,
      age: row.age,
      mobile: row.mobile,
      aadhaar: row.aadhaar,
      address: row.address,
      permanentAddress: row.permanent_address,
      photograph: row.photograph,
      village: row.village
    },
    biometrics: {
      bloodGroup: row.blood_group,
      height: row.height,
      weight: row.weight,
      eyeColor: row.eye_color,
      fingerprints: row.fingerprints,
      faceImage: row.face_image,
      identificationMarks: row.identification_marks
    },
    history: (firs || []).map(f => ({
      firNumber: f.fir_number,
      crimeNumber: f.crime_number,
      policeStation: f.police_station,
      district: f.district,
      sections: f.sections,
      chargeSheetStatus: f.charge_sheet_status,
      convictionDetails: f.conviction_details,
      bailStatus: f.bail_status,
      courtCaseDetails: f.court_case_details
    })),
    gangInfo: {
      gangName: row.gang_name,
      gangLeader: row.gang_leader,
      gangMembers: row.gang_members || [],
      areaOfOperation: row.area_of_operation,
      networkMapping: row.network_mapping || []
    },
    surveillance: {
      historySheetNumber: row.history_sheet_number,
      surveillanceCategory: row.surveillance_category,
      surveillanceNotes: row.surveillance_notes,
      beatOfficerRemarks: row.beat_officer_remarks,
      intelligenceInputs: row.intelligence_inputs
    },
    propertyDetails: row.property_details || [],
    vehicleDetails: row.vehicle_details || [],
    status: row.status,
    approvalStatus: row.approval_status,
    submittedBy: row.submitted_by,
    verifiedBy: row.verified_by,
    approvedBy: row.approved_by,
    lastUpdated: row.last_updated
  };
}

function _firToRow(fir, criminalId) {
  return {
    criminal_id: criminalId,
    fir_number: fir.firNumber || '',
    crime_number: fir.crimeNumber || '',
    police_station: fir.policeStation || '',
    district: fir.district || '',
    sections: fir.sections || '',
    charge_sheet_status: fir.chargeSheetStatus || '',
    conviction_details: fir.convictionDetails || '',
    bail_status: fir.bailStatus || '',
    court_case_details: fir.courtCaseDetails || ''
  };
}

// ══════════════════════════════════════════════════════════
//  INIT — Load data from Supabase or localStorage
// ══════════════════════════════════════════════════════════
async function _doInit() {
  if (_useSupabase) {
    try {
      const { data: rows, error } = await _sb.from('criminals').select('*').order('created_at');
      if (error) throw error;

      const { data: firs, error: firErr } = await _sb.from('criminal_firs').select('*');
      if (firErr) throw firErr;

      if (!rows || rows.length === 0) {
        // First run — seed Supabase with sample data
        await _seedSupabase();
        return; // _seedSupabase re-calls _doInit
      }

      // Build FIR lookup map
      const firMap = {};
      (firs || []).forEach(f => {
        if (!firMap[f.criminal_id]) firMap[f.criminal_id] = [];
        firMap[f.criminal_id].push(f);
      });

      _cache = rows.map(r => _rowToDossier(r, firMap[r.id] || []));

      // Load audit logs
      const { data: logs } = await _sb.from('audit_logs').select('*')
        .order('created_at', { ascending: false }).limit(100);
      _auditCache = (logs || []).map(l => ({
        timestamp: l.created_at,
        username: l.username,
        role: l.role,
        action: l.action,
        details: l.details
      }));

      console.info(`[CDIMS Backend] ✓ Loaded ${_cache.length} records from Supabase.`);
    } catch (err) {
      console.error('[CDIMS Backend] Supabase load failed, using localStorage:', err.message);
      _loadLocalStorage();
    }
  } else {
    _loadLocalStorage();
  }
}

// Seed Supabase on first run
async function _seedSupabase() {
  console.info('[CDIMS Backend] Seeding Supabase with initial data...');
  for (const d of INITIAL_DOSSIERS) {
    await _sb.from('criminals').insert(_dossierToRow(d));
    if (d.history && d.history.length) {
      await _sb.from('criminal_firs').insert(d.history.map(f => _firToRow(f, d.id)));
    }
  }
  // Seed audit logs
  await _sb.from('audit_logs').insert([
    { username: 'sho_hazratganj', role: 'Police Station User', action: 'Search', details: "Searched dossiers by alias 'Kaana'" },
    { username: 'sho_chowk', role: 'Police Station User', action: 'Create Dossier', details: 'Created pending dossier CRM-2026-0006 for Sanjay Pal' },
    { username: 'sp_crime_lucknow', role: 'District Nodal Officer', action: 'Approve Dossier', details: 'Approved dossier CRM-2026-0002 for Amit Mishra' },
    { username: 'phq_admin', role: 'State Administrator', action: 'Export Data', details: 'Exported statewide wanted criminal list to PDF' }
  ]);
  // Re-load after seeding
  _initPromise = null;
  await initDatabase();
}

// Load from localStorage (fallback / offline)
function _loadLocalStorage() {
  const v = localStorage.getItem('cdims_db_version');
  if (v !== CDIMS_DB_VERSION) {
    localStorage.removeItem('cdims_dossiers');
    localStorage.removeItem('cdims_audit_logs');
    localStorage.setItem('cdims_db_version', CDIMS_DB_VERSION);
  }
  const stored = localStorage.getItem('cdims_dossiers');
  _cache = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(INITIAL_DOSSIERS));
  if (!stored) localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));

  const storedLogs = localStorage.getItem('cdims_audit_logs');
  _auditCache = storedLogs ? JSON.parse(storedLogs) : [
    { timestamp: '2026-05-30T09:12:00Z', username: 'sho_hazratganj', role: 'Police Station User', action: 'Search', details: "Searched dossiers by alias 'Kaana'" },
    { timestamp: '2026-05-30T10:15:00Z', username: 'sho_chowk', role: 'Police Station User', action: 'Create Dossier', details: 'Created pending dossier CRM-2026-0006 for Sanjay Pal' },
    { timestamp: '2026-05-30T11:20:00Z', username: 'sp_crime_lucknow', role: 'District Nodal Officer', action: 'Approve Dossier', details: 'Approved dossier CRM-2026-0002 for Amit Mishra' },
    { timestamp: '2026-05-30T14:45:00Z', username: 'phq_admin', role: 'State Administrator', action: 'Export Data', details: 'Exported statewide wanted criminal list to PDF' }
  ];
  if (!storedLogs) localStorage.setItem('cdims_audit_logs', JSON.stringify(_auditCache));
  console.info(`[CDIMS Backend] ✓ Loaded ${_cache.length} records from localStorage.`);
}

// ──────────────────────────────────────────────────────────
//  PUBLIC: initDatabase — awaitable singleton
// ──────────────────────────────────────────────────────────
async function initDatabase() {
  if (!_initPromise) {
    _initPromise = _doInit();
  }
  return _initPromise;
}

// ══════════════════════════════════════════════════════════
//  CRUD OPERATIONS
// ══════════════════════════════════════════════════════════

function getDossiers() {
  return [..._cache];
}

function saveDossiers(dossiers) {
  _cache = dossiers;
  if (!_useSupabase) {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }
}

async function addDossier(dossier, user) {
  // Generate sequential ID
  const maxNum = _cache.reduce((max, d) => {
    const n = parseInt(d.id.split('-').pop()) || 0;
    return n > max ? n : max;
  }, 0);
  dossier.id = 'CRM-2026-' + String(maxNum + 1).padStart(4, '0');
  dossier.approvalStatus = 'Pending Verification';
  dossier.submittedBy = (user && user.name) || 'SHO User';
  dossier.verifiedBy = 'Awaiting Verification';
  dossier.approvedBy = 'Awaiting Approval';
  dossier.lastUpdated = new Date().toISOString();

  _cache.push(dossier);

  if (_useSupabase) {
    try {
      await _sb.from('criminals').insert(_dossierToRow(dossier));
      if (dossier.history && dossier.history.length) {
        await _sb.from('criminal_firs').insert(dossier.history.map(f => _firToRow(f, dossier.id)));
      }
    } catch (e) {
      console.error('[CDIMS] addDossier Supabase error:', e.message);
    }
  } else {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }

  addAuditLog(
    (user && user.username) || 'unknown',
    (user && user.role) || 'Unknown',
    'Create Dossier',
    `Created ${dossier.id} for ${dossier.personalInfo.name}`
  );
  return dossier;
}

async function updateDossier(dossier, user) {
  const idx = _cache.findIndex(d => d.id === dossier.id);
  if (idx === -1) return false;

  dossier.lastUpdated = new Date().toISOString();
  _cache[idx] = dossier;

  if (_useSupabase) {
    try {
      await _sb.from('criminals').update(_dossierToRow(dossier)).eq('id', dossier.id);
      // Refresh FIRs: delete old, insert fresh
      await _sb.from('criminal_firs').delete().eq('criminal_id', dossier.id);
      if (dossier.history && dossier.history.length) {
        await _sb.from('criminal_firs').insert(dossier.history.map(f => _firToRow(f, dossier.id)));
      }
    } catch (e) {
      console.error('[CDIMS] updateDossier Supabase error:', e.message);
    }
  } else {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }

  addAuditLog(
    (user && user.username) || 'unknown',
    (user && user.role) || 'Unknown',
    'Update Dossier',
    `Updated ${dossier.id} (${dossier.personalInfo.name})`
  );
  return true;
}

async function approveDossier(id, user) {
  const idx = _cache.findIndex(d => d.id === id);
  if (idx === -1) return false;

  const now = new Date().toISOString();
  _cache[idx].approvalStatus = 'Approved';
  _cache[idx].verifiedBy = (user && user.name) || 'Verified Officer';
  _cache[idx].approvedBy = (user && user.name) || 'Approving Officer';
  _cache[idx].lastUpdated = now;

  if (_useSupabase) {
    try {
      await _sb.from('criminals').update({
        approval_status: 'Approved',
        verified_by: _cache[idx].verifiedBy,
        approved_by: _cache[idx].approvedBy,
        last_updated: now
      }).eq('id', id);
    } catch (e) {
      console.error('[CDIMS] approveDossier Supabase error:', e.message);
    }
  } else {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }

  addAuditLog((user && user.username) || 'unknown', (user && user.role) || 'Unknown', 'Approve Dossier', `Approved ${id}`);
  return true;
}

async function returnDossierForCorrection(id, remarks, user) {
  const idx = _cache.findIndex(d => d.id === id);
  if (idx === -1) return false;

  const now = new Date().toISOString();
  _cache[idx].approvalStatus = 'Returned for Correction';
  _cache[idx].surveillance.intelligenceInputs = `Correction required: ${remarks}`;
  _cache[idx].lastUpdated = now;

  if (_useSupabase) {
    try {
      await _sb.from('criminals').update({
        approval_status: 'Returned for Correction',
        intelligence_inputs: `Correction required: ${remarks}`,
        last_updated: now
      }).eq('id', id);
    } catch (e) {
      console.error('[CDIMS] returnDossier Supabase error:', e.message);
    }
  } else {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }

  addAuditLog((user && user.username) || 'unknown', (user && user.role) || 'Unknown', 'Return Dossier', `Returned ${id} for correction.`);
  return true;
}

// ══════════════════════════════════════════════════════════
//  AUDIT LOGS
// ══════════════════════════════════════════════════════════
function getAuditLogs() {
  return [..._auditCache];
}

async function addAuditLog(username, role, action, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    username: username || 'system',
    role: role || 'System',
    action,
    details
  };
  _auditCache.unshift(entry);
  if (_auditCache.length > 200) _auditCache.pop();

  if (_useSupabase) {
    // Fire-and-forget async
    _sb.from('audit_logs').insert({ username: entry.username, role: entry.role, action, details })
      .then(({ error }) => { if (error) console.warn('[CDIMS] Audit log failed:', error.message); });
  } else {
    localStorage.setItem('cdims_audit_logs', JSON.stringify(_auditCache));
  }
}

// ══════════════════════════════════════════════════════════
//  SEARCH  (synchronous from in-memory cache)
// ══════════════════════════════════════════════════════════
function searchDossiers(filters) {
  return _cache.filter(d => {
    if (filters.district && filters.district !== 'all') {
      const inDistrict = d.history.some(h => h.district === filters.district);
      if (!inDistrict) return false;
    }
    if (filters.status && filters.status !== 'all' && d.status !== filters.status) return false;
    if (filters.approvalStatus && filters.approvalStatus !== 'all' && d.approvalStatus !== filters.approvalStatus) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      const t = [
        d.personalInfo.name, d.personalInfo.aliasName, d.personalInfo.nickname,
        d.personalInfo.mobile, d.personalInfo.aadhaar, d.id,
        d.gangInfo.gangName,
        ...d.vehicleDetails.map(v => v.vehicleNumber + ' ' + v.vehicleType),
        ...d.history.map(h => h.firNumber + ' ' + h.sections + ' ' + h.policeStation)
      ].join(' ').toLowerCase();
      if (!t.includes(q)) return false;
    }
    return true;
  });
}

// ══════════════════════════════════════════════════════════
//  ANALYTICS  (pure computation, no DB calls)
// ══════════════════════════════════════════════════════════
function calculateRiskScore(dossier) {
  let score = 10;
  const { status, surveillance, history, personalInfo, gangInfo } = dossier;
  if (status === 'Wanted') score += 40;
  if (status === 'In Jail') score -= 15;
  if (surveillance.surveillanceCategory.includes('Category A')) score += 30;
  if (surveillance.surveillanceCategory.includes('Category B')) score += 15;
  const sections = history.map(h => h.sections).join(' ');
  if (sections.includes('302') || sections.includes('Murder') || sections.includes('Gangsters Act')) score += 20;
  score += Math.min(history.length * 10, 20);
  if (personalInfo.aliasName.toLowerCase().includes('shooter') || surveillance.surveillanceNotes.toLowerCase().includes('weapon')) score += 10;
  return Math.min(score, 100);
}

function runCrimePatternAnalysis(dossier) {
  const sections = dossier.history.map(h => h.sections).join(' ');
  if (sections.includes('302') || sections.includes('307')) {
    return {
      pattern: 'Pattern Analysis: High-risk offender with violent crime history involving physical threats.',
      forecast: 'Predictive Intelligence: Likely to participate in armed extortion or contract killings.',
      suggestions: 'Action Items: Coordinate with Beat Officers for proactive arms checks and surveillance intensification.'
    };
  }
  if (sections.includes('420') || sections.includes('467')) {
    return {
      pattern: 'Pattern Analysis: White collar fraud specialist targeting property registrations and financial channels.',
      forecast: 'Predictive Intelligence: Probable attempts to establish shell enterprises or proxy bank accounts.',
      suggestions: 'Action Items: Verify tax filings of suspected front stores. Request financial intelligence unit audit.'
    };
  }
  return {
    pattern: 'Pattern Analysis: Petty operations or logistical facilitator for higher-level criminal operators.',
    forecast: 'Predictive Intelligence: Vulnerable to recruitment for weapon or illegal asset transfers.',
    suggestions: 'Action Items: Conduct regular checks on registered vehicles. Monitor frequented locations and associates.'
  };
}

function generateStatistics() {
  const dossiers = _cache;
  const allStations = MASTER_DATA.districts.reduce((arr, d) =>
    arr.concat(d.circles.reduce((a2, c) => a2.concat(c.stations), [])), []);

  const stats = {
    totalCriminals: dossiers.length,
    activeCriminals: dossiers.filter(d => d.status === 'Active' || d.status === 'Wanted').length,
    historySheeters: dossiers.filter(d => d.surveillance.historySheetNumber).length,
    gangsters: dossiers.filter(d => d.gangInfo.gangName && !d.gangInfo.gangName.includes('Independent')).length,
    wantedCriminals: dossiers.filter(d => d.status === 'Wanted').length,
    districtCount: MASTER_DATA.districts.length,
    policeStationCount: allStations.length
  };

  const distCounts = {};
  MASTER_DATA.districts.forEach(d => { distCounts[d.id] = 0; });
  dossiers.forEach(d => d.history.forEach(h => { if (distCounts[h.district] !== undefined) distCounts[h.district]++; }));
  stats.districtComparison = MASTER_DATA.districts.map(d => ({ name: d.name, count: distCounts[d.id] || 0 }));

  const cats = { 'Wanted': 0, 'Active': 0, 'In Jail': 0, 'Out on Bail': 0 };
  dossiers.forEach(d => { if (cats[d.status] !== undefined) cats[d.status]++; });
  stats.categoryBreakdown = Object.entries(cats).map(([name, value]) => ({ name, value }));

  return stats;
}

// ══════════════════════════════════════════════════════════
//  WINDOW EXPORTS — identical API surface as old dossiers.js
// ══════════════════════════════════════════════════════════
window.MASTER_DATA = MASTER_DATA;
window.INITIAL_DOSSIERS = INITIAL_DOSSIERS;
window.VILLAGES_BY_STATION = VILLAGES_BY_STATION;
window.CDIMS_DB_VERSION = CDIMS_DB_VERSION;

window.initDatabase = initDatabase;
window.getDossiers = getDossiers;
window.saveDossiers = saveDossiers;
window.addDossier = addDossier;
window.updateDossier = updateDossier;
window.approveDossier = approveDossier;
window.returnDossierForCorrection = returnDossierForCorrection;
window.searchDossiers = searchDossiers;
window.getAuditLogs = getAuditLogs;
window.addAuditLog = addAuditLog;
window.calculateRiskScore = calculateRiskScore;
window.runCrimePatternAnalysis = runCrimePatternAnalysis;
window.generateStatistics = generateStatistics;

// ──────────────────────────────────────────────────────────
//  Auto-start loading data immediately on page load
//  so data is ready by the time user clicks Login
// ──────────────────────────────────────────────────────────
initDatabase().catch(err => console.error('[CDIMS Backend] Init failed:', err));
