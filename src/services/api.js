import axios from 'axios';

// Create an isolated instance pointing directly to your local Node.js server
const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // Adjust if your backend API prefix is different
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // ◄--- CRITICAL: Tells Axios to automatically send and receive cookies
});

export const authService = {
  login: async (email, password) => {
    // Adjust this endpoint string to match your exact backend auth route (e.g., /auth/login)
    const response = await apiClient.post('/signIn', { email, password });
    return response.data; // Expecting { token: "ey...", user: {...} }
  },
  // New helper to verify if the user is already logged in via an existing cookie
  getCurrentUser: async () => {
    const response = await apiClient.get('/profile/view'); // Assuming you have a /me profile route
    return response.data;
  }
};

export const ticketService = {
  // Fetch all active open support tickets for the workspace queue
  getAllTickets: async () => {
    const response = await apiClient.get('/agent/tickets?status=open');    
    return response.data; // Assumes your backend returns an array of ticket records
  },

  // Fetch older historical messages logged in the DB for a specific clicked ticket
  getTicketMessages: async (ticketId) => {
    const response = await apiClient.get(`/agent/tickets/${ticketId}`);
    return response.data; // Assumes your backend returns an array of message records
  }
};