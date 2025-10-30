const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const DATA_FILE = path.join(__dirname, "appointments.json");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Load all appointments
function loadAppointments() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, "utf8");
  return data ? JSON.parse(data) : [];
}

// Save all appointments
function saveAppointments(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ✅ GET all appointments
app.get("/appointments", (req, res) => {
  const appointments = loadAppointments();
  res.json(appointments);
});

// ✅ POST new appointment
app.post("/appointments", upload.single("report"), (req, res) => {
  try {
    const appointments = loadAppointments();
    const newAppointment = {
      id: uuidv4(),
      name: req.body.name,
      gender: req.body.gender,
      dob: req.body.dob,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      doctor: req.body.doctor,
      date: req.body.date,
      time: req.body.time,
      symptoms: req.body.symptoms,
      report: req.file ? `/uploads/${req.file.filename}` : null,
    };

    appointments.push(newAppointment);
    saveAppointments(appointments);
    res.json(newAppointment);
  } catch (err) {
    console.error("Error saving appointment:", err);
    res.status(500).json({ error: "Error saving appointment" });
  }
});

// ✅ PUT update appointment
app.put("/appointments/:id", upload.single("report"), (req, res) => {
  const appointments = loadAppointments();
  const index = appointments.findIndex((a) => a.id === req.params.id);

  if (index === -1) return res.status(404).json({ error: "Appointment not found" });

  const updatedAppointment = {
    ...appointments[index],
    ...req.body,
  };

  if (req.file) updatedAppointment.report = `/uploads/${req.file.filename}`;
  appointments[index] = updatedAppointment;
  saveAppointments(appointments);
  res.json(updatedAppointment);
});

// ✅ DELETE appointment
app.delete("/appointments/:id", (req, res) => {
  let appointments = loadAppointments();
  const index = appointments.findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Appointment not found" });

  const [removed] = appointments.splice(index, 1);
  saveAppointments(appointments);

  if (removed.report) {
    const filePath = path.join(__dirname, removed.report);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  res.json({ message: "Appointment deleted successfully" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
