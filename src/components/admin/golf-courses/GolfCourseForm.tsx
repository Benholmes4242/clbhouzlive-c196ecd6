import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import CourseImageUpload from './CourseImageUpload';

interface GolfCourseFormProps {
  register: any;
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  selectedSubCountry: string;
  setSelectedSubCountry: (value: string) => void;
  selectedContinent: string;
  setSelectedContinent: (value: string) => void;
  errors: any;
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  // New props for Top 100s section
  regionalRankingRegion: string;
  setRegionalRankingRegion: (value: string) => void;
  regionalRank: string;
  setRegionalRank: (value: string) => void;
  globalRank: string;
  setGlobalRank: (value: string) => void;
}

// Define the primary countries that have regional Top 100 lists
const primaryCountryOptions = [
  'Africa',
  'Britain & Ireland',
  'USA', 
  'Continental Europe'
];

// Map primary countries to their sub-countries
const subCountryOptions: Record<string, string[]> = {
  'Africa': [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 
    'Cape Verde', 'Central African Republic', 'Chad', 'Democratic Republic of Congo', 
    'Djibouti', 'Egypt', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Ivory Coast', 
    'Kenya', 'Lesotho', 'Libya', 'Madagascar', 'Malawi', 'Mauritius', 'Mayotte', 
    'Morocco', 'Mozambique', 'Namibia', 'Nigeria', 'Rwanda', 'Saint Helena, Ascension, Tristan Dukana', 
    'Senegal', 'Seychelles', 'Sierra Leone', 'South Africa', 'Sudan', 'Swaziland', 
    'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ],
  'Britain & Ireland': [
    'England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland', 'Isle of Man'
  ],
  'USA': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming', 'District of Columbia'
  ],
  'Continental Europe': [
    'Austria', 'Belgium', 'Bulgaria', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 
    'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 
    'Netherlands', 'Norway', 'Poland', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 
    'Sweden', 'Switzerland', 'Turkey', 'Ireland', 'Northern Ireland', 'Scotland', 'England', 'Wales'
  ]
};

// Regional Top 100 options
const regionalTop100Options = [
  'Great Britain and Ireland',
  'USA',
  'Continental Europe'
];

// Generate rank options 1-100
const rankOptions = Array.from({ length: 100 }, (_, i) => (i + 1).toString());

const GolfCourseForm: React.FC<GolfCourseFormProps> = ({
  register,
  selectedCountry,
  setSelectedCountry,
  selectedSubCountry,
  setSelectedSubCountry,
  selectedContinent,
  setSelectedContinent,
  errors,
  currentImageUrl,
  onImageChange,
  regionalRankingRegion,
  setRegionalRankingRegion,
  regionalRank,
  setRegionalRank,
  globalRank,
  setGlobalRank,
}) => {
  const availableSubCountries = selectedCountry ? subCountryOptions[selectedCountry] || [] : [];

  console.log('=== FORM: GolfCourseForm render ===');
  console.log('selectedCountry:', selectedCountry);
  console.log('selectedSubCountry:', selectedSubCountry);
  console.log('availableSubCountries:', availableSubCountries);

  // Handle country change and validate sub-country
  const handleCountryChange = (value: string) => {
    console.log('=== FORM: Country changed to:', value);
    setSelectedCountry(value);
    
    // Only reset sub-country if the current selection is not valid for the new country
    const newAvailableSubCountries = subCountryOptions[value] || [];
    if (selectedSubCountry && !newAvailableSubCountries.includes(selectedSubCountry)) {
      console.log('=== FORM: Resetting sub-country because it is not valid for new country');
      setSelectedSubCountry('');
    }
  };

  // Handle sub-country change with better logging
  const handleSubCountryChange = (value: string) => {
    console.log('=== FORM: Sub-country manually changed to:', value);
    setSelectedSubCountry(value);
  };

  // Reset regional rank when regional ranking region changes
  const handleRegionalRankingRegionChange = (value: string) => {
    setRegionalRankingRegion(value);
    if (!value) {
      setRegionalRank('');
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Golf Course Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1">
              Golf Course Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Golf course name is required' })}
              placeholder="Enter course name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Country/Region Primary - Required */}
          <div className="space-y-2">
            <Label htmlFor="country" className="flex items-center gap-1">
              Country / Region (Primary) <span className="text-red-500">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This determines which Top 100 regional list the course belongs to</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select primary region" />
              </SelectTrigger>
              <SelectContent>
                {primaryCountryOptions.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-red-500">{errors.country.message}</p>
            )}
          </div>

          {/* Sub-Country - Required */}
          <div className="space-y-2">
            <Label htmlFor="sub_country" className="flex items-center gap-1">
              Sub-Country <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={selectedSubCountry} 
              onValueChange={handleSubCountryChange}
              disabled={!selectedCountry}
            >
              <SelectTrigger className={errors.sub_country ? 'border-red-500' : ''}>
                <SelectValue placeholder={selectedCountry ? "Select sub-country" : "Select primary region first"} />
              </SelectTrigger>
              <SelectContent>
                {availableSubCountries.map((subCountry) => (
                  <SelectItem key={subCountry} value={subCountry}>
                    {subCountry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sub_country && (
              <p className="text-sm text-red-500">{errors.sub_country.message}</p>
            )}
          </div>

          {/* Local Area/County/State - Optional */}
          <div className="space-y-2">
            <Label htmlFor="region">Local Area / County / State</Label>
            <Input
              id="region"
              {...register('region')}
              placeholder="e.g. Ayrshire, California, etc."
            />
          </div>
        </div>

        {/* New Top 100s Section */}
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-4">Top 100s</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Regional Top 100 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Regional Top 100
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select a regional Top 100 list and rank</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex gap-2">
                  <Select value={regionalRankingRegion} onValueChange={handleRegionalRankingRegionChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionalTop100Options.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={regionalRank} 
                    onValueChange={setRegionalRank}
                    disabled={!regionalRankingRegion}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {rankOptions.map((rank) => (
                        <SelectItem key={rank} value={rank}>
                          {rank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Global Top 100 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Worldwide Top 100
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select a rank in the global Top 100</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex gap-2">
                  <Select value="Worldwide" disabled>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Worldwide" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Worldwide">Worldwide</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={globalRank} onValueChange={setGlobalRank}>
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Rank" />
                    </SelectTrigger>
                    <SelectContent>
                      {rankOptions.map((rank) => (
                        <SelectItem key={rank} value={rank}>
                          {rank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latitude and Longitude */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              {...register('latitude')}
              placeholder="Enter latitude (supports Google Maps)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              {...register('longitude')}
              placeholder="Enter longitude (supports Google Maps)"
            />
          </div>
        </div>

        {/* Course Image Upload */}
        <CourseImageUpload
          currentImageUrl={currentImageUrl}
          onImageChange={onImageChange}
        />

        {/* Website URL - Optional */}
        <div className="space-y-2">
          <Label htmlFor="website_url">Website URL</Label>
          <Input
            id="website_url"
            {...register('website_url')}
            placeholder="Enter club's official website"
          />
        </div>

        {/* Description - Optional */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Short summary about the course..."
            rows={4}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default GolfCourseForm;
