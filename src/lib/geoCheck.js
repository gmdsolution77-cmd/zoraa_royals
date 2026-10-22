// USA Geo-compliance and State verification for Vegas One Sweepstakes

export const RESTRICTED_US_STATES = ['WA', 'ID', 'NV', 'MI'];

export function checkGeoAccess(req) {
  // Check development or bypass switch
  if (process.env.NODE_ENV === 'development' || process.env.BYPASS_GEO_LOCK === 'true') {
    return {
      allowed: true,
      country: 'US',
      state: 'CA',
      isDevBypass: true,
    };
  }

  // Extract country from proxy/CDN headers
  const countryHeader =
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country-code') ||
    req.headers.get('x-geo-country');

  const stateHeader =
    req.headers.get('cf-region-code') ||
    req.headers.get('x-vercel-ip-country-region') ||
    req.headers.get('x-geo-region') ||
    '';

  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // If local / private IP address
  if (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.')
  ) {
    return {
      allowed: true,
      country: 'US',
      state: 'NY',
      isLocal: true,
    };
  }

  // Check country is US
  const country = (countryHeader || 'US').toUpperCase();
  if (country !== 'US') {
    return {
      allowed: false,
      reason: 'NON_USA_IP',
      country,
      message: 'Vegas One sweepstakes are strictly available to residents within the United States.',
    };
  }

  // Check restricted US states
  const state = (stateHeader || '').toUpperCase();
  if (RESTRICTED_US_STATES.includes(state)) {
    return {
      allowed: false,
      reason: 'RESTRICTED_STATE',
      state,
      message: `Sweepstakes participation is restricted in your state (${state}) in accordance with local regulations.`,
    };
  }

  return {
    allowed: true,
    country: 'US',
    state: state || 'US',
  };
}
