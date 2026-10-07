/**
 * Centralized API Configuration for MarketOS Web Frontend
 * 
 * TO REPLACE FOR PUBLISHING / PRODUCTION:
 * - Option A: Set VITE_API_URL in your hosting environment variables (Render, Vercel, Railway, etc.)
 * - Option B: Update DEFAULT_API_URL below with your published backend URL (e.g. 'https://api.yourdomain.com')
 */

export const DEFAULT_API_URL = 'http://localhost:3005';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('marketos_custom_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return (
    (import.meta.env.VITE_API_URL as string) ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    DEFAULT_API_URL
  ).replace(/\/+$/, '');
};

export const API_BASE_URL: string = getApiBaseUrl();

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string) || 'victorychibuakunna@gmail.com';

export const API_ENDPOINTS = {
  get sync() { return `${getApiBaseUrl()}/api/sync`; },
  get data() { return `${getApiBaseUrl()}/api/data`; },
  get flagPending() { return `${getApiBaseUrl()}/api/flag/pending`; },
  get flagClear() { return `${getApiBaseUrl()}/api/flag/clear`; },
  get health() { return `${getApiBaseUrl()}/api/health`; },
  get adminStats() { return `${getApiBaseUrl()}/api/admin/stats`; },
  get adminLogs() { return `${getApiBaseUrl()}/api/admin/logs`; },
  get adminComplaints() { return `${getApiBaseUrl()}/api/admin/complaints`; },
  get supportComplaint() { return `${getApiBaseUrl()}/api/support/complaint`; },
};
