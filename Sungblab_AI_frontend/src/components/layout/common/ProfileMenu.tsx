import React, { useState, useEffect, useRef } from "react";
import { ChevronUpIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../../hooks/useTheme";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SettingsModal from "./SettingsModal";
import { useSubscription } from "../../../contexts/SubscriptionContext";

const ProfileMenu: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { subscription, isLoading } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLearnMore(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 사용자 이름의 첫 글자를 가져오는 함수
  const getInitial = (name: string) => {
    return name.charAt(0);
  };

  // 스켈레톤 로딩 UI 컴포넌트
  const SubscriptionSkeleton = () => (
    <div className="mt-1 animate-pulse flex items-center space-x-2">
      <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-3 w-1 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  );

  // 프로필 이미지나 이니셜을 표시하는 컴포넌트
  const ProfileImage = () => {
    if (user?.profile_image) {
      return (
        <img
          src={user.profile_image}
          alt={user.full_name}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
        <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
          {getInitial(user.full_name)}
        </span>
      </div>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg
        text-gray-700 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-700
        transition-colors duration-150 ease-in-out"
      >
        <div className="flex items-center">
          <ProfileImage />
          <div className="ml-3 text-left">
            <div className="text-sm font-medium">{user.full_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
            {isLoading ? (
              <SubscriptionSkeleton />
            ) : (
              subscription && (
                <div className="mt-1 flex items-center">
                  <span
                    className={`text-xs font-medium ${
                      subscription.status === "active"
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {subscription.plan === "FREE"
                      ? "무료"
                      : subscription.plan === "BASIC"
                      ? "베이직"
                      : "프리미엄"}{" "}
                    플랜
                  </span>
                </div>
              )
            )}
          </div>
        </div>
        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none">
          <div className="p-1">
            <button
              onClick={() => {
                setShowSettings(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              설정
            </button>
            <button
              onClick={toggleTheme}
              className="w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDark ? "라이트 모드" : "다크 모드"}
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLearnMore(!showLearnMore);
                }}
                className="w-full text-left px-3 py-2 text-sm rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
              >
                더 알아보기
                <ChevronRightIcon
                  className={`w-4 h-4 transform transition-transform duration-200 ${
                    showLearnMore ? (isMobile ? "rotate-180" : "rotate-90") : ""
                  }`}
                />
              </button>
              {showLearnMore && (
                <div
                  className={`
                    bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
                    z-50 mt-1 w-full
                  `}
                >
                  <div className="p-1">
                    <button
                      onClick={() =>
                        window.open("https://sungblab-ai.vercel.app/", "_blank")
                      }
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      About Sungblab
                    </button>
                    <button
                      onClick={() => window.open("/legal/terms", "_blank")}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      이용약관
                    </button>
                    <button
                      onClick={() => window.open("/legal/privacy", "_blank")}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      개인정보처리방침
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};

export default ProfileMenu;
