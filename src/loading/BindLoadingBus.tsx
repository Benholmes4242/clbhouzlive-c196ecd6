import { useEffect } from "react";
import { useGlobalLoading } from "./GlobalLoading";
import { loadingBus } from "../api/loadingBus";

export default function BindLoadingBus() {
  const { begin, end } = useGlobalLoading();
  useEffect(() => {
    const unsubscribe = loadingBus.subscribe(d => {
      if (d === 1) begin();
      else end();
    });
    return unsubscribe;
  }, [begin, end]);
  return null;
}
