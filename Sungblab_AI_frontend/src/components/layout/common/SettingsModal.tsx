import React, { useState } from "react";
import {
  UserIcon,
  KeyIcon,
  CreditCardIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../contexts/AuthContext";
import { useApi } from "../../../utils/api";
import Modal from "./Modal";
import { useSubscription } from "../../../contexts/SubscriptionContext";

type SettingSection =
  | "profile"
  | "account"
  | "billing";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { fetchWithAuth } = useApi();
  const { subscription } = useSubscription();
  const [activeSection, setActiveSection] = useState<SettingSection>("profile");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const sections = [
    { id: "profile", name: "프로필 설정", icon: UserIcon },
    { id: "account", name: "계정 설정", icon: KeyIcon },
    { id: "billing", name: "결제 설정", icon: CreditCardIcon },
  ];

  // 그룹 이름 한글화 (일반 분석 제거)
  const groupNameKorean = {
    basic_chat: "기본 대화",
    advanced_analysis: "고급 분석",
  };



  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.email) {
      alert("이메일 주소가 일치하지 않습니다.");
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetchWithAuth("/users/me", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("계정 삭제에 실패했습니다.");
      }

      await logout();
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordError("");

      if (newPassword !== confirmPassword) {
        setPasswordError("새 비밀번호가 일치하지 않습니다.");
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError("비밀번호는 8자 이상이어야 합니다.");
        return;
      }

      const response = await fetchWithAuth("/users/me/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "비밀번호 변경에 실패했습니다.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("비밀번호가 성공적으로 변경되었습니다.");
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(
        error instanceof Error
          ? error.message
          : "비밀번호 변경 중 오류가 발생했습니다."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="custom" 
      customSize="w-[100vw] h-[100vh] sm:w-[95vw] md:w-[900px] lg:w-[1000px] xl:w-[1200px] sm:max-w-[95vw] sm:h-[85vh] sm:min-h-[85vh] sm:max-h-[85vh] sm:rounded-2xl"
    >
      <div className="h-full sm:h-[85vh] bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl flex flex-col">
        {/* 모달 헤더 */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              설정
            </h1>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 탭 네비게이션 */}
        <div className="md:hidden border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <div className="flex overflow-x-auto scrollbar-hide px-3 py-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as SettingSection)}
                  className={`flex-shrink-0 flex flex-col items-center px-6 py-3 mx-2 rounded-xl transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-100"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium whitespace-nowrap">{section.name.replace(' 설정', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 데스크톱 사이드바 */}
          <div className="hidden md:block w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <nav className="p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() =>
                      setActiveSection(section.id as SettingSection)
                    }
                    className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                      activeSection === section.id
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-100 shadow-md"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex-1 overflow-y-auto min-w-0">
            <div className="p-4 sm:p-6 lg:p-8">
              {activeSection === "profile" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      프로필 설정
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      개인 정보를 관리하고 구독 상태를 확인하세요.
                    </p>
                  </div>


                  {/* 구독 상태 카드 */}
                  {subscription && (
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-4 sm:p-6 rounded-2xl border border-primary-200 dark:border-primary-800 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                          구독 정보
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 dark:bg-primary-700/30 dark:text-primary-300 w-fit">
                          {subscription.plan === "FREE"
                            ? "무료"
                            : subscription.plan === "BASIC"
                            ? "베이직"
                            : "프리미엄"}{" "}
                          플랜
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                                  {/* 사용량 표시 */}
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              이달 사용량
                            </h4>
                            {Object.entries(subscription.group_usage)
                              .filter(([group]) => group !== "normal_analysis")
                              .map(([group, usage]) => (
                                <div key={group} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      <span className="font-medium">
                                        {
                                          groupNameKorean[
                                            group as keyof typeof groupNameKorean
                                          ]
                                        }
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        {group === "basic_chat" && "(Gemini Flash)"}
                                        {group === "advanced_analysis" && "(Gemini Pro)"}
                                      </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                      {usage} / {subscription.group_limits[group as keyof typeof subscription.group_limits]}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${Math.min(
                                          (usage / subscription.group_limits[group as keyof typeof subscription.group_limits]) * 100,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            )}
                        </div>

                        {/* 구독 상태 정보 */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            구독 상태
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                상태
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  subscription.status === "active"
                                    ? "text-green-600 dark:text-green-400"
                                    : subscription.status === "expired"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-yellow-600 dark:text-yellow-400"
                                }`}
                              >
                                {subscription.status === "active"
                                  ? `활성 (${subscription.days_remaining}일 남음)`
                                  : subscription.status === "expired"
                                  ? "만료됨"
                                  : "취소됨"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                다음 갱신일
                              </span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : "미정"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 프로필 정보 */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      개인 정보
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          이름
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed text-sm sm:text-base"
                          defaultValue={user?.full_name}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          이메일
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed text-sm sm:text-base"
                          defaultValue={user?.email}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "account" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      계정 설정
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      계정 보안 및 관리 설정을 변경하세요.
                    </p>
                  </div>

                  {/* 비밀번호 변경 */}
                  {user?.auth_provider === "LOCAL" && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        비밀번호 변경
                      </h3>
                      {passwordError && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                        </div>
                      )}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            현재 비밀번호
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="현재 비밀번호를 입력하세요"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                            >
                              {showCurrentPassword ? (
                                <EyeSlashIcon className="h-5 w-5" />
                              ) : (
                                <EyeIcon className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            새 비밀번호
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="새 비밀번호를 입력하세요"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                            >
                              {showNewPassword ? (
                                <EyeSlashIcon className="h-5 w-5" />
                              ) : (
                                <EyeIcon className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            비밀번호는 최소 8자 이상이어야 하며, 영문, 숫자, 특수문자를 포함해야 합니다
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            새 비밀번호 확인
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="새 비밀번호를 다시 입력하세요"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-500"
                            >
                              {showConfirmPassword ? (
                                <EyeSlashIcon className="h-5 w-5" />
                              ) : (
                                <EyeIcon className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={handlePasswordChange}
                          disabled={isChangingPassword}
                          className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 계정 삭제 */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      계정 삭제
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                      계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다. 
                      계속하려면 아래에 이메일 주소를 입력하세요.
                    </p>
                    <div className="space-y-4">
                      <input
                        type="email"
                        placeholder="이메일 주소를 입력하세요"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-red-600 dark:text-white"
                      />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmation !== user?.email}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isDeleting ? "삭제 중..." : "계정 영구 삭제"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "billing" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      구독 설정
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      구독 플랜을 관리하고 결제 정보를 확인하세요.
                    </p>
                  </div>

                  {/* 현재 구독 정보 */}
                  {subscription && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        현재 구독 정보
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">현재 플랜</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {subscription.plan === "FREE" ? "무료" : subscription.plan === "BASIC" ? "베이직" : "프리미엄"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">구독 상태</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {subscription.status === "active"
                                ? `활성 (${subscription.days_remaining}일 남음)`
                                : subscription.status === "expired"
                                ? "만료됨"
                                : "취소됨"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">갱신일</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : "미정"}
                            </span>
                          </div>
                                                 </div>
                         <div className="space-y-3">
                           {Object.entries(subscription.group_usage)
                             .filter(([group]) => group !== "normal_analysis")
                             .map(([group, usage]) => (
                               <div key={group} className="flex justify-between">
                                 <div className="text-sm text-gray-600 dark:text-gray-400">
                                   <span>{groupNameKorean[group as keyof typeof groupNameKorean]}</span>
                                   <span className="ml-2 text-xs text-gray-500">
                                     {group === "basic_chat" && "(Gemini Flash)"}
                                     {group === "advanced_analysis" && "(Gemini Pro)"}
                                   </span>
                                 </div>
                                 <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                   {usage} / {subscription.group_limits[group as keyof typeof subscription.group_limits]}
                                 </span>
                               </div>
                             ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 플랜 비교 */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      플랜 비교
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">기능</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">무료</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">베이직</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">프리미엄</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          <tr>
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">가격</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">무료</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">월 9,900원</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">월 19,900원</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                              기본 대화
                              <br />
                              <span className="text-xs text-gray-500">(Gemini Flash)</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">50회/월</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">200회/월</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">500회/월</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                              고급 분석
                              <br />
                              <span className="text-xs text-gray-500">(Gemini Pro)</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">10회/월</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">70회/월</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">150회/월</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">우선 응답</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">❌</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">✅</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">✅</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">전용 지원</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">❌</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">✅</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">✅ (우선)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* AI 모델 설명 */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      AI 모델 설명
                    </h3>
                    <div className="space-y-4">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">기본 대화 모델</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Gemini Flash:</strong> Google의 빠른 응답 모델로, 다양한 주제에 대한 지식을 갖추고 있으며 일상적인 대화에 적합합니다.
                        </p>
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">고급 분석 모델</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Gemini Pro:</strong> Google의 최신 고성능 모델로, 복잡한 문제 해결과 창의적인 콘텐츠 생성에 뛰어난 성능을 보입니다.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 업그레이드 안내 */}
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
                    <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
                      플랜 업그레이드
                    </h3>
                    <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
                      상위 플랜으로 업그레이드하여 더 많은 AI 모델 사용량과 고급 기능을 이용해보세요.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                      >
                        베이직 플랜 (월 9,900원)
                      </button>
                      <button
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                      >
                        프리미엄 플랜 (월 19,900원)
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-primary-600 dark:text-primary-400">
                      * 플랜 업그레이드는 준비 중입니다. 곧 서비스를 제공해 드리겠습니다.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      보안 설정
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      계정 보안을 강화하고 개인정보를 보호하세요.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheckIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      개발 중인 기능
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      보안 설정 기능은 현재 개발 중입니다.<br />
                      더 나은 서비스로 곧 찾아뵙겠습니다.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      알림 설정
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      알림 수신 방법과 빈도를 설정하세요.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BellIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      개발 중인 기능
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      알림 설정 기능은 현재 개발 중입니다.<br />
                      더 나은 서비스로 곧 찾아뵙겠습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
