const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATA_FILE = path.join(__dirname, "appointments.json");

function loadAppointments() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
}

function saveAppointments(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function addAppointment(appointment) {
  const data = loadAppointments();
  const newAppointment = { id: uuidv4(), ...appointment };
  data.push(newAppointment);
  saveAppointments(data);
  return newAppointment;
}

function deleteAppointment(id) {
  const data = loadAppointments();
  const index = data.findIndex((a) => a.id === id);
  if (index === -1) return false;
  data.splice(index, 1);
  saveAppointments(data);
  return true;
}

module.exports = { loadAppointments, saveAppointments, addAppointment, deleteAppointment };
