export default function CourseTag({ name }:{ name?: string }){
  if (!name) return null;
  return <span className="inline-flex items-center gap-1 text-xs text-[#6e9277] bg-[#6e9277]/10 px-2 py-1 rounded-md">📍 {name}</span>;
}
