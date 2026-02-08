import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, token } = useAuth();
  const location = useLocation();

  // 로딩 중이거나 토큰이 있는 경우에는 컨텐츠를 보여줌
  if (isLoading || token) {
    return (
      <>
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          children
        )}
      </>
    );
  }

  // 로딩이 완료되고 인증되지 않은 경우에만 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
