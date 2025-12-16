/**
 * Location display utilities for consistent City/Country formatting
 * Used across Business Profile, Maps, and other location displays
 */

interface LocationFields {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  location?: string | null; // Fallback full address string
}

// Countries where we include region (state/province)
const REGION_COUNTRIES = ['United States', 'US', 'USA', 'Canada', 'CA', 'Australia', 'AU'];

/**
 * Get city-only display (for pills/badges)
 * Fallback chain: city → locality from location → region → null
 */
export function getCityOnly(fields: LocationFields): string | null {
  const { city, region, location } = fields;
  
  // 1. Use city if available
  if (city?.trim()) {
    return city.trim();
  }
  
  // 2. Try to extract first part from location string (usually city/locality)
  if (location) {
    const parts = location.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      // Return first part if it doesn't look like a street address (no numbers at start)
      const first = parts[0];
      if (first && !/^\d/.test(first)) {
        return first;
      }
      // If first part is a street, try second part
      if (parts.length > 1 && !/^\d/.test(parts[1])) {
        return parts[1];
      }
    }
  }
  
  // 3. Fall back to region
  if (region?.trim()) {
    return region.trim();
  }
  
  return null;
}

/**
 * Get City + Country display (for location lines under names, map meta)
 * Format: "London, United Kingdom" or "Austin, TX, United States" (for US/CA/AU)
 */
export function getCityCountry(fields: LocationFields): string | null {
  const { city, region, country, location } = fields;
  
  const cityPart = getCityOnly(fields);
  const countryPart = country?.trim();
  
  if (!cityPart && !countryPart) {
    // Last resort: try to parse location string
    if (location) {
      const parts = location.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Return first and last parts (city and country)
        return `${parts[0]}, ${parts[parts.length - 1]}`;
      }
      return parts[0] || null;
    }
    return null;
  }
  
  if (!countryPart) {
    return cityPart;
  }
  
  if (!cityPart) {
    return countryPart;
  }
  
  // Check if we should include region
  const includeRegion = REGION_COUNTRIES.some(c => 
    countryPart.toLowerCase() === c.toLowerCase()
  );
  
  if (includeRegion && region?.trim()) {
    return `${cityPart}, ${region.trim()}, ${countryPart}`;
  }
  
  return `${cityPart}, ${countryPart}`;
}

/**
 * Format location for map meta display (same as getCityCountry)
 */
export const getMapLocationLabel = getCityCountry;
