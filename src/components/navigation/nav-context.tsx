"use client";

import React, { createContext, useContext, useState } from "react";

interface NavContextType {
  isMobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const NavContext = createContext<NavContextType>({
  isMobileOpen: false,
  toggleMobile: () => {},
  closeMobile: () => {},
});

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <NavContext.Provider value={{ isMobileOpen, toggleMobile, closeMobile }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  return useContext(NavContext);
}

