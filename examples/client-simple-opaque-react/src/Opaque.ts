import * as opaque from "@serenity-kit/opaque";
import { OpaqueConfig } from "@serenity-kit/opaque-react";
import { createContext, useContext } from "react";

const opaqueConfig: OpaqueConfig = {
  opaque,
  basePath: "http://localhost:8881/auth/opaque",
};

const OpaqueContext = createContext(opaqueConfig);

export function useOpaqueConfig() {
  return useContext(OpaqueContext);
}
