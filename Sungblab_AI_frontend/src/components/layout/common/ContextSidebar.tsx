import React from "react";
import { useLayout } from "../../../contexts/LayoutContext";

interface ContextSidebarProps {
  children: React.ReactNode;
}

const ContextSidebar: React.FC<ContextSidebarProps> = ({ children }) => {
  const { isRightSidebarOpen } = useLayout();

  return (
    <div className="h-[calc(100vh-4rem)] w-96 max-w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      <div className="h-full overflow-hidden sidebar-container">
        {children}
      </div>
    </div>
  );
};

export default ContextSidebar;
