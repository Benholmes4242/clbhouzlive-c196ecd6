import { Top100GeocodingBackfill } from "@/components/admin/Top100GeocodingBackfill";

export function Top100GeocodingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Top 100 Course Geocoding</h2>
        <p className="text-muted-foreground">Backfill missing coordinates for Top 100 courses</p>
      </div>
      <Top100GeocodingBackfill />
    </div>
  );
}
