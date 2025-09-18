import { useSearchParams, useNavigate } from "react-router-dom";
import { SUBPILLS, DEFAULT_SUBPILL, MainPill, FILTER_TO_MAIN_PILL } from "@/constants/discoverPills";

export function useDiscoverQuery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const main = (params.get("main") || "videos") as MainPill;
  const allowed = SUBPILLS[main] || [DEFAULT_SUBPILL];

  const subRaw = params.get("sub") || DEFAULT_SUBPILL;
  const sub = allowed.includes(subRaw) ? subRaw : DEFAULT_SUBPILL;

  function setMain(next: MainPill) {
    const defaultSub = SUBPILLS[next]?.[0] || DEFAULT_SUBPILL;
    navigate({ search: `?main=${next}&sub=${encodeURIComponent(defaultSub)}` }, { replace: false });
  }

  function setSub(next: string) {
    navigate({ search: `?main=${main}&sub=${encodeURIComponent(next)}` }, { replace: false });
  }

  // Helper to convert filter type to main pill for backwards compatibility
  function setMainFromFilter(filterType: string) {
    const mainPill = FILTER_TO_MAIN_PILL[filterType] || "videos";
    setMain(mainPill);
  }

  return { main, sub, setMain, setSub, setMainFromFilter, allowedSubpills: allowed };
}