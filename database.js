const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to the database file
const dbPath = path.resolve(__dirname, 'bloodbank.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create Donors Table
    db.run(`CREATE TABLE IF NOT EXISTS donors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      bloodType TEXT NOT NULL,
      dob TEXT NOT NULL,
      address TEXT NOT NULL,
      bloodReportName TEXT,
      lastDonation TEXT DEFAULT 'N/A',
      donations INTEGER DEFAULT 0
    )`);

    // Create Inventory Table (kept for backward compatibility, but units are now derived from blood_bags)
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bloodType TEXT UNIQUE NOT NULL,
      units INTEGER DEFAULT 0,
      lastUpdated TEXT
    )`);

    // Create Blood Bags Table — tracks individual blood units with per-donor expiry
    db.run(`CREATE TABLE IF NOT EXISTS blood_bags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      donor_id INTEGER,
      donorName TEXT,
      bloodType TEXT NOT NULL,
      donationDate TEXT NOT NULL,
      expiryDate TEXT NOT NULL,
      status TEXT DEFAULT 'Available',
      FOREIGN KEY (donor_id) REFERENCES donors(id)
    )`);

    // Create Requests Table
    db.run(`CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientName TEXT,
      hospitalName TEXT NOT NULL,
      bloodType TEXT NOT NULL,
      units INTEGER NOT NULL,
      urgency TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'Pending',
      requestDate TEXT
    )`);

    // Create Staff Table
    db.run(`CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      shift TEXT NOT NULL
    )`);
    
    console.log('Database tables ready.');
  }
});

module.exports = db;
