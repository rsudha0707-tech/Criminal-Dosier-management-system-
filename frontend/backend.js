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
const SUPABASE_URL = 'https://aryjmwhfrroqwsoyyhyz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyeWptd2hmcnJvcXdzb3l5aHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NjM3OTYsImV4cCI6MjA5NDQzOTc5Nn0.5EKWHSg0RTK5ORvMU59WdEeZQAQrmgT2mywdIN07n8g';
// ══════════════════════════════════════════════════════════

const CDIMS_DB_VERSION = 'v3-csv';

// Internal state
let _sb = null;   // Supabase client
let _useSupabase = false;  // true once credentials validated
let _cache = [];     // in-memory dossier array
let _auditCache = [];     // in-memory audit log array
let _usersCache = JSON.parse(localStorage.getItem('cdims_users')) || [
  { name: 'SHO Rajiv Sharma', username: 'sho_hazratganj', role: 'Police Station User', level: 'L1', station: 'Hazratganj PS, Lucknow', status: 'Active' },
  { name: 'IO Priya Singh', username: 'io_chowk', role: 'Police Station User', level: 'L1', station: 'Chowk PS, Lucknow', status: 'Active' },
  { name: 'CO Prashant Mishra', username: 'co_lucknow', role: 'District Nodal Officer', level: 'L2', station: 'CO Office, Lucknow', status: 'Active' },
  { name: 'SP Crime Varanasi', username: 'sp_crime_vns', role: 'District Nodal Officer', level: 'L2', station: 'SP Office, Varanasi', status: 'Active' },
  { name: 'DG Intelligence (PHQ)', username: 'phq_admin', role: 'State Administrator', level: 'L3', station: 'PHQ Lucknow', status: 'Active' }
];
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
        { id: 'noida_1', name: 'Noida Zone 1', stations: ['Sector-20', 'Sector-39', 'Sector-58', 'Phase-1'] },
        { id: 'noida_2', name: 'Noida Zone 2', stations: ['Phase-2', 'Phase-3'] }
      ]
    },
    {
      id: 'ghaziabad', name: 'Ghaziabad (गाजियाबाद)', isCommissionerate: true,
      circles: [
        { id: 'kavi_nagar_circle', name: 'Kavi Nagar Circle', stations: ['Kavi Nagar'] }
      ]
    },
    {
      id: 'agra', name: 'Agra (आगरा)', isCommissionerate: true,
      circles: [
        { id: 'mg_road_circle', name: 'MG Road Circle', stations: ['MG Road'] }
      ]
    },
    {
      id: 'kanpur', name: 'Kanpur (कानपुर)', isCommissionerate: true,
      circles: [
        { id: 'kotwali_circle', name: 'Kotwali Circle', stations: ['Kotwali'] }
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
  'Phase-3': ['Mamura', 'Garhi Chaukhandi'],
  'Phase-1': ['Sector-1 Basti', 'Phase 1 Dehat'],
  'Kavi Nagar': ['Kavi Nagar Village', 'Ghaziabad Basti'],
  'MG Road': ['MG Road Dehat', 'Agra Fort Village'],
  'Kotwali': ['Kotwali Basti', 'Kanpur Dehat']
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
    window._useSupabase = false;
    return;
  }
  try {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _useSupabase = true;
    window._useSupabase = true;
    console.info('[CDIMS Backend] ✓ Supabase client connected.');
  } catch (e) {
    console.error('[CDIMS Backend] Supabase init error:', e.message);
    window._useSupabase = false;
  }
})();

// ══════════════════════════════════════════════════════════
//  DATA CONVERSION — Dossier JS objects ↔ Supabase cdims_dossiers rows
// ══════════════════════════════════════════════════════════
function _dossierToSupabaseRow(d) {
  return {
    id: d.id,
    personal_info: d.personalInfo,
    biometrics: d.biometrics,
    history: d.history || [],
    gang_info: d.gangInfo,
    surveillance: d.surveillance,
    property_details: d.propertyDetails || [],
    vehicle_details: d.vehicleDetails || [],
    status: d.status,
    approval_status: d.approvalStatus,
    submitted_by: d.submittedBy || '',
    verified_by: d.verifiedBy || '',
    approved_by: d.approvedBy || '',
    last_updated: d.lastUpdated || new Date().toISOString()
  };
}

function _supabaseRowToDossier(row) {
  if (!row) return null;
  const history = row.history || [];
  const primaryDistrict = history[0]?.district || 'lucknow';
  const personalInfo = row.personal_info ? { ...row.personal_info } : {};
  if (!personalInfo.district) {
    personalInfo.district = primaryDistrict;
  }
  return {
    id: row.id,
    district: primaryDistrict,
    personalInfo: personalInfo,
    biometrics: row.biometrics || {},
    history: history,
    gangInfo: row.gang_info || {},
    surveillance: row.surveillance || {},
    propertyDetails: row.property_details || [],
    vehicleDetails: row.vehicle_details || [],
    status: row.status,
    approvalStatus: row.approval_status,
    submittedBy: row.submitted_by || '',
    verifiedBy: row.verified_by || '',
    approvedBy: row.approved_by || '',
    lastUpdated: row.last_updated
  };
}

// ══════════════════════════════════════════════════════════
//  CSV PARSING & DATA TRACKING SYSTEM
// ══════════════════════════════════════════════════════════

function parseCSV(text) {
  if (!text) return [];
  // Detect delimiter: count commas and tabs in the first line
  const firstLine = text.split(/\r?\n/)[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === delimiter && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') { i++; }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  if (lines.length === 0) return [];

  const headers = lines[0].map(h => h.trim());
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.length < headers.length) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = line[j] ? line[j].trim() : '';
    }
    data.push(obj);
  }
  return data;
}

function _csvRowToDossier(row) {
  // Support custom dummy data format: record_id, full_name, etc.
  if (row.record_id || row.full_name) {
    const ps = row.police_station || 'Hazratganj';

    // Match village to station's villages or default
    let village = 'Dehat';
    if (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[ps] && window.VILLAGES_BY_STATION[ps].length > 0) {
      village = window.VILLAGES_BY_STATION[ps][0];
    }

    // Map surveillance status (Closed, Observed, Watchlist) to status and category
    let status = 'Active';
    let category = 'Category B (Active Criminal)';
    if (row.surveillance_status === 'Watchlist') {
      status = 'Wanted';
      category = 'Category A (Hardened Gangster)';
    } else if (row.surveillance_status === 'Observed') {
      status = 'Active';
      category = 'Category B (Active Criminal)';
    } else if (row.surveillance_status === 'Closed') {
      status = 'Out on Bail';
      category = 'Category C (Petty Associate)';
    }

    // Parse property details if present
    let propertyDetails = [];
    if (row.property_details) {
      propertyDetails = [{
        type: 'Asset',
        address: 'District ' + (row.district || 'Lucknow'),
        estimatedValue: 'N/A',
        status: row.property_details
      }];
    }

    // Parse vehicle details if present
    let vehicleDetails = [];
    if (row.vehicle_details) {
      vehicleDetails = [{
        vehicleNumber: row.vehicle_details,
        vehicleType: 'Vehicle',
        registrationDetails: 'Registered'
      }];
    }

    // Approximate DOB based on age
    const age = parseInt(row.age) || 30;
    const dob = new Date(new Date().getFullYear() - age, 0, 1).toISOString().split('T')[0];

    // Normalize district ID to match MASTER_DATA key
    let distId = row.district ? row.district.toLowerCase().trim() : 'lucknow';
    if (distId.includes('gautam') || distId.includes('noida')) {
      distId = 'noida';
    }

    // Build history entry
    const history = [{
      firNumber: row.fir_reference || 'Pending',
      crimeNumber: 'Pending',
      policeStation: ps,
      district: distId,
      sections: row.crime_history || 'Under Investigation',
      chargeSheetStatus: 'Under Investigation',
      convictionDetails: 'Under Trial',
      bailStatus: status === 'Out on Bail' ? 'Out on Bail' : 'Pending',
      courtCaseDetails: 'Under Investigation'
    }];

    return {
      id: row.record_id || 'CRM-2026-XXXX',
      district: distId,
      personalInfo: {
        name: row.full_name || '',
        aliasName: row.alias || '',
        nickname: '',
        fatherName: 'N/A',
        motherName: 'N/A',
        gender: 'Male',
        dob: dob,
        age: age,
        mobile: 'N/A',
        aadhaar: 'XXXX-XXXX-XXXX',
        address: row.last_known_location || 'UP',
        permanentAddress: 'UP',
        photograph: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
        village: village,
        district: distId
      },
      biometrics: {
        fingerprints: row.biometric_profile || 'SECURED',
        faceImage: 'FACE-RECOGNIZED',
        identificationMarks: 'None reported',
        height: '175 cm',
        weight: '75 kg',
        eyeColor: 'Black',
        bloodGroup: 'B+'
      },
      history: history,
      gangInfo: {
        gangName: row.gang_details || 'Independent',
        gangLeader: 'N/A',
        gangMembers: [],
        areaOfOperation: row.district || 'Lucknow',
        networkMapping: []
      },
      surveillance: {
        historySheetNumber: 'HS-PENDING',
        surveillanceCategory: category,
        surveillanceNotes: row.last_known_location || 'Under surveillance',
        beatOfficerRemarks: 'None',
        intelligenceInputs: row.notice || 'None'
      },
      propertyDetails: propertyDetails,
      vehicleDetails: vehicleDetails,
      intelReports: [],
      status: status,
      approvalStatus: 'Approved',
      submittedBy: 'SHO ' + ps,
      verifiedBy: 'CO Office',
      approvedBy: 'SP Office',
      lastUpdated: new Date().toISOString()
    };
  }

  // Native dossiers.csv schema mapping
  let history = [];
  try {
    history = row.history ? JSON.parse(row.history) : [];
  } catch (e) { console.error("Error parsing CSV history field", e); }

  let propertyDetails = [];
  try {
    propertyDetails = row.propertyDetails ? JSON.parse(row.propertyDetails) : [];
  } catch (e) { console.error("Error parsing CSV propertyDetails field", e); }

  let vehicleDetails = [];
  try {
    vehicleDetails = row.vehicleDetails ? JSON.parse(row.vehicleDetails) : [];
  } catch (e) { console.error("Error parsing CSV vehicleDetails field", e); }

  let intelReports = [];
  try {
    intelReports = row.intelReports ? JSON.parse(row.intelReports) : [];
  } catch (e) { console.error("Error parsing CSV intelReports field", e); }

  let gangMembers = [];
  if (row.gangMembers) {
    gangMembers = row.gangMembers.split(';').map(m => m.trim()).filter(Boolean);
  }

  const primaryDistrict = history[0]?.district || 'lucknow';
  return {
    id: row.id || 'CRM-2026-XXXX',
    district: primaryDistrict,
    personalInfo: {
      name: row.name || '',
      aliasName: row.aliasName || '',
      nickname: row.nickname || '',
      fatherName: row.fatherName || '',
      motherName: row.motherName || '',
      gender: row.gender || 'Male',
      dob: row.dob || '',
      age: parseInt(row.age) || 0,
      mobile: row.mobile || '',
      aadhaar: row.aadhaar || '',
      address: row.address || '',
      permanentAddress: row.permanentAddress || '',
      photograph: row.photograph || '',
      village: (() => {
        let v = row.village || '';
        if (v === 'Dehat' || v === '') {
          const mainHistory = history && history[0] ? history[0] : {};
          const ps = mainHistory.policeStation || 'Hazratganj';
          if (window.VILLAGES_BY_STATION && window.VILLAGES_BY_STATION[ps] && window.VILLAGES_BY_STATION[ps].length > 0) {
            const vList = window.VILLAGES_BY_STATION[ps];
            let idHash = 0;
            const idStr = row.id || '';
            for (let i = 0; i < idStr.length; i++) idHash += idStr.charCodeAt(i);
            v = vList[idHash % vList.length];
          }
        }
        return v;
      })(),
      district: row.district || primaryDistrict
    },
    biometrics: {
      fingerprints: row.fingerprints || '',
      faceImage: row.faceImage || '',
      identificationMarks: row.identificationMarks || '',
      height: row.height || '',
      weight: row.weight || '',
      eyeColor: row.eyeColor || '',
      bloodGroup: row.bloodGroup || ''
    },
    history: history,
    gangInfo: {
      gangName: row.gangName || '',
      gangLeader: row.gangLeader || '',
      gangMembers: gangMembers,
      areaOfOperation: row.areaOfOperation || '',
      networkMapping: []
    },
    surveillance: {
      historySheetNumber: row.historySheetNumber || '',
      surveillanceCategory: row.surveillanceCategory || '',
      surveillanceNotes: row.surveillanceNotes || '',
      beatOfficerRemarks: row.beatOfficerRemarks || '',
      intelligenceInputs: row.intelligenceInputs || ''
    },
    propertyDetails: propertyDetails,
    vehicleDetails: vehicleDetails,
    intelReports: intelReports,
    status: row.status || 'Active',
    approvalStatus: row.approvalStatus || 'Approved',
    submittedBy: row.submittedBy || 'SHO User',
    verifiedBy: row.verifiedBy || 'CO Office',
    approvedBy: row.approvedBy || 'SP Office',
    lastUpdated: row.lastUpdated || new Date().toISOString()
  };
}

function importDossiersFromCSVContent(text) {
  try {
    const rows = parseCSV(text);
    if (!rows || rows.length === 0) throw new Error("Invalid CSV format or empty file");
    const parsedDossiers = rows.map(_csvRowToDossier);

    _cache = parsedDossiers;
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
    syncVillagesFromDossiers();
    console.info(`[CDIMS Backend] Successfully imported ${_cache.length} records.`);
    return { success: true, count: _cache.length };
  } catch (error) {
    console.error("[CDIMS Backend] CSV Import failed:", error);
    return { success: false, error: error.message };
  }
}

async function loadDossiersFromCSV() {
  try {
    const response = await fetch('dossiers.csv');
    if (!response.ok) throw new Error("Failed to fetch dossiers.csv");
    const text = await response.text();
    const rows = parseCSV(text);
    const csvDossiers = rows.map(_csvRowToDossier);

    // Merge with any newly added local user dossiers that are not in the CSV
    const stored = localStorage.getItem('cdims_dossiers');
    const localDossiers = stored ? JSON.parse(stored) : [];
    const csvIds = new Set(csvDossiers.map(d => d.id));

    const merged = [...csvDossiers];
    for (const d of localDossiers) {
      if (!csvIds.has(d.id)) {
        merged.push(d);
      }
    }

    _cache = merged;
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
    console.info(`[CDIMS Backend] ✓ Loaded ${_cache.length} records from dossiers.csv.`);
  } catch (error) {
    console.error("[CDIMS Backend] Failed to load CSV dossiers, using localStorage fallback:", error);
    _loadLocalStorage();
  }
}

// ══════════════════════════════════════════════════════════
//  INIT — Load data from Supabase/CSV with localStorage fallback
// ══════════════════════════════════════════════════════════
function _loadLocalAuditLogs() {
  const storedLogs = localStorage.getItem('cdims_audit_logs');
  _auditCache = storedLogs ? JSON.parse(storedLogs) : [
    { timestamp: '2026-05-30T09:12:00Z', username: 'sho_hazratganj', role: 'Police Station User', action: 'Search', details: "Searched dossiers by alias 'Kaana'" },
    { timestamp: '2026-05-30T10:15:00Z', username: 'sho_chowk', role: 'Police Station User', action: 'Create Dossier', details: 'Created pending dossier CRM-2026-0006 for Sanjay Pal' },
    { timestamp: '2026-05-30T11:20:00Z', username: 'sp_crime_lucknow', role: 'District Nodal Officer', action: 'Approve Dossier', details: 'Approved dossier CRM-2026-0002 for Amit Mishra' },
    { timestamp: '2026-05-30T14:45:00Z', username: 'phq_admin', role: 'State Administrator', action: 'Export Data', details: 'Exported statewide wanted criminal list to PDF' }
  ];
  if (!storedLogs) localStorage.setItem('cdims_audit_logs', JSON.stringify(_auditCache));
}

async function _doInit() {
  if (_useSupabase && _sb) {
    try {
      console.info('[CDIMS Backend] Querying Supabase cdims_dossiers table...');
      const { data, error } = await _sb.from('cdims_dossiers').select('*');
      if (error) {
        console.error('[CDIMS Backend] Failed to fetch cdims_dossiers from Supabase:', error.message);
        await loadDossiersFromCSV();
        _loadLocalAuditLogs();
      } else if (!data || data.length === 0) {
        console.warn('[CDIMS Backend] Supabase cdims_dossiers is empty. Auto-seeding initial data...');
        await _seedSupabase();
        return; // Seed logic re-triggers initDatabase
      } else {
        _cache = data.map(_supabaseRowToDossier);
        localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
        console.info(`[CDIMS Backend] ✓ Loaded ${_cache.length} records from Supabase cdims_dossiers.`);

        // Fetch audit logs
        const { data: logs, error: logsError } = await _sb
          .from('cdims_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (logsError) {
          console.warn('[CDIMS Backend] Failed to fetch cdims_audit_logs from Supabase:', logsError.message);
          _loadLocalAuditLogs();
        } else {
          _auditCache = (logs || []).map(l => ({
            timestamp: l.created_at || new Date().toISOString(),
            username: l.username || 'unknown',
            role: l.role || 'Unknown',
            action: l.action || 'Unknown',
            details: l.details || ''
          }));
          localStorage.setItem('cdims_audit_logs', JSON.stringify(_auditCache));
          console.info(`[CDIMS Backend] ✓ Loaded ${_auditCache.length} audit logs from Supabase.`);
        }
      }
    } catch (e) {
      console.error('[CDIMS Backend] Exception during Supabase initialization:', e.message);
      await loadDossiersFromCSV();
      _loadLocalAuditLogs();
    }
  } else {
    await loadDossiersFromCSV();
    _loadLocalAuditLogs();
  }
  syncVillagesFromDossiers();
}

// Seed Supabase on first run
async function _seedSupabase() {
  console.info('[CDIMS Backend] Seeding Supabase with initial cdims_dossiers data...');
  for (const d of INITIAL_DOSSIERS) {
    const { error } = await _sb.from('cdims_dossiers').insert(_dossierToSupabaseRow(d));
    if (error) {
      console.error(`[CDIMS Backend] Seeding error for ${d.id}:`, error.message);
    }
  }
  // Seed audit logs
  await _sb.from('cdims_audit_logs').insert([
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
  
  // Ensure district and personalInfo.district are set
  _cache.forEach(d => {
    const primaryDistrict = d.history[0]?.district || 'lucknow';
    if (!d.district) d.district = primaryDistrict;
    if (!d.personalInfo.district) d.personalInfo.district = primaryDistrict;
  });

  if (!stored) localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));

  _loadLocalAuditLogs();
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
  if (!window.currentUser) {
    return [..._cache];
  }
  const user = window.currentUser;
  if (user.level === 3) {
    return [..._cache];
  } else if (user.level === 2) {
    return _cache.filter(d => d.history && d.history.some(h => h.district === user.district));
  } else if (user.level === 1) {
    const stationKey = user.station ? user.station.split(' PS')[0].trim().toLowerCase() : '';
    return _cache.filter(d => {
      const matchStation = (d.history && d.history.some(h => h.policeStation && h.policeStation.toLowerCase() === stationKey)) ||
        (d.submittedBy && d.submittedBy.toLowerCase().includes(stationKey));
      return matchStation;
    });
  }
  return [..._cache];
}

function saveDossiers(dossiers) {
  _cache = dossiers;
  if (!_useSupabase) {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }
  syncVillagesFromDossiers();
}

async function addDossier(dossier, user, photos = []) {
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

  const primaryDistrict = dossier.history[0]?.district || 'lucknow';
  if (!dossier.district) dossier.district = primaryDistrict;
  if (!dossier.personalInfo.district) dossier.personalInfo.district = primaryDistrict;

  _cache.push(dossier);
  syncVillagesFromDossiers();

  if (_useSupabase && _sb) {
    try {
      const { error } = await _sb.from('cdims_dossiers').insert(_dossierToSupabaseRow(dossier));
      if (error) throw error;

      if (photos && photos.length > 0) {
        const photoRecords = photos.map(p => ({ dossier_id: dossier.id, photo_url: p }));
        const { error: photoErr } = await _sb.from('cdims_dossier_photos').insert(photoRecords);
        if (photoErr) throw photoErr;
      }

      localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
    } catch (e) {
      console.error('[CDIMS] addDossier Supabase error:', e.message);
    }
  } else {
    if (photos && photos.length > 0) {
      const stored = localStorage.getItem('cdims_dossier_photos');
      const localPhotos = stored ? JSON.parse(stored) : [];
      photos.forEach(p => {
        localPhotos.push({ dossierId: dossier.id, photoUrl: p });
      });
      localStorage.setItem('cdims_dossier_photos', JSON.stringify(localPhotos));
    }
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

  const primaryDistrict = dossier.history[0]?.district || 'lucknow';
  if (!dossier.district) dossier.district = primaryDistrict;
  if (!dossier.personalInfo.district) dossier.personalInfo.district = primaryDistrict;

  _cache[idx] = dossier;
  syncVillagesFromDossiers();

  if (_useSupabase && _sb) {
    try {
      const { error } = await _sb.from('cdims_dossiers').update(_dossierToSupabaseRow(dossier)).eq('id', dossier.id);
      if (error) throw error;
      localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
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

async function verifyDossier(id, user) {
  const idx = _cache.findIndex(d => d.id === id);
  if (idx === -1) return false;

  const now = new Date().toISOString();
  _cache[idx].approvalStatus = 'Pending Approval';
  _cache[idx].verifiedBy = (user && user.name) || 'District Nodal Officer';
  _cache[idx].lastUpdated = now;

  if (_useSupabase && _sb) {
    try {
      const { error } = await _sb.from('cdims_dossiers').update({
        approval_status: 'Pending Approval',
        verified_by: _cache[idx].verifiedBy,
        last_updated: now
      }).eq('id', id);
      if (error) throw error;
      localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
    } catch (e) {
      console.error('[CDIMS] verifyDossier Supabase error:', e.message);
    }
  } else {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }

  addAuditLog((user && user.username) || 'unknown', (user && user.role) || 'Unknown', 'Verify Dossier', `Verified dossier ${id} and sent to PHQ Admin`);
  return true;
}

async function approveDossier(id, user) {
  const idx = _cache.findIndex(d => d.id === id);
  if (idx === -1) return false;

  const now = new Date().toISOString();
  _cache[idx].approvalStatus = 'Approved';
  _cache[idx].approvedBy = (user && user.name) || 'PHQ Admin';
  _cache[idx].lastUpdated = now;

  if (_useSupabase && _sb) {
    try {
      const { error } = await _sb.from('cdims_dossiers').update({
        approval_status: 'Approved',
        approved_by: _cache[idx].approvedBy,
        last_updated: now
      }).eq('id', id);
      if (error) throw error;
      localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
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

  if (_useSupabase && _sb) {
    try {
      const { error } = await _sb.from('cdims_dossiers').update({
        approval_status: 'Returned for Correction',
        surveillance: _cache[idx].surveillance,
        last_updated: now
      }).eq('id', id);
      if (error) throw error;
      localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
    } catch (e) {
      console.error('[CDIMS] returnDossier Supabase error:', e.message);
    }
  } else {
    localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
  }

  addAuditLog((user && user.username) || 'unknown', (user && user.role) || 'Unknown', 'Return Dossier', `Returned ${id} for correction.`);
  return true;
}

async function dbAddUser(user) {
  const mappedUser = {
    name: user.name,
    username: user.username,
    role: user.role,
    level: 'L' + user.level,
    station: user.station || 'PHQ',
    status: 'Active'
  };
  
  const idx = _usersCache.findIndex(u => u.username === user.username);
  if (idx === -1) {
    _usersCache.push(mappedUser);
  } else {
    _usersCache[idx] = mappedUser;
  }
  localStorage.setItem('cdims_users', JSON.stringify(_usersCache));

  if (_useSupabase && _sb) {
    try {
      const { error } = await _sb.from('cdims_users').insert([user]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('[CDIMS] dbAddUser Supabase error:', e.message);
      throw e;
    }
  }
  return true;
}

async function getSystemUsers() {
  if (_useSupabase && _sb) {
    try {
      console.info('[CDIMS Backend] Fetching cdims_users from Supabase...');
      const { data, error } = await _sb.from('cdims_users').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        _usersCache = data.map(u => ({
          name: u.name,
          username: u.username,
          role: u.role,
          level: 'L' + u.level,
          station: u.station || 'PHQ',
          status: 'Active'
        }));
      }
    } catch (e) {
      console.warn('[CDIMS] Failed to fetch cdims_users from Supabase:', e.message);
    }
  } else {
    const stored = localStorage.getItem('cdims_users');
    if (stored) {
      _usersCache = JSON.parse(stored);
    }
  }
  return [..._usersCache];
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

  if (_useSupabase && _sb) {
    // Fire-and-forget async
    _sb.from('cdims_audit_logs').insert({ username: entry.username, role: entry.role, action, details })
      .then(({ error }) => { if (error) console.warn('[CDIMS] Audit log failed:', error.message); });
    localStorage.setItem('cdims_audit_logs', JSON.stringify(_auditCache));
  } else {
    localStorage.setItem('cdims_audit_logs', JSON.stringify(_auditCache));
  }
}

// ══════════════════════════════════════════════════════════
//  SEARCH  (synchronous from in-memory cache)
// ══════════════════════════════════════════════════════════
function searchDossiers(filters) {
  return getDossiers().filter(d => {
    if (filters.district && filters.district !== 'all') {
      const inDistrict = d.history.some(h => h.district === filters.district);
      if (!inDistrict) return false;
    }
    if (filters.status && filters.status !== 'all' && d.status !== filters.status) return false;
    if (filters.approvalStatus && filters.approvalStatus !== 'all' && d.approvalStatus !== filters.approvalStatus) return false;
    
    // Special Filters from Dashboard
    if (filters.special && filters.special !== 'all') {
      if (filters.special === 'active') {
        if (d.status !== 'Active' && d.status !== 'Wanted') return false;
      } else if (filters.special === 'history_sheeter') {
        if (!d.surveillance.historySheetNumber || d.surveillance.historySheetNumber.toLowerCase().includes('pending') || d.surveillance.historySheetNumber.toLowerCase().includes('n/a')) return false;
      } else if (filters.special === 'gangster') {
        if (!d.gangInfo.gangName || d.gangInfo.gangName.includes('Independent')) return false;
      }
    }
    
    // Filter by Police Station Scope (Single vs Multiple)
    if (filters.stationScope && filters.stationScope !== 'all') {
      const uniqueStations = new Set(d.history.map(h => (h.policeStation || '').trim().toLowerCase()));
      if (filters.stationScope === 'multiple' && uniqueStations.size <= 1) return false;
      if (filters.stationScope === 'single' && uniqueStations.size > 1) return false;
    }

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
  const dossiers = getDossiers();
  const allStations = MASTER_DATA.districts.reduce((arr, d) =>
    arr.concat(d.circles.reduce((a2, c) => a2.concat(c.stations), [])), []);

  const stats = {
    totalCriminals: dossiers.length,
    activeCriminals: dossiers.filter(d => d.status === 'Active' || d.status === 'Wanted').length,
    historySheeters: dossiers.filter(d => d.surveillance.historySheetNumber && !d.surveillance.historySheetNumber.toLowerCase().includes('pending') && !d.surveillance.historySheetNumber.toLowerCase().includes('n/a')).length,
    gangsters: dossiers.filter(d => d.gangInfo.gangName && !d.gangInfo.gangName.includes('Independent')).length,
    wantedCriminals: dossiers.filter(d => d.status === 'Wanted').length,
    districtCount: MASTER_DATA.districts.length,
    policeStationCount: allStations.length
  };

  const distCounts = {};
  MASTER_DATA.districts.forEach(d => { distCounts[d.id] = 0; });
  dossiers.forEach(d => {
    if (d.history) {
      const uniqueDists = new Set(d.history.map(h => h.district).filter(Boolean));
      uniqueDists.forEach(dist => {
        if (distCounts[dist] !== undefined) distCounts[dist]++;
      });
    }
  });
  stats.districtComparison = MASTER_DATA.districts.map(d => ({ name: d.name, count: distCounts[d.id] || 0 }));

  const cats = { 'Wanted': 0, 'Active': 0, 'In Jail': 0, 'Out on Bail': 0 };
  dossiers.forEach(d => { if (cats[d.status] !== undefined) cats[d.status]++; });
  stats.categoryBreakdown = Object.entries(cats).map(([name, value]) => ({ name, value }));

  return stats;
}

// Direct database login validation using Supabase client (for static hosting environments)
async function dbLogin(username, password) {
  if (!_useSupabase || !_sb) {
    const localUser = _usersCache.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!localUser) {
      return { success: false, message: 'Invalid username. User not found (offline).' };
    }
    const expectedPassword = localUser.password || 'up@1234';
    if (password !== expectedPassword) {
      return { success: false, message: 'Invalid password.' };
    }
    let levelNum = localUser.level;
    if (typeof levelNum === 'string') {
      levelNum = parseInt(levelNum.replace('L', ''), 10);
    }
    const userCopy = {
      ...localUser,
      level: levelNum
    };
    return { success: true, user: userCopy };
  }
  try {
    const { data, error } = await _sb
      .from('cdims_users')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !data) {
      return { success: false, message: 'Invalid username. User not found.' };
    }

    if (data.password !== password) {
      return { success: false, message: 'Invalid password.' };
    }

    const { password: _, ...userWithoutPassword } = data;
    return { success: true, user: userWithoutPassword };
  } catch (err) {
    console.error('Login query failed:', err.message);
    return { success: false, message: 'Query error: ' + err.message };
  }
}

function syncVillagesFromDossiers() {
  const dossiers = _cache;
  const dynamicVillages = {};

  // Initialize with empty arrays for all known stations so they are at least present
  if (MASTER_DATA && MASTER_DATA.districts) {
    MASTER_DATA.districts.forEach(dist => {
      dist.circles.forEach(circle => {
        circle.stations.forEach(station => {
          dynamicVillages[station] = new Set();
        });
      });
    });
  }

  // Populate from dossiers
  dossiers.forEach(d => {
    if (!d || !d.personalInfo) return;
    const village = d.personalInfo.village;
    if (!village) return;

    // Find all stations this dossier belongs to
    const stations = new Set();
    if (d.submittedBy) {
      const match = d.submittedBy.match(/SHO\s+([A-Za-z0-9\-\s]+)/i);
      if (match) {
        stations.add(match[1].trim());
      } else {
        // Fallback: check if any known station name is in submittedBy
        const subLower = d.submittedBy.toLowerCase();
        Object.keys(dynamicVillages).forEach(st => {
          if (subLower.includes(st.toLowerCase())) {
            stations.add(st);
          }
        });
      }
    }
    if (d.history && Array.isArray(d.history)) {
      d.history.forEach(h => {
        if (h.policeStation) {
          stations.add(h.policeStation.trim());
        }
      });
    }

    stations.forEach(stationName => {
      const matchedKey = Object.keys(dynamicVillages).find(
        k => k.toLowerCase() === stationName.toLowerCase()
      );
      if (matchedKey) {
        dynamicVillages[matchedKey].add(village);
      } else {
        if (!dynamicVillages[stationName]) {
          dynamicVillages[stationName] = new Set();
        }
        dynamicVillages[stationName].add(village);
      }
    });
  });

  // Convert Sets to Arrays and store back in window.VILLAGES_BY_STATION
  const finalVillages = {};
  Object.keys(dynamicVillages).forEach(station => {
    finalVillages[station] = Array.from(dynamicVillages[station]);
  });

  window.VILLAGES_BY_STATION = finalVillages;
  console.info("[CDIMS] Dynamic villages synced from database dossiers:", window.VILLAGES_BY_STATION);
}

async function syncWithBackend(user) {
  if (!user) return false;
  console.log("🔄 Synchronizing local state with backend according to role...");
  try {
    const isGitHubPages = window.location.hostname.endsWith('github.io');
    if (isGitHubPages || (_useSupabase && _sb)) {
      if (_useSupabase && _sb) {
        const { data, error } = await _sb.from('cdims_dossiers').select('*');
        if (error) throw error;
        if (data) {
          _cache = data.map(_supabaseRowToDossier);
        }
      }
      // Direct Supabase/offline mode: filter in-memory based on user role
      if (user.level === 3) {
        // Keep all
      } else if (user.level === 2) {
        _cache = _cache.filter(d => d.history && d.history.some(h => h.district === user.district));
      } else if (user.level === 1) {
        const stationKey = user.station ? user.station.split(' PS')[0].trim().toLowerCase() : '';
        _cache = _cache.filter(d => {
          return (d.history && d.history.some(h => h.policeStation && h.policeStation.toLowerCase() === stationKey)) ||
            (d.submittedBy && d.submittedBy.toLowerCase().includes(stationKey));
        });
      }
      localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
      syncVillagesFromDossiers();
      console.log(`✅ Cached dossiers synchronized: ${_cache.length}`);
      return true;
    } else {
      // Local server mode: fetch from Express API which implements database role filtering
      const isLocalhost5001 = window.location.port === '5001';
      const apiBase = isLocalhost5001 ? '' : 'http://localhost:5001';
      const dossiersUrl = `${apiBase}/api/dossiers?district=${user.district || 'all'}&level=${user.level || 3}&station=${encodeURIComponent(user.station || '')}`;
      const res = await fetch(dossiersUrl);
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.dossiers) {
          _cache = resData.dossiers;
          localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
          syncVillagesFromDossiers();
          console.log(`✅ Cached dossiers synced from server API: ${_cache.length}`);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn("⚠️ syncWithBackend failed:", e.message);
  }
  return false;
}

async function syncDatabase() {
  if (window.currentUser) {
    await syncWithBackend(window.currentUser);
  } else if (_useSupabase && _sb) {
    try {
      console.info('[CDIMS Backend] Re-fetching dossiers from Supabase...');
      const { data, error } = await _sb.from('cdims_dossiers').select('*');
      if (error) throw error;
      if (data) {
        _cache = data.map(_supabaseRowToDossier);
        localStorage.setItem('cdims_dossiers', JSON.stringify(_cache));
        syncVillagesFromDossiers();
        console.info(`[CDIMS Backend] ✓ Re-synced ${_cache.length} records from Supabase.`);
      }
    } catch (e) {
      console.error('[CDIMS Backend] Exception during Supabase re-fetch:', e.message);
    }
  }
}

// ══════════════════════════════════════════════════════════
//  WINDOW EXPORTS — identical API surface as old dossiers.js
// ══════════════════════════════════════════════════════════
window.dbLogin = dbLogin;
window.MASTER_DATA = MASTER_DATA;
window.INITIAL_DOSSIERS = INITIAL_DOSSIERS;
window.VILLAGES_BY_STATION = VILLAGES_BY_STATION;
window.syncVillagesFromDossiers = syncVillagesFromDossiers;
window.syncDatabase = syncDatabase;
window.syncWithBackend = syncWithBackend;
window.CDIMS_DB_VERSION = CDIMS_DB_VERSION;

window.initDatabase = initDatabase;
window.getDossiers = getDossiers;
window.saveDossiers = saveDossiers;
window.addDossier = addDossier;
window.updateDossier = updateDossier;
window.approveDossier = approveDossier;
window.verifyDossier = verifyDossier;
window.returnDossierForCorrection = returnDossierForCorrection;
window.searchDossiers = searchDossiers;
window.getAuditLogs = getAuditLogs;
window.addAuditLog = addAuditLog;
window.calculateRiskScore = calculateRiskScore;
window.runCrimePatternAnalysis = runCrimePatternAnalysis;
window.generateStatistics = generateStatistics;
window.importDossiersFromCSVContent = importDossiersFromCSVContent;
window.getDossierPhotos = getDossierPhotos;
window.dbAddUser = dbAddUser;
window.getSystemUsers = getSystemUsers;
window._useSupabase = _useSupabase;

async function getDossierPhotos(dossierId) {
  const isGitHubPages = window.location.hostname.endsWith('github.io');
  if (isGitHubPages) {
    if (_useSupabase && _sb) {
      try {
        const { data, error } = await _sb
          .from('cdims_dossier_photos')
          .select('photo_url')
          .eq('dossier_id', dossierId);
        if (error) throw error;
        return (data || []).map(p => p.photo_url);
      } catch (e) {
        console.error('[CDIMS] getDossierPhotos Supabase error:', e.message);
        return _getLocalPhotos(dossierId);
      }
    } else {
      return _getLocalPhotos(dossierId);
    }
  } else {
    try {
      const isLocalhost5001 = window.location.port === '5001';
      const apiBase = isLocalhost5001 ? '' : 'http://localhost:5001';
      const res = await fetch(`${apiBase}/api/dossier-photos/${dossierId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.photos) {
          return data.photos;
        }
      }
      return _getLocalPhotos(dossierId);
    } catch (err) {
      console.error('Error fetching photos from server:', err);
      return _getLocalPhotos(dossierId);
    }
  }
}

function _getLocalPhotos(dossierId) {
  const stored = localStorage.getItem('cdims_dossier_photos');
  const photos = stored ? JSON.parse(stored) : [];
  return photos.filter(p => p.dossierId === dossierId).map(p => p.photoUrl);
}

// ──────────────────────────────────────────────────────────
//  Auto-start loading data immediately on page load
//  so data is ready by the time user clicks Login
// ──────────────────────────────────────────────────────────
initDatabase().catch(err => console.error('[CDIMS Backend] Init failed:', err));
