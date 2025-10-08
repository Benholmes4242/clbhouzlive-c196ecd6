import { useSearchParams, useNavigate } from "react-router-dom";
import { MainPill, FILTER_TO_MAIN_PILL } from "@/constants/discoverPills";

export function useDiscoverQuery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const main = (params.get("main") || "shorts") as MainPill;
  const sub = params.get("sub") || "";

  function setMain(next: MainPill) {
    navigate({ search: `?main=${next}` }, { replace: false });
  }

  function setSub(next: string) {
    const currentMain = params.get("main") || "shorts";
    navigate({ search: `?main=${currentMain}&sub=${next}` }, { replace: false });
  }

  // Helper to convert filter type to main pill for backwards compatibility
  function setMainFromFilter(filterType: string) {
    const mainPill = FILTER_TO_MAIN_PILL[filterType] || "shorts";
    setMain(mainPill);
  }

  return { main, sub, setMain, setSub, setMainFromFilter };
}