const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./database');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files statically so they can be viewed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// API ROUTES

// 1. Get all donors
app.get('/api/donors', (req, res) => {
  db.all('SELECT * FROM donors', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 2. Add a new donor
// We use upload.single('bloodReport') to handle the file upload
app.post('/api/donors', upload.single('bloodReport'), (req, res) => {
  const { name, email, phone, bloodType, dob, address, lastDonation, donations } = req.body;
  const bloodReportName = req.file ? req.file.filename : 'N/A';
  
  const sql = `INSERT INTO donors (name, email, phone, bloodType, dob, address, bloodReportName, lastDonation, donations) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const today = new Date();
  const donationDate = today.toISOString().split('T')[0];
  const expiryDate = new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const params = [name, email, phone, bloodType, dob, address, bloodReportName, donationDate, (donations || 0) + 1];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const donorId = this.lastID;

    // Auto-create a blood bag entry for this donor with 35-day expiry
    const bagSql = `INSERT INTO blood_bags (donor_id, donorName, bloodType, donationDate, expiryDate, status) VALUES (?, ?, ?, ?, ?, 'Available')`;
    db.run(bagSql, [donorId, name, bloodType, donationDate, expiryDate], function(bagErr) {
      if (bagErr) {
        console.error('Error creating blood bag:', bagErr.message);
      }
      res.status(201).json({
        message: 'Donor added successfully',
        donor: {
          id: donorId,
          name, email, phone, bloodType, dob, address, bloodReportName, 
          lastDonation: donationDate, 
          donations: (donations || 0) + 1
        }
      });
    });
  });
});

// 3. Delete a donor (also removes their available blood bags)
app.delete('/api/donors/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM donors WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Also mark blood bags from this donor as removed
    db.run("UPDATE blood_bags SET status = 'Removed' WHERE donor_id = ? AND status = 'Available'", id);
    res.json({ message: 'Donor deleted successfully', changes: this.changes });
  });
});

// --- INVENTORY APIs (now driven by blood_bags table) ---
app.get('/api/inventory', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  // First, auto-expire any bags past their expiry date
  db.run("UPDATE blood_bags SET status = 'Expired' WHERE status = 'Available' AND expiryDate < ?", [today], function() {
    // Dynamically compute inventory from blood_bags
    const sql = `SELECT bloodType, 
                        COUNT(*) as units, 
                        MIN(expiryDate) as nextExpiry,
                        MAX(donationDate) as lastUpdated
                 FROM blood_bags 
                 WHERE status = 'Available' AND expiryDate >= ?
                 GROUP BY bloodType`;
    db.all(sql, [today], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
});

// Get all individual blood bags (detailed view)
app.get('/api/blood-bags', (req, res) => {
  db.all('SELECT blood_bags.*, donors.name as donorName FROM blood_bags LEFT JOIN donors ON blood_bags.donor_id = donors.id ORDER BY blood_bags.expiryDate ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/inventory', (req, res) => {
  const { bloodType, units, operation } = req.body;
  const today = new Date();
  const donationDate = today.toISOString().split('T')[0];
  const expiryDate = new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const unitCount = Math.abs(parseInt(units));

  if (operation === 'remove' || units < 0) {
    // FIFO: mark the oldest available bags of this blood type as 'Used'
    const selectSql = `SELECT id FROM blood_bags WHERE bloodType = ? AND status = 'Available' AND expiryDate >= ? ORDER BY expiryDate ASC LIMIT ?`;
    db.all(selectSql, [bloodType, donationDate, unitCount], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(400).json({ error: 'No available units to remove' });
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      db.run(`UPDATE blood_bags SET status = 'Used' WHERE id IN (${placeholders})`, ids, function(updateErr) {
        if (updateErr) return res.status(500).json({ error: updateErr.message });
        res.json({ message: `${rows.length} unit(s) marked as used (FIFO)` });
      });
    });
  } else {
    // Add: create anonymous blood bag entries
    const bagSql = `INSERT INTO blood_bags (donor_id, donorName, bloodType, donationDate, expiryDate, status) VALUES (NULL, 'Manual Entry', ?, ?, ?, 'Available')`;
    let inserted = 0;
    for (let i = 0; i < unitCount; i++) {
      db.run(bagSql, [bloodType, donationDate, expiryDate], function(err) {
        if (err) console.error('Error inserting blood bag:', err.message);
        inserted++;
        if (inserted === unitCount) {
          res.json({ message: `${unitCount} unit(s) added to inventory` });
        }
      });
    }
  }
});

// --- REQUESTS APIs ---
app.get('/api/requests', (req, res) => {
  db.all('SELECT * FROM requests ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/requests', (req, res) => {
  const { patientName, hospitalName, bloodType, units, urgency, reason, status, requestDate } = req.body;
  const sql = `INSERT INTO requests (patientName, hospitalName, bloodType, units, urgency, reason, status, requestDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [patientName, hospitalName, bloodType, units, urgency, reason, status || 'pending', requestDate], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, patientName, hospitalName, bloodType, units, urgency, reason, status: status || 'pending', requestDate });
  });
});

app.put('/api/requests/:id', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE requests SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Request status updated' });
  });
});

// --- STAFF APIs ---
app.get('/api/staff', (req, res) => {
  db.all('SELECT * FROM staff', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/staff', (req, res) => {
  const { name, role, email, phone, shift } = req.body;
  const sql = `INSERT INTO staff (name, role, email, phone, shift) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [name, role, email, phone, shift], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, role, email, phone, shift });
  });
});

app.delete('/api/staff/:id', (req, res) => {
  db.run('DELETE FROM staff WHERE id = ?', req.params.id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Staff deleted' });
  });
});

// --- DASHBOARD STATS API (now computed from blood_bags) ---
app.get('/api/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const stats = {
    totalDonors: 0,
    availableUnits: 0,
    pendingRequests: 0,
    activeStaff: 0,
    bloodInventory: {
      'O+': 0, 'O-': 0, 'A+': 0, 'A-': 0,
      'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0,
    }
  };
  
  db.get('SELECT COUNT(*) as count FROM donors', (err, row) => {
    if (row) stats.totalDonors = row.count;
    // Compute inventory dynamically from blood_bags
    db.all("SELECT bloodType, COUNT(*) as units FROM blood_bags WHERE status = 'Available' AND expiryDate >= ? GROUP BY bloodType", [today], (err, rows) => {
      if (rows) {
        rows.forEach(r => {
          if (stats.bloodInventory.hasOwnProperty(r.bloodType)) {
            stats.bloodInventory[r.bloodType] = r.units;
          }
        });
      }
      db.get("SELECT COUNT(*) as count FROM requests WHERE status = 'Pending'", (err, row) => {
        if (row) stats.pendingRequests = row.count;
        db.get('SELECT COUNT(*) as count FROM staff', (err, row) => {
          if (row) stats.activeStaff = row.count;
          res.json(stats);
        });
      });
    });
  });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
