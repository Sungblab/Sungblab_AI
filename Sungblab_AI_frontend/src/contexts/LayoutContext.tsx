import React, { createContext, useContext, useState, ReactNode } from "react";

interface LayoutContextType {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 기본값은 열린 상태

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    if (!isMobileMenuOpen) {
      setIsRightSidebarOpen(false);
    }
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen((prev) => !prev);
    if (!isRightSidebarOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <LayoutContext.Provider
      value={{
        isMobileMenuOpen,
        toggleMobileMenu,
        isRightSidebarOpen,
        toggleRightSidebar,
        isSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export default LayoutContext;
