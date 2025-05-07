// src/services/api.js
import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost:8000/api/',   // 👈 adjust if your port/env differs
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
