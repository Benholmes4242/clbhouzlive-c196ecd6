
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GolfCourseFormProps {
  register: any;
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  selectedContinent: string;
  setSelectedContinent: (value: string) => void;
  selectedRegionalRank: string;
  setSelectedRegionalRank: (value: string) => void;
}

const countryOptions = [
  'USA',
  'Britain and Ireland',
  'Continental Europe',
  'Worldwide'
];

const regionalRankOptions = [
  'Britain and Ireland',
  'USA',
  'Continental Europe'
];

const continentOptions = [
  'North America',
  'South America',
  'Europe',
  'Asia',
  'Africa',
  'Oceania'
];

const GolfCourseForm: React.FC<GolfCourseFormProps> = ({
  register,
  selectedCountry,
  setSelectedCountry,
  selectedContinent,
  setSelectedContinent,
  selectedRegionalRank,
  setSelectedRegionalRank,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Golf Course Name *</Label>
          <Input
            id="name"
            {...register('name', { required: true })}
            placeholder="Enter course name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            {...register('region')}
            placeholder="Enter region/state"
          />
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="global_rank">Global Rank</Label>
          <Input
            id="global_rank"
            type="number"
            {...register('global_rank')}
            placeholder="Enter global ranking"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="regional_rank">Regional Rank</Label>
          <Select value={selectedRegionalRank} onValueChange={setSelectedRegionalRank}>
            <SelectTrigger>
              <SelectValue placeholder="Select regional ranking category" />
            </SelectTrigger>
            <SelectContent>
              {regionalRankOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            {...register('latitude')}
            placeholder="Enter latitude"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            {...register('longitude')}
            placeholder="Enter longitude"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail_image">Course Image URL</Label>
        <Input
          id="thumbnail_image"
          {...register('thumbnail_image')}
          placeholder="Enter image URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input
          id="website_url"
          {...register('website_url')}
          placeholder="Enter website URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter course description..."
          rows={4}
        />
      </div>
    </div>
  );
};

export default GolfCourseForm;
