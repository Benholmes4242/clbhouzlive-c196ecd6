
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { countryOptions, subCountryOptions, continentOptions } from './types';
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
}

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
}) => {
  const availableSubCountries = selectedCountry ? subCountryOptions[selectedCountry] || [] : [];

  // Only reset sub-country when country changes AND the current sub-country is not valid for the new country
  React.useEffect(() => {
    if (selectedCountry && selectedSubCountry && availableSubCountries.length > 0) {
      if (!availableSubCountries.includes(selectedSubCountry)) {
        console.log('Resetting sub-country because it is not valid for selected country');
        setSelectedSubCountry('');
      }
    }
  }, [selectedCountry]); // Only depend on selectedCountry to avoid unnecessary resets

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
            </Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select country/region" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((country) => (
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
              onValueChange={setSelectedSubCountry}
              disabled={!selectedCountry}
            >
              <SelectTrigger className={errors.sub_country ? 'border-red-500' : ''}>
                <SelectValue placeholder={selectedCountry ? "Select sub-country" : "Select country first"} />
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

          {/* Continent - Optional */}
          <div className="space-y-2">
            <Label htmlFor="continent">Continent</Label>
            <Select value={selectedContinent} onValueChange={setSelectedContinent}>
              <SelectTrigger>
                <SelectValue placeholder="Select continent" />
              </SelectTrigger>
              <SelectContent>
                {continentOptions.map((continent) => (
                  <SelectItem key={continent} value={continent}>
                    {continent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Global Rank - Optional */}
          <div className="space-y-2">
            <Label htmlFor="global_rank" className="flex items-center gap-1">
              Global Rank
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Overall world ranking (1-100)</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="global_rank"
              type="number"
              min="1"
              max="100"
              {...register('global_rank')}
              placeholder="e.g. 5"
            />
          </div>

          {/* Country Rank - Optional */}
          <div className="space-y-2">
            <Label htmlFor="country_rank" className="flex items-center gap-1">
              Country Rank
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ranking within selected sub-country (e.g. #2 in Scotland)</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="country_rank"
              type="number"
              min="1"
              {...register('country_rank')}
              placeholder="e.g. 2"
            />
          </div>

          {/* Regional Rank - Optional */}
          <div className="space-y-2">
            <Label htmlFor="regional_rank" className="flex items-center gap-1">
              Regional Rank
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rank within major regional top 100 lists (e.g. #8 in Continental Europe)</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="regional_rank"
              type="number"
              min="1"
              {...register('regional_rank')}
              placeholder="e.g. 8"
            />
          </div>

          {/* Latitude - Optional */}
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              {...register('latitude')}
              placeholder="Enter latitude (supports Google Maps)"
            />
          </div>

          {/* Longitude - Optional */}
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              {...register('longitude')}
              placeholder="Enter longitude (supports Google Maps)"
            />
          </div>
        </div>

        {/* Course Image Upload - Replaces URL input */}
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
