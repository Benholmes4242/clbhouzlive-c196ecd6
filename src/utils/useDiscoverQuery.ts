import { useSearchParams, useNavigate } from "react-router-dom";
import { MainPill, FILTER_TO_MAIN_PILL } from "@/constants/discoverPills";
import { parseTopics, stringifyTopics } from "@/constants/videoFilters";
import { useEffect } from "react";

export function useDiscoverQuery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const rawMain = params.get("main") || "videos";
  
  // Map legacy routes: 'friends' -> 'following', 'photos' -> 'videos', 'shorts' -> 'videos'
  let mappedMain = rawMain;
  if (rawMain === "friends") mappedMain = "following";
  if (rawMain === "photos" || rawMain === "shorts") mappedMain = "videos";
  
  const main = mappedMain as MainPill;
  const sub = params.get("sub") || "";
  
  // Video-specific filters
  const duration = params.get("duration") || "all";
  const topics = parseTopics(params.get("topics"));

  // Redirect shorts to videos on mount
  useEffect(() => {
    if (rawMain === "shorts") {
      navigate({ search: `?main=videos` }, { replace: true });
    }
  }, [rawMain, navigate]);

  function setMain(next: MainPill) {
    navigate({ search: `?main=${next}` }, { replace: false });
  }

  function setSub(next: string) {
    const currentMain = params.get("main") || "videos";
    navigate({ search: `?main=${currentMain}&sub=${next}` }, { replace: false });
  }
  
  function setDuration(durationKey: string) {
    const newParams = new URLSearchParams(params);
    newParams.set("duration", durationKey);
    navigate({ search: `?${newParams.toString()}` }, { replace: true });
  }
  
  function toggleTopic(topicKey: string) {
    const currentTopics = parseTopics(params.get("topics"));
    const newTopics = currentTopics.includes(topicKey)
      ? currentTopics.filter(t => t !== topicKey)
      : [...currentTopics, topicKey];
    
    const newParams = new URLSearchParams(params);
    if (newTopics.length > 0) {
      newParams.set("topics", stringifyTopics(newTopics));
    } else {
      newParams.delete("topics");
    }
    navigate({ search: `?${newParams.toString()}` }, { replace: true });
  }

  // Helper to convert filter type to main pill for backwards compatibility
  function setMainFromFilter(filterType: string) {
    const mainPill = FILTER_TO_MAIN_PILL[filterType] || "videos";
    setMain(mainPill);
  }

  return { 
    main, 
    sub, 
    duration, 
    topics, 
    setMain, 
    setSub, 
    setDuration, 
    toggleTopic, 
    setMainFromFilter 
  };
}