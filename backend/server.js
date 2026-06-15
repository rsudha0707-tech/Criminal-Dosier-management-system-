// =========================================================
//  CDIMS — Backend Express Server
//  Connected to Supabase Database
//  Uttar Pradesh Police Headquarters
// =========================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve the dummy data CSV from backend/data/.csv if requested as dossiers.csv
app.get('/dossiers.csv', (req, res) => {
  const dataCsvPath = path.join(__dirname, 'data', '.csv');
  if (fs.existsSync(dataCsvPath)) {
    res.setHeader('Content-Type', 'text/csv');
    return res.sendFile(dataCsvPath);
  }
  res.sendFile(path.join(__dirname, '../frontend', 'dossiers.csv'));
});

// Serve static frontend files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Supabase & DB Client Configuration ──
let supabase = null;
let useLocalMock = true;
let pool = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const dbUrl = process.env.DATABASE_URL;

if (supabaseUrl && supabaseUrl !== 'https://immwobsoziqqftaoinup.supabase.co' && supabaseKey && supabaseKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbXdvYnNvemlxcWZ0YW9pbnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODQ0NzksImV4cCI6MjA5MzQ2MDQ3OX0.utM5jrzWVajZTmRXbVH3sqc-pMDvQGt-z7dzkrWFaSw') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    useLocalMock = false;
    console.log('📡 Connected to Supabase Client successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
  }
} else {
  console.log('⚠️ Supabase credentials missing or set to default. Operating in Local Mock Mode.');
}

if (dbUrl && dbUrl.startsWith('postgresql://')) {
  try {
    pool = new Pool({ connectionString: dbUrl });
    console.log('🐘 PostgreSQL Pool configured for raw SQL setup.');
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL pool:', error.message);
  }
}

// ── In-Memory Mock Database Fallbacks (for out-of-the-box local usage) ──
let mockDossiers = [];
let mockUsers = [
  { username: 'sho_hazratganj', password: 'up@1234', name: 'SHO Rajiv Sharma', role: 'Police Station User', level: 1, station: 'Hazratganj PS, Lucknow', district: 'lucknow', avatar: 'RS', permissions: ['create', 'update', 'upload', 'search'] },
  { username: 'co_lucknow', password: 'up@1234', name: 'CO Prashant Mishra', role: 'District Nodal Officer', level: 2, station: 'CO Office, Lucknow', district: 'lucknow', avatar: 'PM', permissions: ['view_all_district', 'verify', 'approve', 'return', 'reports', 'search'] },
  { username: 'phq_admin', password: 'up@1234', name: 'DG Intelligence (PHQ)', role: 'State Administrator', level: 3, station: 'PHQ — UP Police Headquarters', district: 'all', avatar: 'PH', permissions: ['all'] }
];
let mockAuditLogs = [
  { timestamp: new Date().toISOString(), username: 'sho_hazratganj', role: 'Police Station User', action: 'System Init', details: 'Initialized CDIMS system local fallback' }
];

// Helper functions to parse and map CSV dummy data in Node.js backend
function parseCSV(text) {
  if (!text) return [];
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

function mapCsvRowToDossier(row) {
  if (row.record_id || row.full_name) {
    const ps = row.police_station || 'Hazratganj';

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

    let propertyDetails = [];
    if (row.property_details) {
      propertyDetails = [{
        type: 'Asset',
        address: 'District ' + (row.district || 'Lucknow'),
        estimatedValue: 'N/A',
        status: row.property_details
      }];
    }

    let vehicleDetails = [];
    if (row.vehicle_details) {
      vehicleDetails = [{
        vehicleNumber: row.vehicle_details,
        vehicleType: 'Vehicle',
        registrationDetails: 'Registered'
      }];
    }

    const age = parseInt(row.age) || 30;
    const dob = new Date(new Date().getFullYear() - age, 0, 1).toISOString().split('T')[0];

    // Normalize district ID
    let distId = row.district ? row.district.toLowerCase().trim() : 'lucknow';
    if (distId.includes('gautam') || distId.includes('noida')) {
      distId = 'noida';
    }

    // Match village to first village of the station in master data
    let village = 'Dehat';
    const villagesMap = {
      'Hazratganj': 'Madanpur',
      'Phase-1': 'Sector-1 Basti',
      'Kavi Nagar': 'Kavi Nagar Village',
      'MG Road': 'MG Road Dehat',
      'Civil Lines': 'Cantonment Dehat',
      'Sector-20': 'Bisrakh',
      'Kotwali': 'Kotwali Basti',
      'Bhelupur': 'Khojwan'
    };
    if (villagesMap[ps]) {
      village = villagesMap[ps];
    }

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
        village: village
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

  // Parse native JSON fields for server API fallback
  let parsed = { ...row };
  try {
    parsed.history = row.history ? JSON.parse(row.history) : [];
  } catch (e) { parsed.history = []; }

  try {
    parsed.propertyDetails = row.propertyDetails ? JSON.parse(row.propertyDetails) : [];
  } catch (e) { parsed.propertyDetails = []; }

  try {
    parsed.vehicleDetails = row.vehicleDetails ? JSON.parse(row.vehicleDetails) : [];
  } catch (e) { parsed.vehicleDetails = []; }

  try {
    parsed.intelReports = row.intelReports ? JSON.parse(row.intelReports) : [];
  } catch (e) { parsed.intelReports = []; }

  let gangMembers = [];
  if (row.gangMembers) {
    gangMembers = row.gangMembers.split(';').map(m => m.trim()).filter(Boolean);
  }

  parsed.personalInfo = {
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
        const mainHistory = parsed.history && parsed.history[0] ? parsed.history[0] : {};
        const ps = mainHistory.policeStation || 'Hazratganj';
        const villagesMap = {
          'Hazratganj': 'Madanpur',
          'Gautampalli': 'Pipraghat',
          'Hussainganj': 'Hussainganj Dehat',
          'Chowk': 'Malihabad Village',
          'Wazirganj': 'Riverbank Colony Dehat',
          'Thakurganj': 'Sarfarazganj',
          'Civil Lines': 'Cantonment Dehat',
          'Cantonment': 'Rajapur',
          'Georgetown': 'Allapur Village',
          'Shivkuti': 'Handia Village',
          'Sector-20': 'Bisrakh',
          'Sector-39': 'Sadarpur',
          'Sector-58': 'Bishanpura',
          'Phase-2': 'Gheja',
          'Phase-3': 'Mamura',
          'Phase-1': 'Sector-1 Basti',
          'Kavi Nagar': 'Kavi Nagar Village',
          'MG Road': 'MG Road Dehat',
          'Kotwali': 'Kotwali Basti'
        };
        v = villagesMap[ps] || 'Madanpur';
      }
      return v;
    })()
  };

  parsed.biometrics = {
    fingerprints: row.fingerprints || '',
    faceImage: row.faceImage || '',
    identificationMarks: row.identificationMarks || '',
    height: row.height || '',
    weight: row.weight || '',
    eyeColor: row.eyeColor || '',
    bloodGroup: row.bloodGroup || ''
  };

  let networkMapping = [];
  try {
    if (row.networkMapping) {
      networkMapping = JSON.parse(row.networkMapping);
    }
  } catch (e) { }

  parsed.gangInfo = {
    gangName: row.gangName || '',
    gangLeader: row.gangLeader || '',
    gangMembers: gangMembers,
    areaOfOperation: row.areaOfOperation || '',
    networkMapping: networkMapping
  };

  parsed.surveillance = {
    historySheetNumber: row.historySheetNumber || '',
    surveillanceCategory: row.surveillanceCategory || '',
    surveillanceNotes: row.surveillanceNotes || '',
    beatOfficerRemarks: row.beatOfficerRemarks || '',
    intelligenceInputs: row.intelligenceInputs || ''
  };

  parsed.status = row.status || 'Active';
  parsed.approvalStatus = row.approvalStatus || 'Approved';
  parsed.submittedBy = row.submittedBy || 'SHO User';
  parsed.verifiedBy = row.verifiedBy || 'CO Office';
  parsed.approvedBy = row.approvedBy || 'SP Office';
  parsed.lastUpdated = row.lastUpdated || new Date().toISOString();

  return parsed;
}

// Load initial mock dossiers
let dossiersLoaded = false;
const dataCsvPath = path.join(__dirname, 'data', '.csv');
if (fs.existsSync(dataCsvPath)) {
  try {
    const fileContent = fs.readFileSync(dataCsvPath, 'utf8');
    const rows = parseCSV(fileContent);
    mockDossiers = rows.map(mapCsvRowToDossier);
    dossiersLoaded = true;
    console.log(`📦 Loaded ${mockDossiers.length} initial mock dossiers from backend/data/.csv.`);
  } catch (err) {
    console.error('❌ Failed to parse backend/data/.csv:', err.message);
  }
}

if (!dossiersLoaded) {
  try {
    const dossiersFilePath = path.join(__dirname, '../frontend', 'dossiers.js');
    if (fs.existsSync(dossiersFilePath)) {
      const fileContent = fs.readFileSync(dossiersFilePath, 'utf8');
      const arrayMatch = fileContent.match(/const INITIAL_DOSSIERS = (\[[\s\S]*?\]);/);
      if (arrayMatch && arrayMatch[1]) {
        mockDossiers = eval(arrayMatch[1]);
        console.log(`📦 Loaded ${mockDossiers.length} initial mock dossiers from dossiers.js.`);
      }
    }
  } catch (e) {
    console.log('⚠️ Could not load default dossiers into memory. Using empty array fallback.');
  }
}

// ── Express API Endpoints ──

// 1. Diagnostics / Connection Check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    mode: useLocalMock ? 'Local Mock (LocalStorage/In-Memory)' : 'Supabase Live Connected',
    databaseUrlConfigured: !!dbUrl,
    supabaseConfigured: !useLocalMock,
    timestamp: new Date().toISOString()
  });
});

// 2. Setup Database Endpoint (Executes schema.sql using raw PostgreSQL connection)
app.post('/api/setup-db', async (req, res) => {
  console.log('⚡ DB Setup requested...');
  if (!pool) {
    return res.status(400).json({
      success: false,
      message: 'DATABASE_URL is not configured in .env. Please add it to enable raw database initialization.'
    });
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ success: false, message: 'schema.sql file not found in project directory.' });
    }

    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Execute SQL script
    const client = await pool.connect();
    try {
      await client.query(sql);
      useLocalMock = false; // Once database is successfully setup, try to use Supabase if available
      console.log('✅ Supabase database created and seeded successfully using schema.sql.');

      // Seed mock dossiers if database is connected
      if (supabase) {
        console.log('🚀 Seeding cdims_dossiers from local mock data into Supabase...');
        const { data: existingDossiers, error: checkErr } = await supabase
          .from('cdims_dossiers')
          .select('id');

        if (!checkErr && (!existingDossiers || existingDossiers.length === 0)) {
          const recordsToInsert = mockDossiers.map(d => ({
            id: d.id,
            personal_info: d.personalInfo,
            biometrics: d.biometrics,
            history: d.history,
            gang_info: d.gangInfo,
            surveillance: d.surveillance,
            property_details: d.propertyDetails || [],
            vehicle_details: d.vehicleDetails || [],
            status: d.status,
            approval_status: d.approvalStatus,
            submitted_by: d.submittedBy || 'System Seed',
            last_updated: d.lastUpdated || new Date().toISOString()
          }));

          if (recordsToInsert.length > 0) {
            const { error: insertErr } = await supabase
              .from('cdims_dossiers')
              .insert(recordsToInsert);
            if (insertErr) {
              console.error('⚠️ Failed to seed mock dossiers into Supabase:', insertErr.message);
            } else {
              console.log(`✅ Successfully seeded ${recordsToInsert.length} dossiers into Supabase cdims_dossiers.`);
            }
          }
        }
      }

      res.json({ success: true, message: 'Supabase database created, cdims_users and cdims_dossiers initialized and seeded successfully.' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    res.status(500).json({ success: false, message: 'Setup failed: ' + error.message });
  }
});

// 3. User Authentication Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  console.log(`🔐 Login attempt for user: ${username}`);

  if (useLocalMock) {
    const user = mockUsers.find(u => u.username === username.toLowerCase() && u.password === password);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return res.json({ success: true, user: userWithoutPassword });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials in local mock database.' });
  }

  try {
    const { data, error } = await supabase
      .from('cdims_users')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !data) {
      return res.status(401).json({ success: false, message: 'Invalid username. User not found.' });
    }

    if (data.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    const { password: _, ...userWithoutPassword } = data;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Internal login error: ' + err.message });
  }
});

// 4. Get Dossiers List (Customized according to user role content)
app.get('/api/dossiers', async (req, res) => {
  // Extract user authorization headers to customize query if needed
  const userDistrict = req.query.district;
  const userLevel = parseInt(req.query.level || '3');

  console.log(`📂 Fetching dossiers for level ${userLevel}, district: ${userDistrict || 'all'}`);

  if (useLocalMock) {
    let filtered = [...mockDossiers];
    // Customization: Level 1 and 2 are restricted to district or station content if needed
    if (userDistrict && userDistrict !== 'all' && userLevel < 3) {
      filtered = filtered.filter(d => d.history.some(h => h.district === userDistrict));
    }
    return res.json({ success: true, dossiers: filtered });
  }

  try {
    let query = supabase.from('cdims_dossiers').select('*');
    const { data, error } = await query;

    if (error) throw error;

    let dossiers = data.map(d => ({
      id: d.id,
      personalInfo: d.personal_info,
      biometrics: d.biometrics,
      history: d.history,
      gangInfo: d.gang_info,
      surveillance: d.surveillance,
      propertyDetails: d.property_details,
      vehicleDetails: d.vehicle_details,
      status: d.status,
      approvalStatus: d.approval_status,
      submittedBy: d.submitted_by,
      verifiedBy: d.verified_by,
      approvedBy: d.approved_by,
      lastUpdated: d.last_updated
    }));

    // Filter by district for local customization if requested
    if (userDistrict && userDistrict !== 'all' && userLevel < 3) {
      dossiers = dossiers.filter(d => d.history.some(h => h.district === userDistrict));
    }

    res.json({ success: true, dossiers });
  } catch (err) {
    console.error('Fetch dossiers error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Add New Dossier
app.post('/api/dossiers', async (req, res) => {
  const { dossier, username, role } = req.body;
  if (!dossier) return res.status(400).json({ success: false, message: 'Dossier object required.' });

  console.log(`➕ Creating new dossier submitted by: ${username}`);

  if (useLocalMock) {
    const nextNum = mockDossiers.length + 1;
    const idStr = String(nextNum).padStart(4, '0');
    dossier.id = `CRM-2026-${idStr}`;
    dossier.approvalStatus = 'Pending Verification';
    dossier.submittedBy = username || 'SHO User';
    dossier.lastUpdated = new Date().toISOString();

    mockDossiers.push(dossier);
    mockAuditLogs.unshift({
      timestamp: new Date().toISOString(),
      username,
      role,
      action: 'Create Dossier',
      details: `Created dossier ${dossier.id} (${dossier.personalInfo.name})`
    });

    return res.json({ success: true, dossier });
  }

  try {
    // Generate next CRM ID
    const { data: countData, error: countErr } = await supabase
      .from('cdims_dossiers')
      .select('id');

    if (countErr) throw countErr;

    const nextNum = countData.length + 1;
    const idStr = String(nextNum).padStart(4, '0');
    const newId = `CRM-2026-${idStr}`;

    const newDossierRecord = {
      id: newId,
      personal_info: dossier.personalInfo,
      biometrics: dossier.biometrics,
      history: dossier.history,
      gang_info: dossier.gangInfo,
      surveillance: dossier.surveillance,
      property_details: dossier.propertyDetails || [],
      vehicle_details: dossier.vehicleDetails || [],
      status: dossier.status,
      approval_status: 'Pending Verification',
      submitted_by: username,
      last_updated: new Date().toISOString()
    };

    const { error } = await supabase.from('cdims_dossiers').insert([newDossierRecord]);
    if (error) throw error;

    // Log in database
    await supabase.from('cdims_audit_logs').insert([{
      username,
      role,
      action: 'Create Dossier',
      details: `Created dossier ${newId} (${dossier.personalInfo.name})`
    }]);

    res.json({ success: true, dossier: { ...dossier, id: newId, approvalStatus: 'Pending Verification' } });
  } catch (err) {
    console.error('Insert dossier error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Update Dossier (Including Verification / Approvals / Corrections)
app.put('/api/dossiers/:id', async (req, res) => {
  const { id } = req.params;
  const { dossier, username, role } = req.body;

  console.log(`✏️ Updating dossier: ${id} by ${username}`);

  if (useLocalMock) {
    const idx = mockDossiers.findIndex(d => d.id === id);
    if (idx !== -1) {
      dossier.lastUpdated = new Date().toISOString();
      mockDossiers[idx] = dossier;
      mockAuditLogs.unshift({
        timestamp: new Date().toISOString(),
        username,
        role,
        action: dossier.approvalStatus !== mockDossiers[idx].approvalStatus ? 'Update Status' : 'Update Dossier',
        details: `Updated dossier ${id} (Status: ${dossier.approvalStatus})`
      });
      return res.json({ success: true, dossier });
    }
    return res.status(404).json({ success: false, message: 'Dossier not found in memory.' });
  }

  try {
    const updateRecord = {
      personal_info: dossier.personalInfo,
      biometrics: dossier.biometrics,
      history: dossier.history,
      gang_info: dossier.gangInfo,
      surveillance: dossier.surveillance,
      property_details: dossier.propertyDetails || [],
      vehicle_details: dossier.vehicleDetails || [],
      status: dossier.status,
      approval_status: dossier.approvalStatus,
      submitted_by: dossier.submittedBy,
      verified_by: dossier.verifiedBy,
      approved_by: dossier.approvedBy,
      last_updated: new Date().toISOString()
    };

    const { error } = await supabase
      .from('cdims_dossiers')
      .update(updateRecord)
      .eq('id', id);

    if (error) throw error;

    await supabase.from('cdims_audit_logs').insert([{
      username,
      role,
      action: 'Update Dossier',
      details: `Updated dossier ${id} (Status: ${dossier.approvalStatus})`
    }]);

    res.json({ success: true, dossier });
  } catch (err) {
    console.error('Update dossier error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Dynamic User ID Generation Endpoint (PHQ Admin Level 3 Action)
app.post('/api/users/generate', async (req, res) => {
  const { name, roleType, station, district, adminUser, adminRole } = req.body;

  if (!name || !roleType) {
    return res.status(400).json({ success: false, message: 'Name and Role Type are required to generate credentials.' });
  }

  console.log(`👑 Admin generating credential: ${roleType} for ${name}`);

  // Determine Level, Prefix and permissions based on Role Type
  let level = 1;
  let prefix = 'ps_';
  let permissions = ['create', 'update', 'upload', 'search'];
  let role = 'Police Station User';

  if (roleType === 'sp_nodal') {
    level = 2;
    prefix = 'sp_';
    permissions = ['view_all_district', 'verify', 'approve', 'return', 'reports', 'search'];
    role = 'District Nodal Officer';
  } else if (roleType === 'phq_level') {
    level = 3;
    prefix = 'phq_';
    permissions = ['all'];
    role = 'State Administrator';
  }

  // Create unique username: prefix + lowercase alphanumeric first name + random 3 digits
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  const randomNum = Math.floor(100 + Math.random() * 900);
  const generatedUsername = `${prefix}${cleanName}${randomNum}`;
  const defaultPassword = 'up@1234'; // Default starting password

  const newOfficer = {
    username: generatedUsername,
    password: defaultPassword,
    name,
    role,
    level,
    station: station || (level === 2 ? 'SP Office, ' + district : level === 3 ? 'PHQ — UP Police Headquarters' : 'Police Station'),
    district: district || 'all',
    avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'O',
    permissions
  };

  if (useLocalMock) {
    mockUsers.push(newOfficer);
    mockAuditLogs.unshift({
      timestamp: new Date().toISOString(),
      username: adminUser || 'phq_admin',
      role: adminRole || 'State Administrator',
      action: 'Generate Credentials',
      details: `Generated L${level} credentials for ${name} (Username: ${generatedUsername})`
    });

    const { password, ...officerInfo } = newOfficer;
    return res.json({
      success: true,
      message: `Successfully generated ${role} credentials!`,
      credentials: {
        username: generatedUsername,
        password: defaultPassword,
        ...officerInfo
      }
    });
  }

  try {
    const { error } = await supabase.from('cdims_users').insert([newOfficer]);
    if (error) throw error;

    await supabase.from('cdims_audit_logs').insert([{
      username: adminUser,
      role: adminRole,
      action: 'Generate Credentials',
      details: `Generated L${level} credentials for ${name} (Username: ${generatedUsername})`
    }]);

    const { password, ...officerInfo } = newOfficer;
    res.json({
      success: true,
      message: `Successfully generated ${role} credentials inside Supabase!`,
      credentials: {
        username: generatedUsername,
        password: defaultPassword,
        ...officerInfo
      }
    });
  } catch (err) {
    console.error('Credential generation error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate user inside database: ' + err.message });
  }
});

// 8. Get Audit Logs Trail
app.get('/api/audit-logs', async (req, res) => {
  console.log('📋 Fetching audit trail logs...');
  if (useLocalMock) {
    return res.json({ success: true, logs: mockAuditLogs.slice(0, 100) });
  }

  try {
    const { data, error } = await supabase
      .from('cdims_audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ success: true, logs: data });
  } catch (err) {
    console.error('Audit logs error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Add Audit Log
app.post('/api/audit-logs', async (req, res) => {
  const { username, role, action, details } = req.body;
  if (!username || !action) return res.status(400).json({ success: false });

  if (useLocalMock) {
    mockAuditLogs.unshift({
      timestamp: new Date().toISOString(),
      username,
      role,
      action,
      details
    });
    if (mockAuditLogs.length > 100) mockAuditLogs.pop();
    return res.json({ success: true });
  }

  try {
    const { error } = await supabase.from('cdims_audit_logs').insert([{
      username,
      role,
      action,
      details
    }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve frontend SPA index for any non-API routes (fallback routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start Server listening
app.listen(PORT, () => {
  console.log(`🚀 CDIMS Backend server running at http://localhost:${PORT}`);
  console.log(`📊 Mode: ${useLocalMock ? 'Local Mock Database Fallback' : 'Supabase Live Connected'}`);
});
