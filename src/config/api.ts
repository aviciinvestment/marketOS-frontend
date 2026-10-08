/**
 * Centralized API Configuration for MarketOS Web Frontend
 *
 * TO REPLACE FOR PUBLISHING / PRODUCTION:
 * - Set VITE_API_URL (or VITE_API_BASE_URL) in your hosting environment variables (Render, Vercel, Railway, etc.)
 * - There is no hardcoded backend URL here anymore; the app reads the env only.
 */

export const DEFAULT_API_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  '';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('marketos_custom_api_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return DEFAULT_API_URL.replace(/\/+$/, '');
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
  get uploadAvatar() { return `${getApiBaseUrl()}/api/profile/upload-avatar`; },
};
