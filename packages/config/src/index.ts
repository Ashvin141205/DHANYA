/**
 * Dhanya Environment & Configuration Layer
 * Package: @dhanya/config
 * 
 * Strict boundary between client-exposed public config and server-only secrets.
 */

export interface PublicConfig {
  appName: string;
  brandDomain: string;
  version: string;
  apiBaseUrl: string;
  supportedCountries: string[];
  defaultLocale: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  enableAuditLogging: boolean;
  corsOrigin: string;
}

export const PUBLIC_CONFIG: PublicConfig = {
  appName: 'Dhanya',
  brandDomain: 'dhanya.com',
  version: '1.0.0-phase1',
  apiBaseUrl: '/api/v1',
  supportedCountries: ['US', 'CA', 'IN', 'GB', 'AU', 'SG'],
  defaultLocale: 'en-US',
};

export const getServerConfig = (): ServerConfig => {
  return {
    port: 3000,
    host: '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    enableAuditLogging: true,
    corsOrigin: '*',
  };
};
