
import { ExcelCourseData, Continent, DebugInfo } from './types';

export const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

export const normalizeHeader = (header: string): string => {
  return header.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

export const findColumnIndex = (headers: string[], patterns: string[]): number => {
  return headers.findIndex(header => 
    patterns.some(pattern => header.includes(pattern))
  );
};

export const detectContinent = (country: string): Continent => {
  const countryLower = country.toLowerCase();
  
  if (countryLower.includes('usa') || countryLower.includes('united states') || 
      countryLower.includes('america') || countryLower.includes('canada')) {
    return 'North America';
  } else if (countryLower.includes('australia') || countryLower.includes('new zealand')) {
    return 'Oceania';
  } else if (countryLower.includes('japan') || countryLower.includes('china') || 
             countryLower.includes('korea') || countryLower.includes('singapore')) {
    return 'Asia';
  } else if (countryLower.includes('south africa') || countryLower.includes('egypt') || 
             countryLower.includes('morocco')) {
    return 'Africa';
  }
  
  return 'Europe'; // default
};

export const parseExcelFile = async (file: File): Promise<{ data: ExcelCourseData[], debug: DebugInfo }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        console.log('Starting to parse file:', file.name);
        const text = e.target?.result as string;
        
        if (!text || text.trim().length === 0) {
          throw new Error('File is empty or could not be read');
        }
        
        const lines = text.split(/\r?\n|\r/).filter(line => line.trim());
        console.log('Total lines found:', lines.length);
        
        if (lines.length < 2) {
          throw new Error('File must contain at least a header row and one data row');
        }
        
        const rawHeaders = parseCSVLine(lines[0]);
        const headers = rawHeaders.map(normalizeHeader);
        
        console.log('Raw headers:', rawHeaders);
        console.log('Normalized headers:', headers);
        
        // Column mapping
        const nameIndex = findColumnIndex(headers, ['name', 'course', 'golf_course', 'course_name']);
        const countryIndex = findColumnIndex(headers, ['country', 'nation', 'location']);
        const regionIndex = findColumnIndex(headers, ['region', 'state', 'province', 'area']);
        const continentIndex = findColumnIndex(headers, ['continent']);
        const globalRankIndex = findColumnIndex(headers, ['global_rank', 'world_rank', 'rank', 'global', 'world']);
        const regionalRankIndex = findColumnIndex(headers, ['regional_rank', 'region_rank']);
        const usaRankIndex = findColumnIndex(headers, ['usa_rank', 'us_rank', 'america_rank']);
        const descriptionIndex = findColumnIndex(headers, ['description', 'notes', 'details']);
        const latitudeIndex = findColumnIndex(headers, ['latitude', 'lat']);
        const longitudeIndex = findColumnIndex(headers, ['longitude', 'lng', 'lon', 'long']);
        const thumbnailIndex = findColumnIndex(headers, ['thumbnail', 'image', 'photo', 'picture']);
        const websiteIndex = findColumnIndex(headers, ['website', 'url', 'link', 'web']);
        
        const debug: DebugInfo = {
          totalLines: lines.length,
          headers: rawHeaders,
          normalizedHeaders: headers,
          columnMapping: {
            name: nameIndex,
            country: countryIndex,
            region: regionIndex,
            continent: continentIndex,
            globalRank: globalRankIndex,
            regionalRank: regionalRankIndex,
            usaRank: usaRankIndex,
            description: descriptionIndex,
            latitude: latitudeIndex,
            longitude: longitudeIndex,
            thumbnail: thumbnailIndex,
            website: websiteIndex
          }
        };
        
        console.log('Column mapping:', debug.columnMapping);
        
        if (nameIndex === -1) {
          throw new Error(`Name column not found. Available columns: ${rawHeaders.join(', ')}. Expected columns with names like: name, course, golf_course, course_name`);
        }
        
        if (countryIndex === -1) {
          throw new Error(`Country column not found. Available columns: ${rawHeaders.join(', ')}. Expected columns with names like: country, nation, location`);
        }
        
        const courses: ExcelCourseData[] = [];
        const validContinents: Continent[] = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Oceania'];
        const skippedRows = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          console.log(`Processing row ${i}:`, values);
          
          if (values.length < Math.max(nameIndex + 1, countryIndex + 1)) {
            console.log(`Skipping row ${i}: insufficient columns`);
            skippedRows.push({ row: i, reason: 'insufficient columns', values });
            continue;
          }
          
          const name = values[nameIndex]?.replace(/"/g, '').trim();
          const country = values[countryIndex]?.replace(/"/g, '').trim();
          
          if (!name || !country) {
            console.log(`Skipping row ${i}: missing name or country`);
            skippedRows.push({ row: i, reason: 'missing name or country', name, country });
            continue;
          }
          
          let continent: Continent = 'Europe';
          if (continentIndex >= 0 && values[continentIndex]) {
            const continentValue = values[continentIndex]?.replace(/"/g, '').trim();
            if (validContinents.includes(continentValue as Continent)) {
              continent = continentValue as Continent;
            }
          } else {
            continent = detectContinent(country);
          }
          
          const course: ExcelCourseData = {
            name,
            country,
            region: regionIndex >= 0 ? values[regionIndex]?.replace(/"/g, '').trim() || '' : '',
            continent,
            global_rank: globalRankIndex >= 0 && values[globalRankIndex] ? 
              parseInt(values[globalRankIndex]) || undefined : undefined,
            regional_rank: regionalRankIndex >= 0 && values[regionalRankIndex] ? 
              parseInt(values[regionalRankIndex]) || undefined : undefined,
            usa_rank: usaRankIndex >= 0 && values[usaRankIndex] ? 
              parseInt(values[usaRankIndex]) || undefined : undefined,
            description: descriptionIndex >= 0 ? 
              values[descriptionIndex]?.replace(/"/g, '').trim() || '' : '',
            latitude: latitudeIndex >= 0 && values[latitudeIndex] ? 
              parseFloat(values[latitudeIndex]) || undefined : undefined,
            longitude: longitudeIndex >= 0 && values[longitudeIndex] ? 
              parseFloat(values[longitudeIndex]) || undefined : undefined,
            thumbnail_image: thumbnailIndex >= 0 && values[thumbnailIndex] ? 
              values[thumbnailIndex]?.replace(/"/g, '').trim() || 
              'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop' : 
              'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
            website_url: websiteIndex >= 0 ? 
              values[websiteIndex]?.replace(/"/g, '').trim() || undefined : undefined
          };
          
          courses.push(course);
          console.log('Added course:', course.name);
        }
        
        console.log('Parsed courses:', courses.length);
        console.log('Skipped rows:', skippedRows.length);
        
        if (courses.length === 0) {
          throw new Error(`No valid courses found. Debug info: ${JSON.stringify({ skippedRows, debug }, null, 2)}`);
        }
        
        resolve({ data: courses, debug });
      } catch (error) {
        console.error('Parse error:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
