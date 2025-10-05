import React from "react";
import { useGlobalLoading } from "./GlobalLoading";
import ClbhouzPageSpinner from "../components/ui/ClbhouzPageSpinner";

export default function GlobalSpinner() {
  const { loading, suppressUntil } = useGlobalLoading();
  if (!loading || Date.now() <= suppressUntil) return null;
  return <ClbhouzPageSpinner />;
}
