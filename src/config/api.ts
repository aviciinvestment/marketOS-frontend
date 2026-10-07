/**
 * Centralized API Configuration for MarketOS Web Frontend
 * 
 * TO REPLACE FOR PUBLISHING / PRODUCTION:
 * - Option A: Set VITE_API_URL in your hosting environment variables (Render, Vercel, Railway, etc.)
 * - Option B: Update DEFAULT_API_URL below with your published backend URL (e.g. 'https://api.yourdomain.com')
 */

export const DEFAULT_API_URL = 'http://localhost:3005';

export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  DEFAULT_API_URL
).replace(/\/+$/, '');

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string) || 'victorychibuakunna@gmail.com';

export const API_ENDPOINTS = {
  sync: `${API_BASE_URL}/api/sync`,
  data: `${API_BASE_URL}/api/data`,
  flagPending: `${API_BASE_URL}/api/flag/pending`,
  flagClear: `${API_BASE_URL}/api/flag/clear`,
  health: `${API_BASE_URL}/api/health`,
  adminStats: `${API_BASE_URL}/api/admin/stats`,
  adminLogs: `${API_BASE_URL}/api/admin/logs`,
  adminComplaints: `${API_BASE_URL}/api/admin/complaints`,
  supportComplaint: `${API_BASE_URL}/api/support/complaint`,
} as const;
