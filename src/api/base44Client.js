// Use the server-side proxy at /api/external to avoid exposing API keys in the browser.
const PROXY_BASE = '/api/external';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${PROXY_BASE}${path}`;
  const init = Object.assign({ headers: { 'Content-Type': 'application/json' } }, options);
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json().catch(() => null);
}

export const base44 = {
  // Simple auth helpers - first try local server (/api/auth/me), otherwise failover to Base44 if available
  auth: {
    async me() {
      try {
        // Try local server route first (app may provide JWT in browser cookies or Authorization header)
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) return res.json();
      } catch (e) {
        // ignore and fallback
      }

      // Fallback: try Base44 user info endpoint if any (best-effort)
      try {
        return await request('/entities/User');
      } catch (e) {
        return null;
      }
    }
  },

  // SafetyReport entity
  async getSafetyReports() {
    return request('/entities/SafetyReport');
  },

  async updateSafetyReport(entityId, updateData) {
    return request(`/entities/SafetyReport/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // BuddyRequest entity
  async getBuddyRequests() {
    return request('/entities/BuddyRequest');
  },

  async updateBuddyRequest(entityId, updateData) {
    return request(`/entities/BuddyRequest/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // EmergencyAlert entity
  async getEmergencyAlerts() {
    return request('/entities/EmergencyAlert');
  },

  async updateEmergencyAlert(entityId, updateData) {
    return request(`/entities/EmergencyAlert/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  // Message entity
  async getMessages() {
    return request('/entities/Message');
  },

  async updateMessage(entityId, updateData) {
    return request(`/entities/Message/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }
};

// Provide a convenience `entities` API to match existing app code (e.g. base44.entities.X.create(...))
function buildQuery(params = {}) {
  const esc = encodeURIComponent;
  return Object.keys(params)
    .map(k => `${esc(k)}=${esc(params[k])}`)
    .join('&');
}

function entityClient(name) {
  return {
    list(sort, limit) {
      const q = {};
      if (sort) q.sort = sort;
      if (limit) q.limit = limit;
      const qs = buildQuery(q);
      return request(`/entities/${name}${qs ? `?${qs}` : ''}`);
    },
    filter(filters = {}) {
      const qs = buildQuery(filters);
      return request(`/entities/${name}${qs ? `?${qs}` : ''}`);
    },
    create(data) {
      return request(`/entities/${name}`, { method: 'POST', body: JSON.stringify(data) });
    },
    update(id, data) {
      return request(`/entities/${name}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
  };
}

base44.entities = new Proxy({}, {
  get(target, prop) {
    // prop is the entity name, e.g. 'SafetyReport'
    return entityClient(prop.toString());
  }
});

export default base44;
