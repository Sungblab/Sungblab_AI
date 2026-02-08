import React, { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useTheme } from "../../hooks/useTheme";
import { LoadingOptimizer } from "../../utils/loadingOptimizer";
import {
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  UsersIcon,
  CreditCardIcon,
  ChartBarIcon,
  Bars3Icon,
  HomeIcon,
  SunIcon,
  MoonIcon,
  ArrowLeftIcon,
  ServerIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  ArrowPathIcon,
  BellIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartPieIcon,
  UserGroupIcon,
  BanknotesIcon,
  GlobeAltIcon,
  CpuChipIcon,
  CloudIcon,
  SparklesIcon,
  BoltIcon,
  BeakerIcon,
  KeyIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  PresentationChartBarIcon,
  FireIcon,
  StarIcon,
  WifiIcon,
  SignalIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  TagIcon,
      CubeIcon,
    BuildingLibraryIcon,
  WrenchScrewdriverIcon,
  FolderIcon,
  TrophyIcon,
  PaperClipIcon,
  LinkIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  } from "@heroicons/react/24/outline";
import { useApi } from "../../utils/api";
import { toast } from "react-hot-toast";

// 모델별 가격 정보 타입 정의 (토큰 수에 따른 차등 가격 지원)
interface ModelPricingTier {
  threshold: number; // 토큰 수 임계값
  input: number;
  output: number;
}

interface ModelPricing {
  tiers: ModelPricingTier[];
}

interface ModelPricingMap {
  [key: string]: ModelPricing;
}



// 모델별 가격 정보 업데이트 (2025년 1월 최신 Gemini 가격 반영)
const MODEL_PRICING: ModelPricingMap = {
  "gemini-2.5-pro": {
    tiers: [
      { threshold: 200000, input: 1.25, output: 10.0 }, // 20만 토큰 이하
      { threshold: Infinity, input: 2.5, output: 15.0 }, // 20만 토큰 초과
    ],
  },
  "gemini-2.5-flash": {
    tiers: [
      { threshold: Infinity, input: 0.15, output: 0.60 }, // 모든 토큰 수 (2025년 1월 최신 가격)
    ],
  },
};

// 가격 계산 함수 - 올바른 tier 계산 로직 적용
const calculateModelCost = (model: string, inputTokens: number, outputTokens: number): number => {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  let totalCost = 0;
  
  // gemini-2.5-pro의 경우 tier별 계산 (20만 토큰 임계값)
  if (model === "gemini-2.5-pro") {
    const THRESHOLD = 200000; // 20만 토큰 임계값
    
    // Input tokens 계산
    if (inputTokens <= THRESHOLD) {
      totalCost += (inputTokens / 1000000) * pricing.tiers[0].input;
    } else {
      // 20만 토큰까지는 첫 번째 tier 가격
      totalCost += (THRESHOLD / 1000000) * pricing.tiers[0].input;
      // 초과분은 두 번째 tier 가격
      totalCost += ((inputTokens - THRESHOLD) / 1000000) * pricing.tiers[1].input;
    }
    
    // Output tokens 계산
    if (outputTokens <= THRESHOLD) {
      totalCost += (outputTokens / 1000000) * pricing.tiers[0].output;
    } else {
      // 20만 토큰까지는 첫 번째 tier 가격
      totalCost += (THRESHOLD / 1000000) * pricing.tiers[0].output;
      // 초과분은 두 번째 tier 가격
      totalCost += ((outputTokens - THRESHOLD) / 1000000) * pricing.tiers[1].output;
    }
  } else {
    // gemini-2.5-flash 등 단일 tier 모델
    const tier = pricing.tiers[0];
    totalCost = (inputTokens / 1000000) * tier.input + (outputTokens / 1000000) * tier.output;
  }
  
  return totalCost;
};

// 모델별 통계 타입 정의
interface ModelStats {
  input_tokens: number;
  output_tokens: number;
}

interface ModelStatsMap {
  [key: string]: ModelStats;
}

// 로딩 스피너 컴포넌트
const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`}></div>
    </div>
  );
};

// 에러 메시지 컴포넌트
const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
    <div className="text-center">
      <h3 className="text-lg font-medium text-red-800 dark:text-red-200">오류 발생</h3>
      <p className="text-sm text-red-600 dark:text-red-400 mt-2">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        다시 시도
      </button>
    )}
  </div>
);

// 빈 상태 컴포넌트
const EmptyState: React.FC<{ title: string; description: string; icon?: React.ComponentType<any> }> = ({ 
  title, 
  description, 
  icon: Icon = DocumentTextIcon 
}) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
    <Icon className="h-12 w-12 text-gray-400" />
    <div className="text-center">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
    </div>
  </div>
);

// 통계 카드 컴포넌트
const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<any>;
  color?: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
}> = ({ title, value, change, icon: Icon, color = "primary", trend = "neutral", description }) => {
  const colorClasses = {
    primary: "bg-primary-500 text-white",
    green: "bg-green-500 text-white",
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
    orange: "bg-orange-500 text-white",
    red: "bg-red-500 text-white",
    gray: "bg-gray-500 text-white",
  };

  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-gray-500",
  };

  const TrendIcon = trend === "up" ? ArrowTrendingUpIcon : trend === "down" ? ArrowDownIcon : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {change !== undefined && TrendIcon && (
          <div className={`flex items-center ${trendColors[trend]}`}>
            <TrendIcon className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

// 테이블 컴포넌트
const Table: React.FC<{
  columns: Array<{ key: string; label: string; sortable?: boolean; render?: (value: any, row: any) => React.ReactNode }>;
  data: any[];
  loading?: boolean;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  emptyMessage?: string;
  maxHeight?: string;
}> = ({ 
  columns, 
  data, 
  loading = false, 
  onSort, 
  sortKey, 
  sortDirection = "asc", 
  emptyMessage = "데이터가 없습니다.",
  maxHeight = "400px"
}) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <EmptyState title="데이터 없음" description={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto" style={{ maxHeight }}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" : ""
                  }`}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortKey === column.key && (
                      <div className="flex flex-col">
                        {sortDirection === "asc" ? (
                          <ArrowUpIcon className="h-3 w-3 text-gray-400" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 페이지네이션 컴포넌트
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  totalItems: number;
}> = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {startItem}-{endItem} of {totalItems} 항목
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="ml-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="25">25개</option>
          <option value="50">50개</option>
          <option value="100">100개</option>
        </select>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          이전
        </button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-md transition-colors ${
              currentPage === page
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
};

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isDark, toggleTheme } = useTheme();

  // URL에서 현재 탭 가져오기
  const getCurrentTab = () => {
    const path = location.pathname.split("/").pop();
    if (
      path === "users" ||
      path === "stats" ||
      path === "subscriptions" ||
      path === "chat-database" ||
      path === "api-status" ||
      path === "model-management" ||
      path === "system-health"
    ) {
      return path;
    }
    return "overview";
  };

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "stats"
    | "subscriptions"
    | "chat-database"
    | "api-status"
    | "model-management"
    | "system-health"
  >(getCurrentTab());

  // 관리자가 아닌 경우 접근 제한
  useEffect(() => {
    if (!user?.is_superuser) {
      navigate("/");
    }
  }, [user, navigate]);

  // URL 변경 시 탭 업데이트
  useEffect(() => {
    const currentTab = getCurrentTab();
    setActiveTab(currentTab);
  }, [location.pathname]);

  const menuItems = [
    { id: "overview", name: "현황 대시보드", icon: ChartPieIcon, path: "/admin", color: "primary" },
    { id: "users", name: "사용자 관리", icon: UserGroupIcon, path: "/admin/users", color: "blue" },
    { id: "subscriptions", name: "구독 관리", icon: BanknotesIcon, path: "/admin/subscriptions", color: "green" },
    { id: "stats", name: "통계 분석", icon: PresentationChartBarIcon, path: "/admin/stats", color: "purple" },
    { id: "chat-database", name: "채팅 데이터", icon: DocumentTextIcon, path: "/admin/chat-database", color: "blue" },
    { id: "model-management", name: "모델 관리", icon: CpuChipIcon, path: "/admin/model-management", color: "red" },
    { id: "api-status", name: "API 상태", icon: WifiIcon, path: "/admin/api-status", color: "gray" },
    { id: "system-health", name: "시스템 헬스", icon: HeartIcon, path: "/admin/system-health", color: "orange" },
  ];

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tabId: typeof activeTab) => {
    const menuItem = menuItems.find((item) => item.id === tabId);
    if (menuItem) {
      navigate(menuItem.path);
      setActiveTab(tabId);
      setIsSidebarOpen(false);
    }
  };

  return (
    <HelmetProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Helmet>
          <title>Sungblab AI</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Helmet>

        {/* 모바일 헤더 */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 flex items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-primary-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Sungblab AI</h1>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* 사이드바 오버레이 */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* 사이드바 */}
        <div
          className={`
            fixed lg:static inset-y-0 left-0 z-20 mt-16 lg:mt-0
            transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 transition-transform duration-300 ease-in-out
            w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            overflow-y-auto shadow-lg lg:shadow-none
          `}
        >
          <div className="h-full flex flex-col">
            {/* 로고 */}
            <div className="hidden lg:flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-600 to-primary-700">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-8 w-8 text-white" />
                <h1 className="text-xl font-bold text-white">Sungblab AI</h1>
              </div>
            </div>

            {/* 네비게이션 */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as typeof activeTab)}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${
                      activeTab === item.id
                        ? "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 shadow-md"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {activeTab === item.id && (
                    <ChevronRightIcon className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </nav>

            {/* 하단 액션 */}
            <div className="px-4 py-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? (
                  <>
                    <SunIcon className="w-5 h-5 mr-3" />
                    라이트 모드
                  </>
                ) : (
                  <>
                    <MoonIcon className="w-5 h-5 mr-3" />
                    다크 모드
                  </>
                )}
              </button>
              <button
                onClick={() => navigate("/chat")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-3" />
                채팅으로 돌아가기
              </button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex flex-col overflow-hidden mt-16 lg:mt-0">
          {/* 헤더 */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {menuItems.find(item => item.id === activeTab)?.name}
                </h1>
              </div>

            </div>
          </div>

          {/* 컨텐츠 영역 */}
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              {activeTab === "overview" && <Overview isActive={activeTab === "overview"} />}
              {activeTab === "users" && <UserManagement isActive={activeTab === "users"} />}
              {activeTab === "subscriptions" && <SubscriptionManagement isActive={activeTab === "subscriptions"} />}
              {activeTab === "stats" && <Statistics isActive={activeTab === "stats"} />}
              {activeTab === "chat-database" && <ChatDatabaseManagement isActive={activeTab === "chat-database"} />}
              {activeTab === "model-management" && <ModelManagement />}
              {activeTab === "api-status" && <ApiStatus />}
              {activeTab === "system-health" && <SystemHealthMonitoring />}
            </div>
          </main>
        </div>
      </div>
    </HelmetProvider>
  );
};

interface User {
  id: string;
  email: string;
  full_name: string;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
  auth_provider: string;
  profile_image?: string;
}

interface ChatStatistics {
  total_chats: number;
  total_messages: number;
  total_input_tokens: number;
  total_output_tokens: number;
  user_stats: Array<{
    user_id: string;
    email: string;
    name: string;
    chat_count: number;
    message_count: number;
    input_tokens: number;
    output_tokens: number;
  }>;
  projects: Array<{
    project_id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    message_count: number;
    input_tokens: number;
    output_tokens: number;
  }>;
}

// 구독 상태 타입 업데이트
interface Subscription {
  id: string;
  user_id: string;
  plan: "FREE" | "BASIC" | "PREMIUM";
  status: "active" | "cancelled" | "expired";
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  renewal_date: string;
  user_email: string;
  user_name: string;
  days_remaining: number;
  group_usage: {
    basic_chat: number;
    normal_analysis: number;
    advanced_analysis: number;
  };
  group_limits: {
    basic_chat: number;
    normal_analysis: number;
    advanced_analysis: number;
  };
  remaining_usage: {
    basic_chat: number;
    normal_analysis: number;
    advanced_analysis: number;
  };
}

// UserManagement 컴포넌트 대폭 개선
const UserManagement: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "user">("all");
  const [sortBy, setSortBy] = useState<"created_at" | "full_name" | "email">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(50);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    thisMonth: 0,
  });
  const { fetchWithAuth } = useApi();

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth("/admin/users");
      const data = await response.json();
      if (Array.isArray(data)) {
        setUsers(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("사용자 목록 조회 실패:", error);
      toast.error("사용자 목록을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 통계 계산
  const calculateStats = (userData: User[]) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats = {
      total: userData.length,
      active: userData.filter(user => user.is_active).length,
      inactive: userData.filter(user => !user.is_active).length,
      admins: userData.filter(user => user.is_superuser).length,
      thisMonth: userData.filter(user => new Date(user.created_at) >= thisMonth).length,
    };
    
    setUserStats(stats);
  };

  // 필터링 및 검색
  useEffect(() => {
    let filtered = [...users];

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (filterStatus !== "all") {
      filtered = filtered.filter(user => 
        filterStatus === "active" ? user.is_active : !user.is_active
      );
    }

    // 역할 필터
    if (filterRole !== "all") {
      filtered = filtered.filter(user => 
        filterRole === "admin" ? user.is_superuser : !user.is_superuser
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortBy === "created_at") {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        return sortOrder === "desc" ? bDate.getTime() - aDate.getTime() : aDate.getTime() - bDate.getTime();
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortOrder === "desc") {
        return bStr.localeCompare(aStr);
      }
      return aStr.localeCompare(bStr);
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, filterStatus, filterRole, sortBy, sortOrder]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // 관리자 권한 토글
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await fetchWithAuth(`/admin/users/${userId}/admin-status`, {
        method: "PATCH",
        body: JSON.stringify({ is_admin: !currentStatus }),
      });
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_superuser: !currentStatus } : user
      ));
      
      toast.success(`관리자 권한이 ${!currentStatus ? '부여' : '제거'}되었습니다.`);
    } catch (error) {
      toast.error("관리자 권한 변경에 실패했습니다.");
    }
  };

  // 사용자 상태 토글
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await fetchWithAuth(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
      
      toast.success(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      toast.error("사용자 상태 변경에 실패했습니다.");
    }
  };

  // 사용자 삭제
  const deleteUser = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return;
    
    try {
      await fetchWithAuth(`/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success("사용자가 삭제되었습니다.");
    } catch (error) {
      toast.error("사용자 삭제에 실패했습니다.");
    }
  };

  // 선택된 사용자 삭제
  const deleteSelectedUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!confirm(`선택한 ${selectedUsers.length}명의 사용자를 삭제하시겠습니까?`)) return;
    
    try {
      await Promise.all(
        selectedUsers.map(userId =>
          fetchWithAuth(`/admin/users/${userId}`, { method: "DELETE" })
        )
      );
      
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length}명의 사용자가 삭제되었습니다.`);
    } catch (error) {
      toast.error("일부 사용자 삭제에 실패했습니다.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="전체 사용자"
          value={userStats.total}
          icon={UsersIcon}
          color="primary"
          description="등록된 모든 사용자"
        />
        <StatCard
          title="활성 사용자"
          value={userStats.active}
          icon={UserCircleIcon}
          color="green"
          description="활성화된 사용자"
        />
        <StatCard
          title="비활성 사용자"
          value={userStats.inactive}
          icon={XMarkIcon}
          color="red"
          description="비활성화된 사용자"
        />
        <StatCard
          title="관리자"
          value={userStats.admins}
          icon={UserGroupIcon}
          color="purple"
          description="관리자 권한 사용자"
        />
        <StatCard
          title="이달 신규"
          value={userStats.thisMonth}
          icon={UsersIcon}
          color="blue"
          description="이번 달 가입자"
        />
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* 검색 */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="사용자 이름 또는 이메일 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">모든 역할</option>
              <option value="admin">관리자</option>
              <option value="user">일반 사용자</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="created_at-desc">최신 가입순</option>
              <option value="created_at-asc">오래된 가입순</option>
              <option value="full_name-asc">이름순 (A-Z)</option>
              <option value="full_name-desc">이름순 (Z-A)</option>
              <option value="email-asc">이메일순 (A-Z)</option>
              <option value="email-desc">이메일순 (Z-A)</option>
            </select>
          </div>
        </div>

        {/* 선택된 사용자 액션 */}
        {selectedUsers.length > 0 && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedUsers.length}명 선택됨
            </span>
            <button
              onClick={deleteSelectedUsers}
              className="inline-flex items-center px-2 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
            >
              <TrashIcon className="w-3 h-3 mr-1" />
              선택 삭제
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="inline-flex items-center px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-md transition-colors duration-200"
            >
              선택 해제
            </button>
          </div>
        )}
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              사용자 목록
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{filteredUsers.length}명</span>
              <span>•</span>
              <span>{currentPage}/{totalPages}</span>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 사용자 목록 */}
        <div className="h-[600px] overflow-y-auto">
          <div className="p-3">
            {currentUsers.length === 0 ? (
              <EmptyState
                title="사용자가 없습니다"
                description="검색 조건에 맞는 사용자가 없습니다."
                icon={UsersIcon}
              />
            ) : (
              <div className="space-y-2">
                {currentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      
                      <div className="flex items-center gap-2">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <UserCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center gap-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {user.full_name}
                            </h4>
                            {user.is_superuser && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                관리자
                              </span>
                            )}
                            {!user.is_active && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                                비활성
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>{user.email}</span>
                            <span>•</span>
                            <span>{new Date(user.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAdminStatus(user.id, user.is_superuser)}
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                          user.is_superuser
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {user.is_superuser ? '관리자' : '일반'}
                      </button>
                      
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                          user.is_active
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                        }`}
                      >
                        {user.is_active ? '활성' : '비활성'}
                      </button>
                      
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={usersPerPage}
              onItemsPerPageChange={() => {}}
              totalItems={filteredUsers.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// 구독 관리 컴포넌트 업데이트
const SubscriptionManagement: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { fetchWithAuth } = useApi();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState("start_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [renewingExpired, setRenewingExpired] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [averageUsage, setAverageUsage] = useState<{
    basic_chat: { current: number; limit: number };
    advanced_analysis: { current: number; limit: number };
  }>({
    basic_chat: { current: 0, limit: 0 },
    advanced_analysis: { current: 0, limit: 0 },
  });
  const [renewalCount, setRenewalCount] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth("/admin/subscriptions");
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("구독 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // 구독 상태 변경
  const handlePlanChange = async (userId: string, plan: string) => {
    try {
      const response = await fetchWithAuth(`/admin/subscriptions/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          plan: plan,
          update_limits: true, // 플랜 변경 시 제한량도 함께 업데이트
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to update subscription plan"
        );
      }

      // 응답 데이터를 받아서 해당 구독 정보만 즉시 업데이트
      const updatedSubscription = await response.json();
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.user_id === userId ? updatedSubscription : sub))
      );

      toast.success("구독 플랜이 성공적으로 변경되었습니다.");
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      toast.error("구독 플랜 변경에 실패했습니다.");
    }
  };

  // 사용량 초기화
  const resetUsage = async (userId: string) => {
    try {
      const response = await fetchWithAuth(
        `/admin/users/${userId}/reset-usage`
      );

      if (!response.ok) {
        throw new Error("Failed to reset usage");
      }

      // 응답 데이터를 받아서 해당 구독 정보만 즉시 업데이트
      const updatedSubscription = await response.json();
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.user_id === userId ? updatedSubscription : sub))
      );

      toast.success("사용량이 초기화되었습니다.");
    } catch (error) {
      console.error("Error resetting usage:", error);
      toast.error("사용량 초기화에 실패했습니다.");
    }
  };

  // 일괄 작업 처리
  const handleBulkAction = async () => {
    if (!bulkAction || selectedSubscriptions.length === 0) return;

    try {
      const promises = selectedSubscriptions.map(userId => {
        switch (bulkAction) {
          case "reset_usage":
            return resetUsage(userId);
          case "activate":
            return handleStatusChange(userId, "active");
          case "deactivate":
            return handleStatusChange(userId, "expired");
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`${selectedSubscriptions.length}개의 구독에 대해 작업이 완료되었습니다.`);
      setSelectedSubscriptions([]);
      setBulkAction("");
    } catch (error) {
      console.error("Error in bulk action:", error);
      toast.error("일괄 작업 중 오류가 발생했습니다.");
    }
  };

  // 구독 상태 변경
  const handleStatusChange = async (userId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`/admin/subscriptions/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscription status");
      }

      const updatedSubscription = await response.json();
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.user_id === userId ? updatedSubscription : sub))
      );
    } catch (error) {
      console.error("Error updating subscription status:", error);
      throw error;
    }
  };

  // 그룹 이름 한글화
  const groupNameKorean = {
    basic_chat: "기본 대화",
    normal_analysis: "일반 분석",
    advanced_analysis: "고급 분석",
  };

  // 구독 통계 계산
  const subscriptionStats = {
    total: subscriptions.length,
    active: subscriptions.filter((sub) => sub.status === "active").length,
    expired: subscriptions.filter((sub) => sub.status === "expired").length,
    cancelled: subscriptions.filter((sub) => sub.status === "cancelled").length,
    byPlan: {
      FREE: subscriptions.filter((sub) => sub.plan === "FREE").length,
      BASIC: subscriptions.filter((sub) => sub.plan === "BASIC").length,
      PREMIUM: subscriptions.filter((sub) => sub.plan === "PREMIUM").length,
    },
  };

  // 정렬 핸들러 추가
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 검색어나 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPlan]);

  // 필터링 및 정렬 로직
  const filteredAndSortedSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch =
        sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.user_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || sub.status === filterStatus;
      const matchesPlan = filterPlan === "all" || sub.plan === filterPlan;
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "start_date":
          comparison =
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
          break;
        case "days_remaining":
          comparison = a.days_remaining - b.days_remaining;
          break;
        case "user_name":
          comparison = a.user_name.localeCompare(b.user_name);
          break;
        case "user_email":
          comparison = a.user_email.localeCompare(b.user_email);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const totalPages = Math.ceil(
    filteredAndSortedSubscriptions.length / itemsPerPage
  );
  const currentItems = filteredAndSortedSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 만료된 구독 일괄 갱신 함수 추가
  const renewAllExpiredSubscriptions = async () => {
    try {
      setRenewingExpired(true);
      const response = await fetchWithAuth(
        "/admin/subscriptions/renew-expired",
        {
          method: "POST",
        }
      );
      const data = await response.json();
      toast.success(`${data.renewed_count}개의 만료된 구독이 갱신되었습니다.`);
      fetchSubscriptions(); // 구독 목록 새로고침
    } catch (error) {
      console.error("만료된 구독 갱신 중 오류 발생:", error);
      toast.error("만료된 구독 갱신 중 오류가 발생했습니다.");
    } finally {
      setRenewingExpired(false);
    }
  };

  useEffect(() => {
    // 평균 사용량 계산
    if (subscriptions.length > 0) {
      const basicChatUsage = subscriptions.reduce(
        (acc, sub) => {
          return {
            current: acc.current + sub.group_usage.basic_chat,
            limit: acc.limit + sub.group_limits.basic_chat,
          };
        },
        { current: 0, limit: 0 }
      );

      const advancedAnalysisUsage = subscriptions.reduce(
        (acc, sub) => {
          return {
            current: acc.current + sub.group_usage.advanced_analysis,
            limit: acc.limit + sub.group_limits.advanced_analysis,
          };
        },
        { current: 0, limit: 0 }
      );

      setAverageUsage({
        basic_chat: basicChatUsage,
        advanced_analysis: advancedAnalysisUsage,
      });

      // 7일 이내 갱신 예정 구독 수 계산
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const renewals = subscriptions.filter((sub) => {
        const renewalDate = new Date(sub.renewal_date);
        return renewalDate <= sevenDaysFromNow && sub.status === "active";
      });

      setRenewalCount(renewals.length);
    }
  }, [subscriptions]);

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                구독 관리
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                전체 구독자 현황을 관리하고 모니터링합니다
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={renewAllExpiredSubscriptions}
              disabled={renewingExpired}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {renewingExpired ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  처리 중...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  만료된 구독 일괄 갱신
                </>
              )}
            </button>
            {/* 일괄 작업 기능 - 추후 구현 예정 */}
            {false && selectedSubscriptions.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">일괄 작업 선택</option>
                  <option value="reset_usage">사용량 초기화</option>
                  <option value="activate">구독 활성화</option>
                  <option value="deactivate">구독 비활성화</option>
                </select>
                <button
                  onClick={() => {}}
                  disabled={!bulkAction}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  실행
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 구독 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 구독자"
          value={subscriptionStats.total}
          icon={UsersIcon}
          color="blue"
          description={`활성 ${subscriptionStats.active} / 만료 ${subscriptionStats.expired} / 취소 ${subscriptionStats.cancelled}`}
        />
        <StatCard
          title="활성 구독자"
          value={subscriptionStats.active}
          icon={CheckCircleIcon}
          color="green"
          description={`전체 구독자 중 ${((subscriptionStats.active / subscriptionStats.total) * 100).toFixed(1)}%`}
        />
        <StatCard
          title="프리미엄 구독자"
          value={subscriptionStats.byPlan.PREMIUM}
          icon={StarIcon}
          color="purple"
          description={`베이직 ${subscriptionStats.byPlan.BASIC} / 무료 ${subscriptionStats.byPlan.FREE}`}
        />
        <StatCard
          title="갱신 예정"
          value={renewalCount}
          icon={ClockIcon}
          color="orange"
          description="다음 7일 이내"
        />
      </div>

      {/* 사용량 현황 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
            <ChartPieIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            전체 사용량 현황
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  기본 대화
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {averageUsage?.basic_chat?.current || 0} / {averageUsage?.basic_chat?.limit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      ((averageUsage?.basic_chat?.current || 0) /
                        (averageUsage?.basic_chat?.limit || 1)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  고급 분석
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {averageUsage?.advanced_analysis?.current || 0} / {averageUsage?.advanced_analysis?.limit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      ((averageUsage?.advanced_analysis?.current || 0) /
                        (averageUsage?.advanced_analysis?.limit || 1)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {subscriptionStats.byPlan.PREMIUM}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">프리미엄</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {subscriptionStats.byPlan.BASIC}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">베이직</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  {subscriptionStats.byPlan.FREE}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">무료</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <MagnifyingGlassIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            검색 및 필터
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="이메일 또는 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          {/* 상태 필터 */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성</option>
              <option value="expired">만료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>

          {/* 플랜 필터 */}
          <div className="relative">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">모든 플랜</option>
              <option value="PREMIUM">프리미엄</option>
              <option value="BASIC">베이직</option>
              <option value="FREE">무료</option>
            </select>
          </div>

          {/* 정렬 */}
          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => handleSort(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            >
              <option value="days_remaining">남은 기간</option>
              <option value="start_date">가입일</option>
              <option value="user_name">이름</option>
              <option value="user_email">이메일</option>
            </select>
            <button
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {sortDirection === "asc" ? (
                <ArrowUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ArrowDownIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 구독자 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              구독자 목록
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  총 {subscriptions.length}개의 구독
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  검색 결과: {filteredAndSortedSubscriptions.length}개
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                페이지당 항목:
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="50">50개</option>
                <option value="100">100개</option>
              </select>
            </div>
          </div>
        </div>
        {/* 로딩 상태 */}
        {loading && (
          <div className="p-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* 구독자 테이블 목록 */}
        {!loading && (
          <>
            {currentItems.length > 0 ? (
              <div className="overflow-x-auto max-h-[calc(100vh-20rem)]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort("user_name")}
                      >
                        <div className="flex items-center gap-1">
                          구독자
                          {sortField === "user_name" && (
                            sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        플랜/상태
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        사용량
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort("start_date")}
                      >
                        <div className="flex items-center gap-1">
                          가입일
                          {sortField === "start_date" && (
                            sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort("days_remaining")}
                      >
                        <div className="flex items-center gap-1">
                          남은 기간
                          {sortField === "days_remaining" && (
                            sortDirection === "asc" ? (
                              <ArrowUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4" />
                            )
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentItems.map((subscription) => (
                      <tr
                        key={subscription.user_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                              <UserCircleIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {subscription.user_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {subscription.user_email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <select
                              value={subscription.plan}
                              onChange={(e) =>
                                handlePlanChange(subscription.user_id, e.target.value)
                              }
                              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                              <option value="FREE">무료</option>
                              <option value="BASIC">베이직</option>
                              <option value="PREMIUM">프리미엄</option>
                            </select>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subscription.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : subscription.status === "expired"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {subscription.status === "active"
                                ? "활성"
                                : subscription.status === "expired"
                                ? "만료"
                                : "취소"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-3">
                            {Object.entries(subscription.group_usage).map(
                              ([group, usage]) => {
                                const limit =
                                  subscription.group_limits[
                                    group as keyof typeof subscription.group_limits
                                  ];
                                const percentage = (usage / limit) * 100;
                                return (
                                  <div key={group} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                                        {
                                          groupNameKorean[
                                            group as keyof typeof groupNameKorean
                                          ]
                                        }
                                      </span>
                                      <span className="text-gray-900 dark:text-white">
                                        {usage} / {limit}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          percentage > 90
                                            ? "bg-gradient-to-r from-red-500 to-orange-500"
                                            : percentage > 70
                                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                            : "bg-gradient-to-r from-green-500 to-blue-500"
                                        }`}
                                        style={{
                                          width: `${Math.min(percentage, 100)}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Date(subscription.start_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <span className={`font-medium ${
                              subscription.days_remaining <= 7 
                                ? 'text-red-600 dark:text-red-400' 
                                : subscription.days_remaining <= 30 
                                ? 'text-yellow-600 dark:text-yellow-400' 
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {subscription.days_remaining}일
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => resetUsage(subscription.user_id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                              <ArrowPathIcon className="h-4 w-4 mr-1" />
                              초기화
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    검색 결과가 없습니다
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm ? (
                      <>
                        '<span className="font-medium">{searchTerm}</span>'에 대한 검색 결과를 찾을 수 없습니다.
                      </>
                    ) : (
                      "선택한 필터 조건에 해당하는 구독자가 없습니다."
                    )}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                        setFilterPlan("all");
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      필터 초기화
                    </button>
                    {searchTerm && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        다른 검색어를 시도해보세요
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedSubscriptions.length}개 중{" "}
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredAndSortedSubscriptions.length)}개 표시
            </div>
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 mr-2 rotate-180" />
                이전
              </button>
              
              <div className="flex items-center space-x-1">
                {(() => {
                  const pageNumbers = [];
                  const maxVisiblePages = 5;
                  let startPage = Math.max(
                    1,
                    currentPage - Math.floor(maxVisiblePages / 2)
                  );
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  if (startPage > 1) {
                    pageNumbers.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pageNumbers.push(
                        <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                      );
                    }
                  }

                  for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === i
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pageNumbers.push(
                        <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                      );
                    }
                    pageNumbers.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pageNumbers;
                })()}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

// 통계 컴포넌트
const Statistics: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [chatStats, setChatStats] = useState<ChatStatistics | null>(null);
  const [tokenUsageHistory, setTokenUsageHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1350);
  const [selectedTimeRange, setSelectedTimeRange] = useState<"7d" | "30d" | "90d" | "all" | "custom">("all");
  const [sortBy, setSortBy] = useState<"usage" | "cost" | "date">("usage");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const { fetchWithAuth } = useApi();

  // 시간 포맷 함수 - 한국 시간대 고려
  const formatDateTime = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 한국 시간대로 표시
    return dateObj.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Seoul',
      hour12: false
    });
  };

  // 상대 시간 포맷 함수 - 한국 시간대 고려
  const formatRelativeTime = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    
    // 한국 시간대 기준으로 계산
    const kstDate = new Date(dateObj.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const kstNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    
    const diff = kstNow.getTime() - kstDate.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    
    return formatDateTime(dateObj);
  };

  // 달러를 원화로 변환하는 함수
  const convertToKRW = (usd: number) => {
    return (usd * exchangeRate).toLocaleString("ko-KR");
  };

  // 환율 정보 가져오기
  const fetchExchangeRate = async () => {
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const data = await response.json();
      const rate = data.rates.KRW;
      setExchangeRate(rate);
    } catch (error) {
      console.error("환율 정보를 가져오는데 실패했습니다:", error);
      setExchangeRate(1350);
    }
  };

  // 날짜 범위 계산 함수
  const getDateRange = (timeRange: string, customStart?: string, customEnd?: string) => {
    // KST 시간 계산 (UTC+9)
    const now = new Date();
    const kstOffset = 9 * 60; // KST는 UTC+9시간
    const kstNow = new Date(now.getTime() + kstOffset * 60 * 1000);
    
    let start: Date;
    let end: Date = kstNow;
    
    switch (timeRange) {
      case "7d":
        start = new Date(kstNow.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        start = new Date(kstNow.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        start = new Date(kstNow.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        if (customStart && customEnd) {
          // 커스텀 날짜를 KST로 처리
          const startDate = new Date(customStart + 'T00:00:00');
          const endDate = new Date(customEnd + 'T23:59:59');
          start = new Date(startDate.getTime() + kstOffset * 60 * 1000);
          end = new Date(endDate.getTime() + kstOffset * 60 * 1000);
        } else {
          return null;
        }
        break;
      case "all":
      default:
        return null; // 전체 기간
    }
    
    // KST 시간을 YYYY-MM-DD HH:MM:SS 형식으로 변환
    const formatKSTDate = (date: Date) => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    
    const result = {
      start: formatKSTDate(start),
      end: formatKSTDate(end)
    };
    
    // 디버깅용 로그
    console.log('[날짜 범위 계산]', {
      timeRange,
      customStart,
      customEnd,
      result,
      kstNow: formatKSTDate(kstNow)
    });
    
    return result;
  };

  // 시간 범위 변경 핸들러
  const handleTimeRangeChange = (newRange: string) => {
    setSelectedTimeRange(newRange as any);
    
    if (newRange === "custom") {
      // 커스텀 날짜 범위 초기화
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const startStr = weekAgo.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];
      
      setStartDate(startStr);
      setEndDate(endStr);
      setCustomDateRange({ start: startStr, end: endStr });
    } else {
      setStartDate("");
      setEndDate("");
      setCustomDateRange({ start: "", end: "" });
    }
  };

  // 커스텀 날짜 적용 핸들러
  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      setCustomDateRange({ start: startDate, end: endDate });
      fetchStatsWithDateRange("custom", startDate, endDate);
    }
  };

  // 날짜 범위에 따른 통계 데이터 가져오기
  const fetchStatsWithDateRange = async (timeRange: string, customStart?: string, customEnd?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 날짜 범위 계산
      const dateRange = getDateRange(timeRange, customStart, customEnd);
      
      // URL 파라미터 구성
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('start_date', dateRange.start);
        params.append('end_date', dateRange.end);
      }

      const queryString = params.toString();
      const urlSuffix = queryString ? `?${queryString}` : '';

      // 병렬로 모든 데이터 요청
      const [
        tokenResponse,
        chatResponse,
        historyResponse
      ] = await Promise.all([
        fetchWithAuth(`/chat/stats/token-usage${urlSuffix}`),
        fetchWithAuth(`/chat/stats/chat-usage${urlSuffix}`),
        fetchWithAuth(`/chat/stats/token-usage-history${urlSuffix}`),
      ]);

      if (!tokenResponse.ok || !chatResponse.ok || !historyResponse.ok) {
        throw new Error(`API 요청 실패: ${chatResponse.status}`);
      }

      // 모든 응답 데이터 파싱
      const [tokenData, chatData, historyData] = await Promise.all([
        tokenResponse.json(),
        chatResponse.json(),
        historyResponse.json()
      ]);

      // 데이터 유효성 검사
      if (!chatData || !Array.isArray(historyData)) {
        throw new Error("응답 데이터 형식이 올바르지 않습니다");
      }

      setChatStats(chatData);
      setTokenUsageHistory(historyData);
      setLastUpdated(new Date());
      
      // 환율 정보도 함께 가져오기
      await fetchExchangeRate();
      
    } catch (error) {
      console.error("통계 데이터 가져오기 실패:", error);
      setError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다."
      );
      toast.error("통계 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllTimeStats = async () => {
    await fetchStatsWithDateRange(selectedTimeRange, customDateRange.start, customDateRange.end);
  };

  useEffect(() => {
    fetchAllTimeStats();
    const intervalId = setInterval(fetchExchangeRate, 3600000);
    return () => clearInterval(intervalId);
  }, []);

  // 시간 범위 변경 시 데이터 새로 가져오기
  useEffect(() => {
    if (selectedTimeRange !== "custom") {
      fetchStatsWithDateRange(selectedTimeRange);
    }
  }, [selectedTimeRange]);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchAllTimeStats} />;
  }

  if (!chatStats || !tokenUsageHistory.length) {
    return (
      <EmptyState
        title="통계 데이터가 없습니다"
        description="아직 수집된 사용량 통계가 없습니다."
        icon={ChartBarIcon}
      />
    );
  }

  // 모델별 토큰 사용량 및 비용 계산
  const modelStats: ModelStatsMap = tokenUsageHistory.reduce(
    (acc: ModelStatsMap, usage) => {
      if (!acc[usage.model]) {
        acc[usage.model] = {
          input_tokens: 0,
          output_tokens: 0,
        };
      }
      acc[usage.model].input_tokens += usage.input_tokens;
      acc[usage.model].output_tokens += usage.output_tokens;
      return acc;
    },
    {}
  );

  // 총 비용 계산 - 정확한 모델명 매칭 로직
  const totalCost = Object.entries(modelStats).reduce(
    (total, [model, stats]) => {
      // 정확한 모델명 매칭
      let pricingKey = null;
      if (model.includes("gemini-2.5-pro")) {
        pricingKey = "gemini-2.5-pro";
      } else if (model.includes("gemini-2.5-flash")) {
        pricingKey = "gemini-2.5-flash";
      }
      
      if (pricingKey) {
        const modelCost = calculateModelCost(pricingKey, stats.input_tokens, stats.output_tokens);
        return total + modelCost;
      }
      return total;
    },
    0
  );

  // 총 토큰 사용량 계산
  const totalInputTokens = Object.values(modelStats).reduce((acc, curr) => acc + curr.input_tokens, 0);
  const totalOutputTokens = Object.values(modelStats).reduce((acc, curr) => acc + curr.output_tokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;

  // 사용자별 데이터 계산
  const userStats = tokenUsageHistory.reduce((acc: any, usage) => {
    if (!acc[usage.user_email]) {
      acc[usage.user_email] = {
        user_email: usage.user_email,
        user_name: usage.user_name,
        input_tokens: 0,
        output_tokens: 0,
        models: {},
      };
    }
    acc[usage.user_email].input_tokens += usage.input_tokens;
    acc[usage.user_email].output_tokens += usage.output_tokens;

    if (!acc[usage.user_email].models[usage.model]) {
      acc[usage.user_email].models[usage.model] = {
        input_tokens: 0,
        output_tokens: 0,
      };
    }
    acc[usage.user_email].models[usage.model].input_tokens += usage.input_tokens;
    acc[usage.user_email].models[usage.model].output_tokens += usage.output_tokens;
    return acc;
  }, {});

  // 가장 많이 사용된 모델
  const mostUsedModel = Object.entries(modelStats)
    .sort(([, a], [, b]) => (b.input_tokens + b.output_tokens) - (a.input_tokens + a.output_tokens))[0];

  // 가장 활발한 사용자
  const mostActiveUser = Object.entries(userStats)
    .sort(([, a], [, b]) => ((b as any).input_tokens + (b as any).output_tokens) - ((a as any).input_tokens + (a as any).output_tokens))[0];

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                토큰 사용량 통계
              </h2>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  예상 총 비용: ₩{convertToKRW(totalCost)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  (${totalCost.toFixed(2)} USD)
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                {lastUpdated && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    마지막 업데이트: {formatRelativeTime(lastUpdated)}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">기간:</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedTimeRange === "7d" && "최근 7일"}
                    {selectedTimeRange === "30d" && "최근 30일"}
                    {selectedTimeRange === "90d" && "최근 90일"}
                    {selectedTimeRange === "all" && "전체 기간"}
                    {selectedTimeRange === "custom" && customDateRange.start && customDateRange.end && 
                      `${customDateRange.start} ~ ${customDateRange.end}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* 날짜 범위 선택 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <option value="7d">최근 7일</option>
                <option value="30d">최근 30일</option>
                <option value="90d">최근 90일</option>
                <option value="all">전체 기간</option>
                <option value="custom">사용자 지정</option>
              </select>
              
              {/* 커스텀 날짜 선택 */}
              {selectedTimeRange === "custom" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                      max={endDate || new Date().toISOString().split('T')[0]}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                      min={startDate}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <button
                    onClick={handleCustomDateApply}
                    disabled={!startDate || !endDate}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    적용
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={fetchAllTimeStats}
              className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 인사이트 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
            TOP 사용자
          </h3>
          {mostActiveUser ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {((mostActiveUser[1] as any).user_name || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {(mostActiveUser[1] as any).user_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(mostActiveUser[1] as any).user_email}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">총 토큰 사용량</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {((mostActiveUser[1] as any).input_tokens + (mostActiveUser[1] as any).output_tokens).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">데이터가 없습니다.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-500" />
            모델 사용 비율
          </h3>
          <div className="space-y-3">
            {Object.entries(modelStats)
              .sort(([, a], [, b]) => (b.input_tokens + b.output_tokens) - (a.input_tokens + a.output_tokens))
              .slice(0, 3)
              .map(([model, stats]) => {
                const percentage = ((stats.input_tokens + stats.output_tokens) / totalTokens) * 100;
                return (
                  <div key={model} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {model}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* 모델별 토큰 사용량 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-5 w-5 text-purple-500" />
              모델별 상세 통계
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "usage" | "cost" | "date")}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="usage">사용량순</option>
                <option value="cost">비용순</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  모델
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  입력 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  출력 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  총 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  예상 비용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사용 비율
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(modelStats)
                .sort(([, a], [, b]) => {
                  if (sortBy === "usage") {
                    return (b.input_tokens + b.output_tokens) - (a.input_tokens + a.output_tokens);
                  } else if (sortBy === "cost") {
                    const costA = calculateModelCost(Object.keys(MODEL_PRICING).find(key => a.toString().includes(key)) || "", a.input_tokens, a.output_tokens);
                    const costB = calculateModelCost(Object.keys(MODEL_PRICING).find(key => b.toString().includes(key)) || "", b.input_tokens, b.output_tokens);
                    return costB - costA;
                  }
                  return 0;
                })
                .map(([model, stats]) => {
                  const pricingKey = Object.keys(MODEL_PRICING).find((key) => model.includes(key));
                  const cost = pricingKey ? calculateModelCost(pricingKey, stats.input_tokens, stats.output_tokens) : 0;
                  const percentage = ((stats.input_tokens + stats.output_tokens) / totalTokens) * 100;

                  return (
                    <tr key={model} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {model}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stats.input_tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {stats.output_tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {(stats.input_tokens + stats.output_tokens).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <span className="font-medium">₩{convertToKRW(cost)}</span>
                          <br />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (${cost.toFixed(2)} USD)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 프로젝트별 통계 */}
      {chatStats?.projects?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-green-500" />
              프로젝트별 통계
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    프로젝트 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    메시지 수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {chatStats?.projects?.map((project) => (
                  <tr key={`${project.project_id}-${project.user_id}`} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {project.project_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {project.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {project.user_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {project.user_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {project.message_count.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 사용자별 토큰 사용량 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
            사용자별 토큰 사용량
          </h3>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  입력 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  출력 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  총 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  예상 비용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사용 비율
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(userStats)
                .sort(([, a], [, b]) => ((b as any).input_tokens + (b as any).output_tokens) - ((a as any).input_tokens + (a as any).output_tokens))
                .map(([email, stats]) => {
                  const userTotal = (stats as any).input_tokens + (stats as any).output_tokens;
                  const userTotalCost = Object.entries((stats as any).models).reduce(
                    (cost, [model, modelStats]) => {
                      const pricingKey = Object.keys(MODEL_PRICING).find((key) => model.includes(key));
                      if (pricingKey) {
                        return cost + calculateModelCost(pricingKey, (modelStats as any).input_tokens, (modelStats as any).output_tokens);
                      }
                      return cost;
                    },
                    0
                  );
                  const userPercentage = (userTotal / totalTokens) * 100;

                  return (
                    <tr key={email} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {((stats as any).user_name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {(stats as any).user_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {(stats as any).user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {((stats as any).input_tokens).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {((stats as any).output_tokens).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                        {userTotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>
                          <span className="font-medium">₩{convertToKRW(userTotalCost)}</span>
                          <br />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (${userTotalCost.toFixed(2)} USD)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${userPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {userPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 토큰 사용 기록 테이블 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            토큰 사용 기록
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  모델
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  입력 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  출력 토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tokenUsageHistory
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((usage, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(usage.timestamp).toLocaleString("ko-KR", {
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Seoul",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {usage.model}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(usage.user_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {usage.user_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {usage.input_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {usage.output_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usage.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {usage.status === "completed" ? "완료" : "처리중"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Overview 데이터 타입 정의
interface UserStats {
  total: number;
  active: number;
  monthly_active: number;
  growth_rate: number;
  new_users_last_month: number;
  active_growth_rate: number;
}

interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  by_plan: {
    FREE: number;
    BASIC: number;
    PREMIUM: number;
  };
  revenue: {
    monthly: {
      BASIC: number;
      PREMIUM: number;
      total: number;
    };
  };
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string;
  profile_image?: string;
  created_at: string;
}

interface ModelUsageStats {
  model_name: string;
  usage_percentage: number;
  total_tokens: number;
}

interface OverviewData {
  user_stats: UserStats;
  subscription_stats: SubscriptionStats;
  recent_users: RecentUser[];
  model_usage_stats: ModelUsageStats[];
}

// Overview 컴포넌트 수정
const Overview: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const navigate = useNavigate();
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchWithAuth } = useApi();

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchWithAuth("/admin/overview");
      const data = await response.json();
      setOverviewData(data);
    } catch (error) {
      console.error("Error fetching overview data:", error);
      setError("통계 데이터를 불러오는데 실패했습니다.");
      toast.error("통계 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 탭이 활성화되었을 때만 데이터 로드 (지연 로딩)
    if (isActive && !overviewData) {
      LoadingOptimizer.delayedLoad(fetchOverviewData, 200);
    }
    
    // 활성 상태에서 5분마다 데이터 갱신
    if (isActive) {
      const interval = setInterval(fetchOverviewData, 300000);
      return () => clearInterval(interval);
    }
  }, [isActive, overviewData]);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error || !overviewData) {
    return <ErrorMessage message={error || "데이터를 불러올 수 없습니다."} onRetry={fetchOverviewData} />;
  }

  const { user_stats, subscription_stats, recent_users, model_usage_stats } = overviewData;

  return (
    <div className="space-y-8">
      {/* 최상단 액션 바 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">서비스 현황</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            마지막 업데이트: {new Date().toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOverviewData}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            새로고침
          </button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 사용자"
          value={user_stats.total.toLocaleString()}
          change={user_stats.growth_rate}
          trend={user_stats.growth_rate >= 0 ? "up" : "down"}
          icon={UserGroupIcon}
          color="blue"
          description="지난달 대비"
        />
        <StatCard
          title="월간 활성 사용자"
          value={user_stats.monthly_active.toLocaleString()}
          change={user_stats.active_growth_rate}
          trend={user_stats.active_growth_rate >= 0 ? "up" : "down"}
          icon={FireIcon}
          color="green"
          description="최근 30일"
        />
        <StatCard
          title="신규 가입자"
          value={user_stats.new_users_last_month.toLocaleString()}
          change={user_stats.growth_rate}
          trend={user_stats.growth_rate >= 0 ? "up" : "down"}
          icon={StarIcon}
          color="purple"
          description="이번 달"
        />
        <StatCard
          title="월간 수익"
          value={`₩${subscription_stats.revenue.monthly.total.toLocaleString()}`}
          icon={BanknotesIcon}
          color="orange"
          description="이번 달 기준"
        />
      </div>

      {/* 구독 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <StatCard
           title="프리미엄 구독자"
           value={subscription_stats.by_plan.PREMIUM}
           icon={SparklesIcon}
           color="primary"
           description="최고 플랜"
         />
        <StatCard
          title="베이직 구독자"
          value={subscription_stats.by_plan.BASIC}
          icon={TagIcon}
          color="blue"
          description="기본 플랜"
        />
        <StatCard
          title="무료 사용자"
          value={subscription_stats.by_plan.FREE}
          icon={UserCircleIcon}
          color="gray"
          description="무료 플랜"
        />
      </div>

      {/* 세부 정보 섹션 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* 최근 가입 사용자 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    최근 가입 사용자
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    최근 10명의 신규 사용자
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/users")}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                전체보기 →
              </button>
            </div>
          </div>
          <div className="p-6">
            {recent_users.length === 0 ? (
              <EmptyState 
                title="신규 사용자 없음" 
                description="최근 가입한 사용자가 없습니다." 
                icon={UserCircleIcon}
              />
            ) : (
              <div className="space-y-4">
                {recent_users.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.full_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        신규
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI 모델 사용량 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <CpuChipIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI 모델 사용량
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    전체 토큰 사용량 기준
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/stats")}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
              >
                상세보기 →
              </button>
            </div>
          </div>
          <div className="p-6">
            {model_usage_stats.length === 0 ? (
              <EmptyState 
                title="사용량 데이터 없음" 
                description="모델 사용량 데이터가 없습니다." 
                icon={CpuChipIcon}
              />
            ) : (
              <div className="space-y-4">
                {model_usage_stats.map((model, index) => (
                  <div key={model.model_name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-purple-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {model.model_name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {model.usage_percentage}%
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {model.total_tokens.toLocaleString()} 토큰
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-purple-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${model.usage_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 액션 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => navigate("/admin/users")}
          className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">사용자 관리</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">사용자 계정 관리</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/subscriptions")}
          className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:border-green-300 dark:hover:border-green-600 group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
              <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">구독 관리</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">구독 및 결제 관리</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/stats")}
          className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
              <PresentationChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">통계 분석</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">상세 통계 보기</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/admin/model-management")}
          className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 hover:border-orange-300 dark:hover:border-orange-600 group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
              <CpuChipIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">모델 관리</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">AI 모델 설정</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

// ApiStatus 컴포넌트 수정
const ApiStatus: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState("gemini");

  const apiStatusUrls = {
    gemini: {
      name: "Gemini",
      url: "https://status.gemini.com",
    },
  };

  return (
    <div className="h-full space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          API 상태 모니터링
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(apiStatusUrls).map(([key, api]) => (
            <button
              key={key}
              onClick={() => setSelectedApi(key)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedApi === key
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {api.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden h-[calc(100vh-12rem)]">
        <div className="h-full">
          <iframe
            src={apiStatusUrls[selectedApi as keyof typeof apiStatusUrls].url}
            className="w-full h-full border-0"
            title={`${apiStatusUrls[selectedApi as keyof typeof apiStatusUrls].name} Status`}
          />
        </div>
      </div>
    </div>
  );
};

// 시스템 헬스 모니터링 컴포넌트
const SystemHealthMonitoring: React.FC = () => {
  const { fetchWithAuth } = useApi();
  const [healthData, setHealthData] = useState<any>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 헬스 데이터 가져오기
  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth("/health/detailed");
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
      }
    } catch (error) {
      console.error("Failed to fetch health data:", error);
      toast.error("헬스 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 메트릭 히스토리 가져오기
  const fetchMetricsHistory = async () => {
    try {
      const response = await fetchWithAuth("/health/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetricsHistory(data.metrics_history || []);
      }
    } catch (error) {
      console.error("Failed to fetch metrics history:", error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchHealthData();
    fetchMetricsHistory();
  }, []);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000); // 30초마다 새로고침

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">시스템 헬스 모니터링</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">서버 성능 및 상태 실시간 모니터링</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">자동 새로고침</span>
          </label>
          <button
            onClick={() => {
              fetchHealthData();
              fetchMetricsHistory();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {loading && !healthData ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : healthData ? (
        <div className="space-y-6">
          {/* 시스템 상태 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="시스템 상태"
              value={healthData.status?.toUpperCase() || "UNKNOWN"}
              icon={HeartIcon}
              color={healthData.status === "healthy" ? "green" : healthData.status === "warning" ? "orange" : "red"}
            />
            <StatCard
              title="메모리 사용률"
              value={`${healthData.metrics?.memory_percent?.toFixed(1) || 0}%`}
              icon={CpuChipIcon}
              color={healthData.metrics?.memory_percent > 80 ? "red" : healthData.metrics?.memory_percent > 60 ? "orange" : "green"}
            />
            <StatCard
              title="CPU 사용률"
              value={`${healthData.metrics?.cpu_percent?.toFixed(1) || 0}%`}
              icon={BoltIcon}
              color={healthData.metrics?.cpu_percent > 80 ? "red" : healthData.metrics?.cpu_percent > 60 ? "orange" : "green"}
            />
            <StatCard
              title="업타임"
              value={`${Math.floor((healthData.metrics?.uptime_seconds || 0) / 3600)}시간`}
              icon={ClockIcon}
              color="blue"
            />
          </div>

          {/* 상세 메트릭 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 시스템 리소스 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ServerIcon className="h-5 w-5 mr-2 text-blue-500" />
                시스템 리소스
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">메모리 사용량</span>
                    <span className="text-gray-900 dark:text-white">
                      {healthData.metrics?.memory_rss?.toFixed(0) || 0}MB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        healthData.metrics?.memory_percent > 80 ? "bg-red-500" : 
                        healthData.metrics?.memory_percent > 60 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(healthData.metrics?.memory_percent || 0, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">디스크 사용량</span>
                    <span className="text-gray-900 dark:text-white">
                      {healthData.metrics?.disk_usage_percent?.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        healthData.metrics?.disk_usage_percent > 90 ? "bg-red-500" : 
                        healthData.metrics?.disk_usage_percent > 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(healthData.metrics?.disk_usage_percent || 0, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">열린 파일</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {healthData.metrics?.open_files || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">스레드 수</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {healthData.metrics?.threads || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 성능 메트릭 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-purple-500" />
                성능 메트릭
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">평균 응답시간</span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {healthData.metrics?.response_time_avg?.toFixed(3) || 0}초
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">에러율</span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {((healthData.metrics?.error_rate || 0) * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">연결 수</span>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {healthData.metrics?.connections || 0}
                  </p>
                </div>
                {healthData.unhealthy_duration > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-800 dark:text-red-200">
                        비정상 상태 지속: {Math.floor(healthData.unhealthy_duration / 60)}분
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 메트릭 히스토리 */}
          {metricsHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChartPieIcon className="h-5 w-5 mr-2 text-green-500" />
                최근 메트릭 히스토리
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">시간</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">메모리</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPU</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">응답시간</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">에러율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {metricsHistory.slice(0, 10).map((metric, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {new Date(metric.timestamp).toLocaleTimeString("ko-KR")}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            metric.memory_percent > 80 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            metric.memory_percent > 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}>
                            {metric.memory_percent?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            metric.cpu_percent > 80 ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" :
                            metric.cpu_percent > 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}>
                            {metric.cpu_percent?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {metric.response_time_avg?.toFixed(3)}초
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">
                          {((metric.error_rate || 0) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="헬스 데이터를 불러올 수 없습니다"
          description="서버 상태 정보를 가져오는데 실패했습니다."
          icon={ExclamationTriangleIcon}
        />
      )}
    </div>
  );
};

// ModelManagement 컴포넌트 수정
const ModelManagement: React.FC = () => {
  const [models, setModels] = useState([
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      provider: "Google",
      version: "2.5",
      group: "advanced_analysis",
      status: "active",
      pricing: { input: 2.5, output: 10.0 },
      supports: ["multimodal", "reasoning"]
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "Google",
      version: "2.5",
      group: "basic_chat",
      status: "active",
      pricing: { input: 0.3, output: 2.5 },
      supports: ["multimodal"]
    }
  ]);

  const groupNames = {
    basic_chat: "기본 대화",
    advanced_analysis: "고급 분석"
  };

  return (
    <div className="h-full space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          AI 모델 관리
        </h2>
      </div>

      {/* 모델 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            활성 모델
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {models.filter(m => m.status === 'active').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            제공업체
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {new Set(models.map(m => m.provider)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            모델 그룹
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {new Set(models.map(m => m.group)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            평균 입력 비용
          </h3>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            ${(models.reduce((sum, m) => sum + m.pricing.input, 0) / models.length).toFixed(2)}
          </p>
        </div>
      </div>

      {/* 모델 목록 테이블 */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            모델 목록
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  모델 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  제공업체
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  그룹
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  가격 ($/1M tokens)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  기능
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {model.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {model.id}
                      </div>
                      <div className="text-xs text-gray-400">
                        v{model.version}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {model.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {groupNames[model.group as keyof typeof groupNames]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div>입력: ${model.pricing.input}</div>
                      <div>출력: ${model.pricing.output}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {model.supports.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      model.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {model.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ApiManagement 컴포넌트 수정
const ApiManagement: React.FC = () => {
  const apiConsoles = [
    {
      name: "Google Gemini",
      description: "Gemini API 설정 및 자격 증명",
      url: "https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/",
    },
  ];

  return (
    <div className="h-full space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          API 관리 콘솔
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apiConsoles.map((api) => (
          <a
            key={api.name}
            href={api.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {api.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {api.description}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

// 채팅 데이터베이스 관리 컴포넌트
// 메시지 상세보기 모달 컴포넌트
const MessageDetailModal: React.FC<{
  message: any;
  isOpen: boolean;
  onClose: () => void;
}> = ({ message, isOpen, onClose }) => {
  if (!isOpen || !message) return null;

  const formatContent = (content: string) => {
    // 기본적인 마크다운 형식 지원
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // 코드 블록 (```로 시작하는 경우)
      if (line.trim().startsWith('```')) {
        return (
          <div key={index} className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {line}
          </div>
        );
      }
      // 링크 형식
      if (line.includes('http')) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = line.split(urlRegex);
        return (
          <p key={index} className="mb-2 leading-relaxed">
            {parts.map((part, i) => 
              urlRegex.test(part) ? (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {part}
                </a>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </p>
        );
      }
      // 일반 텍스트
      return (
        <p key={index} className="mb-2 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            메시지 상세보기
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 메시지 메타데이터 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">사용자 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-20">이름:</span>
                  <span className="text-gray-900 dark:text-white">{message.user_name || "이름 없음"}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-20">이메일:</span>
                  <span className="text-gray-900 dark:text-white">{message.user_email}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-20">역할:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    message.role === "user" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                  }`}>
                    {message.role === "user" ? "사용자" : "AI"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">메시지 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-20">생성일:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(message.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-20">유형:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    message.chat_type === "regular" 
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  }`}>
                    {message.chat_type === "regular" ? "일반" : "프로젝트"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 w-20">방 이름:</span>
                  <span className="text-gray-900 dark:text-white">{message.room_name || "제목 없음"}</span>
                </div>
                {message.project_name && (
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 w-20">프로젝트:</span>
                    <span className="text-purple-600 dark:text-purple-400">{message.project_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 메시지 내용 */}
        <div className="p-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">메시지 내용</h4>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {formatContent(message.content)}
            </div>
          </div>
        </div>

        {/* 첨부파일 */}
        {message.files && message.files.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <PaperClipIcon className="h-5 w-5 mr-2" />
              첨부파일 ({message.files.length}개)
            </h4>
            <div className="space-y-2">
              {message.files.map((file: any, index: number) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name || `파일 ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {file.type || "알 수 없는 형식"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인용 링크 */}
        {message.citations && message.citations.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <LinkIcon className="h-5 w-5 mr-2" />
              인용 링크 ({message.citations.length}개)
            </h4>
            <div className="space-y-3">
              {message.citations.map((citation: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <a 
                      href={citation.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {citation.title || citation.url}
                    </a>
                    {citation.title && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {citation.url}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 토큰 사용량 정보 */}
        {(message.input_tokens || message.output_tokens) && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">토큰 사용량</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {message.input_tokens && (
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-600 dark:text-blue-400">입력 토큰</div>
                  <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                    {message.input_tokens.toLocaleString()}
                  </div>
                </div>
              )}
              {message.output_tokens && (
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-green-600 dark:text-green-400">출력 토큰</div>
                  <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {message.output_tokens.toLocaleString()}
                  </div>
                </div>
              )}
              {message.input_tokens && message.output_tokens && (
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm text-purple-600 dark:text-purple-400">총 토큰</div>
                  <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                    {(message.input_tokens + message.output_tokens).toLocaleString()}
                  </div>
                              </div>
            )}
          </div>
        </div>
      )}

        {/* 닫기 버튼 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatDatabaseManagement: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const { fetchWithAuth } = useApi();
  const [overview, setOverview] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "messages" | "rooms">("overview");
  const [filters, setFilters] = useState({
    chatType: "all", // regular, project, all
    userId: "",
    search: "",
    page: 1,
    limit: 50
  });
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 페이지네이션 관련 상태 추가
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 개요 데이터 가져오기
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth("/admin/chat/overview");
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error("Failed to fetch chat overview:", error);
      toast.error("채팅 개요를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 메시지 데이터 가져오기
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        chat_type: filters.chatType,
        skip: ((filters.page - 1) * filters.limit).toString(),
        limit: filters.limit.toString(),
        ...(filters.userId && { user_id: filters.userId })
      });
      
      const response = await fetchWithAuth(`/admin/chat/messages?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setTotalMessages(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / filters.limit));
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("메시지를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 채팅방 데이터 가져오기
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        chat_type: filters.chatType,
        skip: ((filters.page - 1) * filters.limit).toString(),
        limit: filters.limit.toString(),
        ...(filters.userId && { user_id: filters.userId })
      });
      
      const response = await fetchWithAuth(`/admin/chat/rooms?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
        setTotalRooms(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / filters.limit));
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      toast.error("채팅방을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 사용자 데이터 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth("/admin/chat/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("사용자를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchOverview();
    fetchUsers();
  }, []);

  // 뷰 변경 시 데이터 로드
  useEffect(() => {
    if (activeView === "messages") {
      fetchMessages();
    } else if (activeView === "rooms") {
      fetchRooms();
    }
  }, [activeView, filters]);

  // 필터 변경 핸들러
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // 필터 변경 시 첫 페이지로 리셋
    }));
  };

  // 메시지 컨텐츠 미리보기
  const renderMessagePreview = (content: string) => {
    const preview = content.length > 100 ? content.substring(0, 100) + "..." : content;
    return (
      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {preview}
      </div>
    );
  };

  // 메시지 상세보기 모달 열기
  const openMessageModal = (message: any) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  // 메시지 상세보기 모달 닫기
  const closeMessageModal = () => {
    setSelectedMessage(null);
    setIsModalOpen(false);
  };

  // 페이지네이션 핸들러
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === "overview"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            개요
          </button>
          <button
            onClick={() => setActiveView("messages")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === "messages"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            메시지
          </button>
          <button
            onClick={() => setActiveView("rooms")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === "rooms"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            채팅방
          </button>
        </nav>
      </div>

      {/* 개요 뷰 */}
      {activeView === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 일반 채팅 통계 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-500" />
                일반 채팅
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 채팅방</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {overview?.regular_chat?.total_rooms || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 메시지</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {overview?.regular_chat?.total_messages || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">활성 사용자</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {overview?.regular_chat?.total_users || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">최근 24시간</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {overview?.regular_chat?.recent_messages || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* 프로젝트 채팅 통계 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FolderIcon className="h-5 w-5 mr-2 text-purple-500" />
                프로젝트 채팅
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 채팅방</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {overview?.project_chat?.total_rooms || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 메시지</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {overview?.project_chat?.total_messages || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">활성 사용자</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {overview?.project_chat?.total_users || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">최근 24시간</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {overview?.project_chat?.recent_messages || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-green-500" />
              채팅 사용자 현황
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      일반 채팅방
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      프로젝트
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      총 활동
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.slice(0, 10).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || "이름 없음"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          {user.regular_rooms}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                          {user.project_rooms}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          {user.regular_rooms + user.project_rooms}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 뷰 */}
      {activeView === "messages" && (
        <div className="space-y-4">
          {/* 필터 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  채팅 유형
                </label>
                <select
                  value={filters.chatType}
                  onChange={(e) => handleFilterChange("chatType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">전체</option>
                  <option value="regular">일반 채팅</option>
                  <option value="project">프로젝트 채팅</option>
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  사용자 필터
                </label>
                <select
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">전체 사용자</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 메시지 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="메시지가 없습니다"
                  description="선택한 필터에 해당하는 메시지가 없습니다."
                  icon={DocumentTextIcon}
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {messages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        message.role === "user" ? "bg-blue-500" : "bg-green-500"
                      }`}>
                        {message.role === "user" ? "U" : "A"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {message.user_name || "이름 없음"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {message.user_email}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              message.chat_type === "regular" 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            }`}>
                              {message.chat_type === "regular" ? "일반" : "프로젝트"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(message.created_at).toLocaleString("ko-KR")}
                          </span>
                        </div>
                        <div className="mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {message.room_name || "제목 없음"}
                          </span>
                          {message.project_name && (
                            <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                              ({message.project_name})
                            </span>
                          )}
                        </div>
                        {renderMessagePreview(message.content)}
                        {message.files && message.files.length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <PaperClipIcon className="h-3 w-3 mr-1" />
                              첨부파일 {message.files.length}개
                            </div>
                          </div>
                        )}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              인용 {message.citations.length}개
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => openMessageModal(message)}
                            className="px-3 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                          >
                            <EyeIcon className="h-3 w-3" />
                            <span>자세히 보기</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* 메시지 페이지네이션 */}
            {!loading && messages.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={filters.limit}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  totalItems={totalMessages}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 채팅방 뷰 */}
      {activeView === "rooms" && (
        <div className="space-y-4">
          {/* 필터 */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  채팅 유형
                </label>
                <select
                  value={filters.chatType}
                  onChange={(e) => handleFilterChange("chatType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">전체</option>
                  <option value="regular">일반 채팅</option>
                  <option value="project">프로젝트 채팅</option>
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  사용자 필터
                </label>
                <select
                  value={filters.userId}
                  onChange={(e) => handleFilterChange("userId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">전체 사용자</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 채팅방 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {loading ? (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="채팅방이 없습니다"
                  description="선택한 필터에 해당하는 채팅방이 없습니다."
                  icon={FolderIcon}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        채팅방
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        유형
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        메시지 수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        생성일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {rooms.map((room) => (
                      <tr key={room.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {room.name || "제목 없음"}
                            </div>
                            {room.project_name && (
                              <div className="text-xs text-purple-600 dark:text-purple-400">
                                프로젝트: {room.project_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {room.user_name || "이름 없음"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {room.user_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            room.chat_type === "regular" 
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          }`}>
                            {room.chat_type === "regular" ? "일반" : "프로젝트"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {room.message_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(room.created_at).toLocaleDateString("ko-KR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* 채팅방 페이지네이션 */}
            {!loading && rooms.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={filters.limit}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  totalItems={totalRooms}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메시지 상세보기 모달 */}
      <MessageDetailModal
        message={selectedMessage}
        isOpen={isModalOpen}
        onClose={closeMessageModal}
      />
    </div>
  );
};

export default AdminPage;
