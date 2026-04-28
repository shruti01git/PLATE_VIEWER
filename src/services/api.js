/**
 * API Service for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiService = {
  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Detections
  async getDetections(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.plate) params.append('plate', filters.plate);
      if (filters.camera_id) params.append('camera_id', filters.camera_id);
      if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await fetch(`${API_BASE_URL}/detections?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get detections:', error);
      throw error;
    }
  },

  async getDetection(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/detections/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get detection:', error);
      throw error;
    }
  },

  // Cameras
  async getCameras() {
    try {
      const response = await fetch(`${API_BASE_URL}/cameras`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get cameras:', error);
      throw error;
    }
  },

  async getCamera(cameraId) {
    try {
      const response = await fetch(`${API_BASE_URL}/cameras/${cameraId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get camera:', error);
      throw error;
    }
  },

  async getCameraDetections(cameraId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(
        `${API_BASE_URL}/cameras/${cameraId}/detections?${params}`
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to get camera detections:', error);
      throw error;
    }
  },

  async getCameraVehicles(cameraId, days = 7) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/cameras/${cameraId}/vehicles?days=${days}`
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to get camera vehicles:', error);
      throw error;
    }
  },

  // Stats
  async getStats(days = 7) {
    try {
      const response = await fetch(`${API_BASE_URL}/stats?days=${days}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  },

  // Search
  async searchPlate(plate, limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/search?plate=${plate}&limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to search plate:', error);
      throw error;
    }
  },

  // Create camera
  async createCamera(camera) {
    try {
      const params = new URLSearchParams();
      Object.entries(camera).forEach(([key, value]) => {
        params.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/cameras`, {
        method: 'POST',
        body: params,
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create camera:', error);
      throw error;
    }
  },
};
