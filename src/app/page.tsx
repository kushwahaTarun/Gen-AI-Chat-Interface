"use client";

import { useFeatureFlag } from "configcat-react";

export default function Home() {
  const {
    value: isMyFirstFeatureEnabledValue,
    loading: isMyFirstFeatureEnabledLoading,
  } = useFeatureFlag("isMyFirstFeatureEnabled", false);

  console.warn("isMyFirstFeatureEnabledValue", isMyFirstFeatureEnabledValue);

  return <>hello world</>;
}
