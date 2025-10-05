import React from "react";
import ClubhouzLoading from "../ClubhouzLoading";

export default function ClbhouzPageSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
      <ClubhouzLoading />
    </div>
  );
}
