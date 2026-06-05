// Master Data hierarchy and Seed Criminal Dossiers database for CDIMS
// Stores data in localStorage for persistence.

const MASTER_DATA = {
  state: "Uttar Pradesh",
  districts: [
    {
      id: "lucknow",
      name: "Lucknow (लखनऊ)",
      isCommissionerate: true,
      circles: [
        { id: "hazratganj_circle", name: "Hazratganj Circle", stations: ["Hazratganj", "Gautampalli", "Hussainganj"] },
        { id: "chowk_circle", name: "Chowk Circle", stations: ["Chowk", "Wazirganj", "Thakurganj"] }
      ]
    },
    {
      id: "varanasi",
      name: "Varanasi (वाराणसी)",
      isCommissionerate: true,
      circles: [
        { id: "dashashwamedh_circle", name: "Dashashwamedh Circle", stations: ["Dashashwamedh", "Lanka", "Bhelupur"] },
        { id: "cantt_circle", name: "Cantt Circle", stations: ["Cantt", "Shivpur"] }
      ]
    },
    {
      id: "prayagraj",
      name: "Prayagraj (प्रयागराज)",
      isCommissionerate: false,
      circles: [
        { id: "civil_lines_circle", name: "Civil Lines Circle", stations: ["Civil Lines", "Cantonment"] },
        { id: "georgetown_circle", name: "Georgetown Circle", stations: ["Georgetown", "Shivkuti"] }
      ]
    },
    {
      id: "noida",
      name: "Gautam Buddha Nagar (नोएडा)",
      isCommissionerate: true,
      circles: [
        { id: "noida_1", name: "Noida Zone 1", stations: ["Sector-20", "Sector-39", "Sector-58"] },
        { id: "noida_2", name: "Noida Zone 2", stations: ["Phase-2", "Phase-3"] }
      ]
    }
  ],
  totals: {
    districts: 75,
    commissionerates: 7,
    policeStations: 1526,
    outposts: 4210
  }
};

const VILLAGES_BY_STATION = {
  // Lucknow
  "Hazratganj": ["Madanpur", "Sikandarpur", "Rampur", "Gomtipur"],
  "Gautampalli": ["Pipraghat", "Jiamau", "Ujariyaon"],
  "Hussainganj": ["Hussainganj Dehat", "Charbagh Village"],
  "Chowk": ["Malihabad Village", "Kakori Village", "Hardoi Road Basti"],
  "Wazirganj": ["Riverbank Colony Dehat", "Ghasyari Mandi Basti"],
  "Thakurganj": ["Sarfarazganj", "Campbell Road Village"],
  // Varanasi
  "Dashashwamedh": ["Ghat Dehat", "Bengali Tola"],
  "Lanka": ["Shivpur Village", "Sunderpur", "Bhagwanpur"],
  "Bhelupur": ["Khojwan", "Kamachha"],
  "Cantt": ["Varanasi Cantt Dehat", "Nadesar"],
  "Shivpur": ["Harahua", "Phoolpur Village"],
  // Prayagraj
  "Civil Lines": ["Cantonment Dehat", "Civil Lines Village"],
  "Cantonment": ["Rajapur", "Muirabad"],
  "Georgetown": ["Allapur Village", "Tagore Town Basti"],
  "Shivkuti": ["Handia Village", "Phaphamau Dehat", "Soraon Dehat"],
  // Noida
  "Sector-20": ["Bisrakh", "Nithari", "Chhalera"],
  "Sector-39": ["Sadarpur", "Raipur", "Khajoorpur"],
  "Sector-58": ["Bishanpura", "Noida Sector-58 Village"],
  "Phase-2": ["Gheja", "Noida Phase 2 Basti"],
  "Phase-3": ["Mamura", "Garhi Chaukhandi"]
};

const INITIAL_DOSSIERS = [
  {
    id: "CRM-2026-0001",
    personalInfo: {
      name: "Rajesh Yadav",
      aliasName: "Raju Kaana (राजू काणा)",
      nickname: "Kaana",
      fatherName: "Ramswaroop Yadav",
      motherName: "Savitri Devi",
      gender: "Male",
      dob: "1984-08-15",
      age: 41,
      mobile: "9876543210",
      aadhaar: "XXXX-XXXX-8923",
      address: "House No 42, Mohalla Chowk, Lucknow, UP",
      permanentAddress: "Village Bhadarsa, District Ayodhya, UP",
      photograph: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
      village: "Madanpur"
    },
    biometrics: {
      fingerprints: "FP-8923-SECURED",
      faceImage: "FACE-RECOGNIZED-99.2%",
      identificationMarks: "Deep scar on left cheek, missing upper left premolar tooth",
      height: "178 cm",
      weight: "82 kg",
      eyeColor: "Dark Brown",
      bloodGroup: "B+"
    },
    history: [
      {
        firNumber: "FIR-324/2024",
        crimeNumber: "CR-412/2024",
        policeStation: "Hazratganj",
        district: "lucknow",
        sections: "IPC 302, 307, 120B (Murder, Attempt to Murder, Criminal Conspiracy)",
        chargeSheetStatus: "Filed (CS-112/2024)",
        convictionDetails: "Under Trial",
        bailStatus: "Rejected (High Court)",
        courtCaseDetails: "Session Case No 412/2024, Lucknow Bench"
      },
      {
        firNumber: "FIR-12/2025",
        crimeNumber: "CR-18/2025",
        policeStation: "Sector-20",
        district: "noida",
        sections: "UP Gangsters Act, Sec 3(1)",
        chargeSheetStatus: "Under Investigation",
        convictionDetails: "Absconding",
        bailStatus: "Wanted",
        courtCaseDetails: "Non-Bailable Warrant Issued"
      }
    ],
    gangInfo: {
      gangName: "Raju Kaana Gang (D-102)",
      gangLeader: "Rajesh Yadav (Self)",
      gangMembers: ["Amit Mishra", "Vikram Singh", "Sanjay Pal"],
      areaOfOperation: "Lucknow, Ayodhya, Noida, Varanasi",
      networkMapping: [
        { targetId: "CRM-2026-0002", relation: "Lieutenant / Strategist" },
        { targetId: "CRM-2026-0003", relation: "Hitman / Shooter" }
      ]
    },
    surveillance: {
      historySheetNumber: "HS-42A/Hazratganj",
      surveillanceCategory: "Category A (Hardened Gangster)",
      surveillanceNotes: "Extremely active. Focuses on land grabbing, contract extortion and illegal sand mining. Frequently changes safehouses.",
      beatOfficerRemarks: "Not spotted in the local beat area for 3 weeks. Informers claim he is active in Noida border.",
      intelligenceInputs: "Intelligence source indicates planning of real estate extortion in Gomti Nagar."
    },
    propertyDetails: [
      { type: "House", address: "Gomti Nagar Phase 2, Lucknow", estimatedValue: "₹2.5 Crore", status: "Seized under Sec 14(1) Gangsters Act" },
      { type: "Agricultural Land", address: "Village Bhadarsa, Ayodhya (4.2 Hectares)", estimatedValue: "₹1.8 Crore", status: "Attached" },
      { type: "Bank Account", bankName: "State Bank of India, Hazratganj", accountNumber: "XXXXXX7842", estimatedValue: "₹45 Lakhs", status: "Frozen" }
    ],
    vehicleDetails: [
      { vehicleNumber: "UP-32-EX-4122", vehicleType: "SUV (Fortuner - White)", registrationDetails: "Registered under spouse Savitri Devi" },
      { vehicleNumber: "UP-42-AA-9999", vehicleType: "SUV (Scorpio - Black)", registrationDetails: "Registered under frontman Sanjay Pal" }
    ],
    status: "Wanted", // Wanted, Active, In Jail, Out on Bail, Deceased
    approvalStatus: "Approved", // Approved, Pending Verification, Returned for Correction
    submittedBy: "SHO Hazratganj",
    verifiedBy: "CO Hazratganj Office",
    approvedBy: "SP Crime Lucknow",
    lastUpdated: "2026-05-28T14:32:00Z"
  },
  {
    id: "CRM-2026-0002",
    personalInfo: {
      name: "Amit Mishra",
      aliasName: "Panditji (पंडितजी)",
      nickname: "Pandit",
      fatherName: "Dinesh Chandra Mishra",
      motherName: "Kamla Mishra",
      gender: "Male",
      dob: "1988-11-04",
      age: 37,
      mobile: "9415123456",
      aadhaar: "XXXX-XXXX-4102",
      address: "Sector 4, Aliganj, Lucknow, UP",
      permanentAddress: "Gola Gokaran Nath, Lakhimpur Kheri, UP",
      photograph: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
      village: "Madanpur"
    },
    biometrics: {
      fingerprints: "FP-4102-SECURED",
      faceImage: "FACE-RECOGNIZED-95.8%",
      identificationMarks: "Mole on the right collarbone, surgical scar on left knee",
      height: "172 cm",
      weight: "74 kg",
      eyeColor: "Black",
      bloodGroup: "O+"
    },
    history: [
      {
        firNumber: "FIR-105/2023",
        crimeNumber: "CR-112/2023",
        policeStation: "Hazratganj",
        district: "lucknow",
        sections: "IPC 420, 467, 468, 471, 120B (Forgery, Cheating, Using Forged Documents)",
        chargeSheetStatus: "Filed (CS-80/2023)",
        convictionDetails: "Under Trial",
        bailStatus: "Out on Bail (Granted by Dist Court Lucknow)",
        courtCaseDetails: "ACJM-III Case No 1823/2023"
      }
    ],
    gangInfo: {
      gangName: "Raju Kaana Gang (D-102)",
      gangLeader: "Rajesh Yadav",
      gangMembers: ["Rajesh Yadav", "Vikram Singh"],
      areaOfOperation: "Lucknow, Lakhimpur",
      networkMapping: [
        { targetId: "CRM-2026-0001", relation: "Advisor / Financier" }
      ]
    },
    surveillance: {
      historySheetNumber: "HS-89B/Hazratganj",
      surveillanceCategory: "Category B (Active Associate)",
      surveillanceNotes: "Handles financial bookkeeping, shell companies, and legal affairs for the Raju Kaana Gang. Operates through front businesses.",
      beatOfficerRemarks: "Reporting weekly at the station as per bail conditions. Under active surveillance.",
      intelligenceInputs: "Recently met with suspect contractors at a hotel in Hazratganj."
    },
    propertyDetails: [
      { type: "Shop", address: "Kapoorthala Crossing, Aliganj, Lucknow", estimatedValue: "₹85 Lakhs", status: "Active (Under Surveillance)" },
      { type: "Bank Account", bankName: "HDFC Bank, Aliganj", accountNumber: "XXXXXX2012", estimatedValue: "₹18 Lakhs", status: "Active" }
    ],
    vehicleDetails: [
      { vehicleNumber: "UP-32-KB-0051", vehicleType: "Sedan (Ciaz - Grey)", registrationDetails: "Self registered" }
    ],
    status: "Out on Bail",
    approvalStatus: "Approved",
    submittedBy: "SHO Hazratganj",
    verifiedBy: "CO Hazratganj Office",
    approvedBy: "SP Crime Lucknow",
    lastUpdated: "2026-05-29T11:20:00Z"
  },
  {
    id: "CRM-2026-0003",
    personalInfo: {
      name: "Vikram Singh",
      aliasName: "Vicky Shooter (विक्की शूटर)",
      nickname: "Vicky",
      fatherName: "Karan Bahadur Singh",
      motherName: "Pushpa Singh",
      gender: "Male",
      dob: "1995-03-22",
      age: 31,
      mobile: "9199887766",
      aadhaar: "XXXX-XXXX-1150",
      address: "Village Shivpur, Varanasi, UP",
      permanentAddress: "Village Shivpur, Varanasi, UP",
      photograph: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300",
      village: "Shivpur Village"
    },
    biometrics: {
      fingerprints: "FP-1150-SECURED",
      faceImage: "FACE-RECOGNIZED-92.4%",
      identificationMarks: "Tattoo of Lord Shiva on right forearm",
      height: "182 cm",
      weight: "78 kg",
      eyeColor: "Light Brown",
      bloodGroup: "A+"
    },
    history: [
      {
        firNumber: "FIR-88/2025",
        crimeNumber: "CR-95/2025",
        policeStation: "Lanka",
        district: "varanasi",
        sections: "IPC 307, 34, Arms Act Sec 25/27 (Attempt to Murder, Common Intention)",
        chargeSheetStatus: "Under Investigation",
        convictionDetails: "Absconding",
        bailStatus: "Wanted",
        courtCaseDetails: "Case registered, arrest warrants active"
      },
      {
        firNumber: "FIR-402/2024",
        crimeNumber: "CR-480/2024",
        policeStation: "Hazratganj",
        district: "lucknow",
        sections: "IPC 384, 506 (Extortion, Criminal Intimidation)",
        chargeSheetStatus: "Filed",
        convictionDetails: "Under Trial",
        bailStatus: "Wanted",
        courtCaseDetails: "Arrest warrant active"
      }
    ],
    gangInfo: {
      gangName: "Raju Kaana Gang (D-102)",
      gangLeader: "Rajesh Yadav",
      gangMembers: ["Rajesh Yadav", "Amit Mishra"],
      areaOfOperation: "Varanasi, Lucknow, Prayagraj",
      networkMapping: [
        { targetId: "CRM-2026-0001", relation: "Enforcer / Shooter" }
      ]
    },
    surveillance: {
      historySheetNumber: "HS-15C/Lanka",
      surveillanceCategory: "Category A (Wanted Shooter)",
      surveillanceNotes: "Extremely dangerous, handles weapon procurement and executes contract hits for Rajesh Yadav. Highly mobile, avoids digital footprints.",
      beatOfficerRemarks: "Informers report he was seen in Varanasi Cantt railway station area 5 days ago.",
      intelligenceInputs: "Suspected to be using a virtual VoIP number to contact associates."
    },
    propertyDetails: [
      { type: "House", address: "Shivpur, Varanasi", estimatedValue: "₹45 Lakhs", status: "Under attachment process" }
    ],
    vehicleDetails: [
      { vehicleNumber: "UP-65-XY-8821", vehicleType: "Motorcycle (Pulsar - Black)", registrationDetails: "Registered under cousin name" }
    ],
    status: "Wanted",
    approvalStatus: "Approved",
    submittedBy: "SHO Lanka",
    verifiedBy: "CO Dashashwamedh Office",
    approvedBy: "SSP Varanasi Office",
    lastUpdated: "2026-05-25T09:15:00Z"
  },
  {
    id: "CRM-2026-0004",
    personalInfo: {
      name: "Satish Gujjar",
      aliasName: "Fauji (फौजी)",
      nickname: "Subedar",
      fatherName: "Dharampal Gujjar",
      motherName: "Bimla Devi",
      gender: "Male",
      dob: "1978-05-12",
      age: 48,
      mobile: "9675210041",
      aadhaar: "XXXX-XXXX-9934",
      address: "Village Bisrakh, Greater Noida, UP",
      permanentAddress: "Village Bisrakh, Greater Noida, UP",
      photograph: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
      village: "Bisrakh"
    },
    biometrics: {
      fingerprints: "FP-9934-SECURED",
      faceImage: "FACE-RECOGNIZED-90.1%",
      identificationMarks: "Gunshot wound mark on right shoulder",
      height: "185 cm",
      weight: "90 kg",
      eyeColor: "Dark Brown",
      bloodGroup: "AB+"
    },
    history: [
      {
        firNumber: "FIR-412/2023",
        crimeNumber: "CR-430/2023",
        policeStation: "Sector-39",
        district: "noida",
        sections: "IPC 392, 395 (Robbery, Dacoity)",
        chargeSheetStatus: "Filed",
        convictionDetails: "Acquitted due to hostile witnesses",
        bailStatus: "Discharged",
        courtCaseDetails: "Noida District Court Case 430/2023"
      },
      {
        firNumber: "FIR-22/2026",
        crimeNumber: "CR-25/2026",
        policeStation: "Sector-20",
        district: "noida",
        sections: "UP Gangsters Act & Arms Act Sec 25",
        chargeSheetStatus: "Under Investigation",
        convictionDetails: "Under Trial",
        bailStatus: "In Jail (District Jail Luksar)",
        courtCaseDetails: "Special Gangsters Court, Noida"
      }
    ],
    gangInfo: {
      gangName: "Gujjar Syndicate (G-110)",
      gangLeader: "Satish Gujjar (Self)",
      gangMembers: ["Rakesh Patel"],
      areaOfOperation: "Noida, Greater Noida, Ghaziabad",
      networkMapping: [
        { targetId: "CRM-2026-0005", relation: "Associate / Arms Supplier" }
      ]
    },
    surveillance: {
      historySheetNumber: "HS-99A/Sector-20",
      surveillanceCategory: "Category A (Gang Leader)",
      surveillanceNotes: "Ex-army personnel discharged after court-martial. Leads extortion rings targeting construction contractors and builders in Noida/Greater Noida.",
      beatOfficerRemarks: "Currently incarcerated in Luksar Jail. Prison behavior monitored.",
      intelligenceInputs: "Continues to direct operations from jail through visiting relatives."
    },
    propertyDetails: [
      { type: "House", address: "Bisrakh, Greater Noida", estimatedValue: "₹1.2 Crore", status: "Active" },
      { type: "Commercial Plot", address: "Sector 142, Noida", estimatedValue: "₹3.5 Crore", status: "Frozen by District Magistrate order" }
    ],
    vehicleDetails: [
      { vehicleNumber: "DL-3C-CC-1122", vehicleType: "SUV (Endeavour - White)", registrationDetails: "Self registered" }
    ],
    status: "In Jail",
    approvalStatus: "Approved",
    submittedBy: "SHO Sector-20",
    verifiedBy: "CO Noida Zone 1",
    approvedBy: "DCP Crime Noida",
    lastUpdated: "2026-05-20T16:45:00Z"
  },
  {
    id: "CRM-2026-0005",
    personalInfo: {
      name: "Rakesh Patel",
      aliasName: "Patelji (पटेलजी)",
      nickname: "Raka",
      fatherName: "Shanti Swaroop Patel",
      motherName: "Ganga Devi",
      gender: "Male",
      dob: "1990-07-29",
      age: 35,
      mobile: "9450011223",
      aadhaar: "XXXX-XXXX-5521",
      address: "Katra, Prayagraj, UP",
      permanentAddress: "Handia, District Prayagraj, UP",
      photograph: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300",
      village: "Handia Village"
    },
    biometrics: {
      fingerprints: "FP-5521-SECURED",
      faceImage: "FACE-RECOGNIZED-94.0%",
      identificationMarks: "Stitch mark near left eyebrow",
      height: "170 cm",
      weight: "68 kg",
      eyeColor: "Black",
      bloodGroup: "O-"
    },
    history: [
      {
        firNumber: "FIR-192/2025",
        crimeNumber: "CR-210/2025",
        policeStation: "Shivkuti",
        district: "prayagraj",
        sections: "Arms Act Sec 25/30, IPC 386 (Extortion by putting in fear of death)",
        chargeSheetStatus: "Filed",
        convictionDetails: "Under Trial",
        bailStatus: "Out on Bail (District Court Prayagraj)",
        courtCaseDetails: "Sessions Court Prayagraj Case 910/2025"
      }
    ],
    gangInfo: {
      gangName: "Independent / Gujjar Associate",
      gangLeader: "None",
      gangMembers: [],
      areaOfOperation: "Prayagraj, Noida",
      networkMapping: [
        { targetId: "CRM-2026-0004", relation: "Supplier / Accomplice" }
      ]
    },
    surveillance: {
      historySheetNumber: "HS-212B/Shivkuti",
      surveillanceCategory: "Category B (Active Criminal)",
      surveillanceNotes: "Involved in illegal weapon supply network. Coordinates with Western UP gangs to supply country-made pistols (katta) and ammunition.",
      beatOfficerRemarks: "Reporting fortnightly. Local movements monitored closely.",
      intelligenceInputs: "Suspected connection with small workshops in Handia manufacturing illegal ordnance."
    },
    propertyDetails: [
      { type: "House", address: "Handia, Prayagraj", estimatedValue: "₹35 Lakhs", status: "Active" }
    ],
    vehicleDetails: [
      { vehicleNumber: "UP-70-DF-4412", vehicleType: "SUV (Bolero - White)", registrationDetails: "Registered in father's name" }
    ],
    status: "Out on Bail",
    approvalStatus: "Approved",
    submittedBy: "SHO Shivkuti",
    verifiedBy: "CO Georgetown Circle",
    approvedBy: "SSP Prayagraj Office",
    lastUpdated: "2026-05-24T18:10:00Z"
  },
  {
    id: "CRM-2026-0006",
    personalInfo: {
      name: "Sanjay Pal",
      aliasName: "Sanjeev (संजीव)",
      nickname: "Palu",
      fatherName: "Rameshwar Pal",
      motherName: "Kusum Devi",
      gender: "Male",
      dob: "1992-02-14",
      age: 34,
      mobile: "9451122334",
      aadhaar: "XXXX-XXXX-6671",
      address: "12/45, Chowk, Lucknow, UP",
      permanentAddress: "Village Malihabad, Lucknow, UP",
      photograph: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300",
      village: "Malihabad Village"
    },
    biometrics: {
      fingerprints: "FP-6671-SECURED",
      faceImage: "FACE-RECOGNIZED-91.2%",
      identificationMarks: "Burn mark on right calf",
      height: "174 cm",
      weight: "72 kg",
      eyeColor: "Brown",
      bloodGroup: "A-"
    },
    history: [
      {
        firNumber: "FIR-15/2026",
        crimeNumber: "CR-20/2026",
        policeStation: "Chowk",
        district: "lucknow",
        sections: "IPC 379, 411 (Theft, Receiving Stolen Property)",
        chargeSheetStatus: "Under Investigation",
        convictionDetails: "None",
        bailStatus: "Pending",
        courtCaseDetails: "Awaiting Charge Sheet"
      }
    ],
    gangInfo: {
      gangName: "Raju Kaana Gang (D-102)",
      gangLeader: "Rajesh Yadav",
      gangMembers: ["Rajesh Yadav", "Amit Mishra", "Vikram Singh"],
      areaOfOperation: "Lucknow (Chowk, Malihabad)",
      networkMapping: [
        { targetId: "CRM-2026-0001", relation: "Frontman / Vehicle Custodian" }
      ]
    },
    surveillance: {
      historySheetNumber: "HS-19C/Chowk",
      surveillanceCategory: "Category C (Petty Gang Associate)",
      surveillanceNotes: "Acts as driver and frontman for properties/vehicles owned by Rajesh Yadav. Low threat level but high intelligence value.",
      beatOfficerRemarks: "Frequently spotted near Chowk market. Cooperates under interrogation.",
      intelligenceInputs: "Disclosed vehicle storage locations under pressure."
    },
    propertyDetails: [
      { type: "Bank Account", bankName: "Punjab National Bank, Chowk", accountNumber: "XXXXXX5120", estimatedValue: "₹4 Lakhs", status: "Active" }
    ],
    vehicleDetails: [
      { vehicleNumber: "UP-32-ZZ-1200", vehicleType: "Hatchback (Swift - White)", registrationDetails: "Self registered" }
    ],
    status: "Active",
    approvalStatus: "Pending Verification", // Test state for District Nodal review!
    submittedBy: "SHO Chowk",
    verifiedBy: "Awaiting Verification",
    approvedBy: "Awaiting Approval",
    lastUpdated: "2026-05-30T10:15:00Z"
  }
];

// ── Schema versioning: bump this when seed data shape changes ──
const CDIMS_DB_VERSION = "v2-village";

// Initialize database in localStorage
function initDatabase() {
  // If the stored schema version doesn't match, wipe and re-seed
  const storedVersion = localStorage.getItem("cdims_db_version");
  if (storedVersion !== CDIMS_DB_VERSION) {
    localStorage.removeItem("cdims_dossiers");
    localStorage.removeItem("cdims_audit_logs");
    localStorage.setItem("cdims_db_version", CDIMS_DB_VERSION);
  }

  if (!localStorage.getItem("cdims_dossiers")) {
    localStorage.setItem("cdims_dossiers", JSON.stringify(INITIAL_DOSSIERS));
  }
  if (!localStorage.getItem("cdims_audit_logs")) {
    const initialLogs = [
      { timestamp: "2026-05-30T09:12:00Z", username: "sho_hazratganj", role: "Police Station User", action: "Search", details: "Searched dossiers by alias 'Kaana'" },
      { timestamp: "2026-05-30T10:15:00Z", username: "sho_chowk", role: "Police Station User", action: "Create Dossier", details: "Created pending dossier CRM-2026-0006 for Sanjay Pal" },
      { timestamp: "2026-05-30T11:20:00Z", username: "sp_crime_lucknow", role: "District Nodal Officer", action: "Approve Dossier", details: "Approved dossier CRM-2026-0002 for Amit Mishra" },
      { timestamp: "2026-05-30T14:45:00Z", username: "phq_admin", role: "State Administrator", action: "Export Data", details: "Exported statewide wanted criminal list to PDF" }
    ];
    localStorage.setItem("cdims_audit_logs", JSON.stringify(initialLogs));
  }
}

// Retrieve all dossiers
function getDossiers() {
  initDatabase();
  return JSON.parse(localStorage.getItem("cdims_dossiers"));
}

// Save all dossiers
function saveDossiers(dossiers) {
  localStorage.setItem("cdims_dossiers", JSON.stringify(dossiers));
}

// Add a new dossier
function addDossier(dossier, user) {
  const dossiers = getDossiers();
  
  // Auto generate ID
  const nextNum = dossiers.length + 1;
  const idStr = String(nextNum).padStart(4, "0");
  dossier.id = `CRM-2026-${idStr}`;
  dossier.approvalStatus = "Pending Verification"; // New entries always start pending
  dossier.submittedBy = user.name || "SHO User";
  dossier.lastUpdated = new Date().toISOString();
  
  dossiers.push(dossier);
  saveDossiers(dossiers);
  
  addAuditLog(user.username, user.role, "Create Dossier", `Created dossier ${dossier.id} (${dossier.personalInfo.name})`);
  return dossier;
}

// Update an existing dossier
function updateDossier(dossier, user) {
  const dossiers = getDossiers();
  const index = dossiers.findIndex(d => d.id === dossier.id);
  if (index !== -1) {
    dossier.lastUpdated = new Date().toISOString();
    dossiers[index] = dossier;
    saveDossiers(dossiers);
    addAuditLog(user.username, user.role, "Update Dossier", `Updated dossier ${dossier.id} (${dossier.personalInfo.name})`);
    return true;
  }
  return false;
}

// Approve dossier (District Nodal function)
function approveDossier(id, user) {
  const dossiers = getDossiers();
  const index = dossiers.findIndex(d => d.id === id);
  if (index !== -1) {
    dossiers[index].approvalStatus = "Approved";
    dossiers[index].verifiedBy = user.name || "CO Authorized";
    dossiers[index].approvedBy = user.name || "SP Authorized";
    dossiers[index].lastUpdated = new Date().toISOString();
    saveDossiers(dossiers);
    addAuditLog(user.username, user.role, "Approve Dossier", `Approved dossier ${id}`);
    return true;
  }
  return false;
}

// Return dossier for correction (District Nodal function)
function returnDossierForCorrection(id, remarks, user) {
  const dossiers = getDossiers();
  const index = dossiers.findIndex(d => d.id === id);
  if (index !== -1) {
    dossiers[index].approvalStatus = "Returned for Correction";
    dossiers[index].surveillance.intelligenceInputs = `Correction needed: ${remarks}`;
    dossiers[index].lastUpdated = new Date().toISOString();
    saveDossiers(dossiers);
    addAuditLog(user.username, user.role, "Return Dossier", `Returned dossier ${id} for correction. Remarks: ${remarks}`);
    return true;
  }
  return false;
}

// Audit Logs
function getAuditLogs() {
  initDatabase();
  return JSON.parse(localStorage.getItem("cdims_audit_logs")) || [];
}

function addAuditLog(username, role, action, details) {
  const logs = getAuditLogs();
  logs.unshift({
    timestamp: new Date().toISOString(),
    username,
    role,
    action,
    details
  });
  // Cap logs at 100 entries
  if (logs.length > 100) logs.pop();
  localStorage.setItem("cdims_audit_logs", JSON.stringify(logs));
}

// Advanced search logic
function searchDossiers(filters) {
  const dossiers = getDossiers();
  return dossiers.filter(d => {
    // Basic filter overrides
    if (filters.district && filters.district !== "all" && d.history.every(h => h.district !== filters.district)) {
      return false;
    }
    
    if (filters.status && filters.status !== "all" && d.status !== filters.status) {
      return false;
    }

    if (filters.approvalStatus && filters.approvalStatus !== "all" && d.approvalStatus !== filters.approvalStatus) {
      return false;
    }

    // Text search query
    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      const matchName = d.personalInfo.name.toLowerCase().includes(q);
      const matchAlias = d.personalInfo.aliasName.toLowerCase().includes(q);
      const matchNick = d.personalInfo.nickname.toLowerCase().includes(q);
      const matchMobile = d.personalInfo.mobile.includes(q);
      const matchAadhaar = d.personalInfo.aadhaar.includes(q);
      const matchId = d.id.toLowerCase().includes(q);
      
      const matchVehicles = d.vehicleDetails.some(v => v.vehicleNumber.toLowerCase().includes(q) || v.vehicleType.toLowerCase().includes(q));
      const matchGang = d.gangInfo.gangName.toLowerCase().includes(q);
      
      const matchHistory = d.history.some(h => 
        h.firNumber.toLowerCase().includes(q) || 
        h.sections.toLowerCase().includes(q) || 
        h.policeStation.toLowerCase().includes(q)
      );

      if (!matchName && !matchAlias && !matchNick && !matchMobile && !matchAadhaar && !matchId && !matchVehicles && !matchGang && !matchHistory) {
        return false;
      }
    }
    
    return true;
  });
}

// AI Intelligence Module Algorithms
function calculateRiskScore(dossier) {
  // Score details:
  // 1. Absconding/Wanted status = +40
  // 2. High Category surveillance = +30
  // 3. Murder/Gangster laws = +20
  // 4. Number of FIRs: 1 = +5, 2+ = +15
  // 5. Active weapons supply/hitman = +10
  let score = 10;
  
  if (dossier.status === "Wanted") score += 40;
  if (dossier.status === "In Jail") score -= 15; // less risk of current movement
  
  if (dossier.surveillance.surveillanceCategory.includes("Category A")) score += 30;
  if (dossier.surveillance.surveillanceCategory.includes("Category B")) score += 15;
  
  const sectionsText = dossier.history.map(h => h.sections).join(" ");
  if (sectionsText.includes("302") || sectionsText.includes("Murder") || sectionsText.includes("Gangsters Act")) {
    score += 20;
  }
  
  score += Math.min(dossier.history.length * 10, 20);
  
  if (dossier.personalInfo.aliasName.includes("Shooter") || dossier.surveillance.surveillanceNotes.includes("weapons")) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

function runCrimePatternAnalysis(dossier) {
  // Mock AI generated report based on dossier history
  const sections = dossier.history.map(h => h.sections).join(" ");
  const areas = [dossier.personalInfo.address, ...dossier.history.map(h => h.policeStation)].join(", ");
  
  let pattern = "Pattern Analysis: ";
  let forecast = "Predictive Intelligence: ";
  let suggestions = "Action Items: ";
  
  if (sections.includes("302") || sections.includes("307")) {
    pattern += "High-risk offender with violent crime history involving physical threats. Relies heavily on armed gang support for intimidation and contract violence.";
    forecast += "Likely to participate in armed extortion or contract killings during local commercial tender allocations or real estate negotiations.";
    suggestions += "Coordinate with Beat Officers for proactive arms checks. Monitor weapon license holders connected as gang associates.";
  } else if (sections.includes("420") || sections.includes("467")) {
    pattern += "White collar fraud specialist targeting government registrations, real estate shell deeds, and financial channels of the criminal network.";
    forecast += "Probable attempts to establish new shell enterprises or proxy bank accounts using fictitious Aadhaar links.";
    suggestions += "Verify tax filings of suspected front stores. Request financial audits of relatives' bank records.";
  } else {
    pattern += "Petty operations or logistical facilitator helping transport assets, vehicles, and hideouts for higher-level operators.";
    forecast += "Vulnerable to recruitment for weapon or illegal asset transfers on behalf of wanted gang leaders.";
    suggestions += "Conduct regular checks on registered vehicles. Monitor meeting spots and local travel routes.";
  }
  
  return { pattern, forecast, suggestions };
}

// Generate reports mock stats
function generateStatistics() {
  const dossiers = getDossiers();
  
  const stats = {
    totalCriminals: dossiers.length,
    activeCriminals: dossiers.filter(d => d.status === "Active" || d.status === "Wanted").length,
    historySheeters: dossiers.filter(d => d.surveillance.historySheetNumber).length,
    gangsters: dossiers.filter(d => d.gangInfo.gangName && d.gangInfo.gangName !== "Independent / Gujjar Associate").length,
    wantedCriminals: dossiers.filter(d => d.status === "Wanted").length,
    districtCount: MASTER_DATA.districts.length,
    policeStationCount: MASTER_DATA.districts.reduce((acc, dist) => acc + dist.circles.reduce((acc2, circ) => acc2 + circ.stations.length, 0), 0)
  };
  
  // District comparisons
  const districtCounts = {};
  MASTER_DATA.districts.forEach(d => { districtCounts[d.id] = 0; });
  
  dossiers.forEach(d => {
    d.history.forEach(h => {
      if (districtCounts[h.district] !== undefined) {
        districtCounts[h.district]++;
      }
    });
  });
  
  stats.districtComparison = MASTER_DATA.districts.map(d => ({
    name: d.name,
    count: districtCounts[d.id] || 0
  }));
  
  // Category counts
  const catCounts = { Wanted: 0, Active: 0, "In Jail": 0, "Out on Bail": 0 };
  dossiers.forEach(d => {
    if (catCounts[d.status] !== undefined) {
      catCounts[d.status]++;
    }
  });
  stats.categoryBreakdown = Object.keys(catCounts).map(key => ({
    name: key,
    value: catCounts[key]
  }));
  
  return stats;
}

// Export functions to global window for SPA modules
window.MASTER_DATA = MASTER_DATA;
window.INITIAL_DOSSIERS = INITIAL_DOSSIERS;
window.VILLAGES_BY_STATION = VILLAGES_BY_STATION;
window.initDatabase = initDatabase;
window.getDossiers = getDossiers;
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
