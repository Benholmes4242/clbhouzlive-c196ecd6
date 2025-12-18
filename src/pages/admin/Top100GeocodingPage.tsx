import { Top100GeocodingBackfill } from "@/components/admin/Top100GeocodingBackfill";
import { GolfClubsGeocodingBackfill } from "@/components/admin/GolfClubsGeocodingBackfill";

export function Top100GeocodingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Geocoding Tools</h2>
        <p className="text-muted-foreground">Backfill missing coordinates for courses and clubs</p>
      </div>
      
      {/* Golf Clubs - important for business profiles */}
      <GolfClubsGeocodingBackfill />
      
      {/* Top 100 Courses */}
      <Top100GeocodingBackfill />
    </div>
  );
}
