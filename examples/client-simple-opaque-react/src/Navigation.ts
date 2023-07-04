import { createContext, useContext } from "react";

const NavContext = createContext<(location: string) => void>(() => {
  // intentional no-op
});

export function useNavigation() {
  return useContext(NavContext);
}

export const NavigationProvider = NavContext.Provider;
