import React from "react";
import Header from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-dvh bg-gray-50 dark:bg-gray-900 pb-[env(safe-area-inset-bottom,0px)]">
      <Header />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default MainLayout;
