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
 * Normalize city name by removing common prefixes
 * e.g., "City of London" → "London"
 */
function normalizeCity(city: string): string {
  return city.replace(/^City of\s+/i, '').trim();
}

/**
 * Get city-only display (for pills/badges)
 * Fallback chain: city → locality from location → region → null
 */
export function getCityOnly(fields: LocationFields): string | null {
  const { city, region, location } = fields;
  
  // 1. Use city if available (with normalization)
  if (city?.trim()) {
    return normalizeCity(city);
  }
  
  // 2. Try to extract first part from location string (usually city/locality)
  if (location) {
    const parts = location.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      // Return first part if it doesn't look like a street address (no numbers at start)
      const first = parts[0];
      if (first && !/^\d/.test(first)) {
        return normalizeCity(first);
      }
      // If first part is a street, try second part
      if (parts.length > 1 && !/^\d/.test(parts[1])) {
        return normalizeCity(parts[1]);
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
    // Last resort: try to parse location string for city + country
    if (location) {
      const parts = location.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Find first non-street part (city) and last part (country)
        const cityIndex = parts.findIndex(p => !/^\d/.test(p));
        if (cityIndex !== -1) {
          const city = normalizeCity(parts[cityIndex]);
          const country = parts[parts.length - 1];
          return `${city}, ${country}`;
        }
      }
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
