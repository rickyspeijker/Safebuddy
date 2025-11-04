const BASE_URL = 'https://app.base44.com/api/apps/69065969794f6d47834ae4a2';
const API_KEY = '98b54e098e1b4733ba59dbf75a230351';

const headers = {
  'api_key': API_KEY,
  'Content-Type': 'application/json'
};

export const base44 = {
  // Safety Reports
  async getSafetyReports() {
    const response = await fetch(`${BASE_URL}/entities/SafetyReport`, { headers });
    return response.json();
  },

  async updateSafetyReport(entityId, updateData) {
    const response = await fetch(`${BASE_URL}/entities/SafetyReport/${entityId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    return response.json();
  }
};
