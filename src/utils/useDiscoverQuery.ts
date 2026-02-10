import { useSearchParams, useNavigate } from "react-router-dom";
import { MainPill, FILTER_TO_MAIN_PILL } from "@/constants/discoverPills";
import { parseTopics, stringifyTopics } from "@/constants/videoFilters";
import { useEffect } from "react";

export function useDiscoverQuery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const rawMain = params.get("main") || "videos";
  
  // Map legacy routes: 'friends' -> 'following', 'photos' -> 'videos', 'watch' -> 'shorts', 'channels' -> 'explore'
  let mappedMain = rawMain;
  if (rawMain === "friends") mappedMain = "following";
  if (rawMain === "photos") mappedMain = "videos";
  if (rawMain === "watch") mappedMain = "shorts";
  if (rawMain === "channels") mappedMain = "explore";
  
  const main = mappedMain as MainPill;
  const sub = params.get("sub") || "";
  
  // Video-specific filters
  const duration = params.get("duration") || "all";
  const topics = parseTopics(params.get("topics"));
  const topic = params.get("topic") || undefined;
  const channel = params.get("channel") || undefined;

  // Canonicalize: if duration=shorts is set, redirect to main=shorts
  useEffect(() => {
    const duration = params.get("duration");
    if (duration === "shorts" && main !== "shorts") {
      navigate({ search: `?main=shorts` }, { replace: true });
    }
    // If on shorts tab but duration param exists, remove it
    if (main === "shorts" && params.has("duration")) {
      navigate({ search: `?main=shorts` }, { replace: true });
    }
  }, [params, main, navigate]);

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

  function setTopic(topicKey: string | undefined) {
    const newParams = new URLSearchParams(params);
    if (topicKey) {
      newParams.set("topic", topicKey);
      newParams.delete("duration");
      newParams.delete("channel");
    } else {
      newParams.delete("topic");
    }
    navigate({ search: `?${newParams.toString()}` }, { replace: true });
  }

  function setChannel(channelKey: string | undefined) {
    const newParams = new URLSearchParams(params);
    if (channelKey) {
      newParams.set("channel", channelKey);
      newParams.delete("duration");
      newParams.delete("topic");
    } else {
      newParams.delete("channel");
    }
    navigate({ search: `?${newParams.toString()}` }, { replace: true });
  }

  return { 
    main, 
    sub, 
    duration, 
    topics,
    topic,
    channel,
    setMain, 
    setSub, 
    setDuration, 
    toggleTopic,
    setTopic,
    setChannel,
    setMainFromFilter 
  };
}