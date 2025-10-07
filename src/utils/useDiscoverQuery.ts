import { useSearchParams, useNavigate } from "react-router-dom";
import { MainPill, FILTER_TO_MAIN_PILL } from "@/constants/discoverPills";

export function useDiscoverQuery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const main = (params.get("main") || "shorts") as MainPill;

  function setMain(next: MainPill) {
    navigate({ search: `?main=${next}` }, { replace: false });
  }

  // Helper to convert filter type to main pill for backwards compatibility
  function setMainFromFilter(filterType: string) {
    const mainPill = FILTER_TO_MAIN_PILL[filterType] || "shorts";
    setMain(mainPill);
  }

  return { main, setMain, setMainFromFilter };
}