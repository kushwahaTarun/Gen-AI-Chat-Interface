"use client";

import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ConfigCatProvider } from "configcat-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ConfigCatProvider
        sdkKey={process.env.NEXT_PUBLIC_CONFIGCAT_SDK_KEY || ""}
      >
        {children}
      </ConfigCatProvider>
    </Provider>
  );
}
