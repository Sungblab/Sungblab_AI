import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../utils/api";
import axios from "axios";
import { useGoogleLogin, TokenResponse } from "@react-oauth/google";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // 이전 페이지가 있으면 그곳으로, 없으면 홈으로 이동
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await auth.login(email, password, rememberMe);
      if (response.access_token && response.refresh_token) {
        // 사용자 정보를 명시적으로 가져와서 로그인 처리
        const userData = await auth.getCurrentUser(response.access_token);
        login(response.access_token, response.refresh_token, userData, response.expires_in);
        const from = (location.state as any)?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else {
          const errorMessage = error.response.data.detail;
          setError(
            typeof errorMessage === "string"
              ? errorMessage
              : "로그인 중 오류가 발생했습니다."
          );
        }
      } else {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (response: TokenResponse) => {
      try {
        setIsLoading(true);
        setError("");
        const { access_token, refresh_token, expires_in } = await auth.googleLogin(
          response.access_token
        );
        const userData = await auth.getCurrentUser(access_token);
        login(access_token, refresh_token, userData, expires_in);
        // 이전 페이지가 있으면 그곳으로, 없으면 홈으로 이동
        const from = (location.state as any)?.from?.pathname || "/";
        navigate(from, { replace: true });
      } catch (error: any) {
        console.error("Google 로그인 에러:", error);
        if (error.response?.data?.detail) {
          const errorDetail = error.response.data.detail;
          setError(
            typeof errorDetail === "string"
              ? errorDetail
              : JSON.stringify(errorDetail)
          );
        } else {
          setError(
            "구글 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("구글 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* 왼쪽 섹션 - 브랜딩 */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        <div className="max-w-md w-full relative z-10">
          <h1 className="text-5xl font-bold tracking-tight mb-16">
            Sungblab AI
          </h1>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold leading-tight">
              AI와 함께
              <br />더 나은 교육을
              <br />
              만들어가세요
            </h2>
            <p className="text-xl text-primary-100/90">
              인공지능 기술로 교육의 새로운 가치를 창출합니다
            </p>
          </div>
        </div>
      </div>

      {/* 오른쪽 섹션 - 로그인 폼 */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center mb-10"></div>

        <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Sungblab AI 로그인
            </h2>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  이메일
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors"
                  placeholder="이메일을 입력하세요"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors"
                    placeholder="비밀번호를 입력하세요"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 transition-colors"
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  로그인 상태 유지
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/auth/find-password"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus:ring-primary-400 dark:disabled:bg-primary-400 shadow-sm hover:shadow-md transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인하기"}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                  또는
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              <img
                src="/google-logo-square.png"
                alt="Google"
                className="w-8 h-8"
              />
              <span className="text-base font-medium text-gray-700 dark:text-white">
                구글 계정으로 로그인
              </span>
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              아직 회원이 아니신가요?{" "}
              <Link
                to="/auth/register"
                className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                회원가입하기
              </Link>
            </p>

            <div className="text-xs text-center text-gray-600 dark:text-gray-400">
              계속 진행하시면{" "}
              <Link
                to="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                이용약관
              </Link>
              에 동의하고,{" "}
              <Link
                to="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              >
                개인정보 처리방침
              </Link>
              을 확인하신 것으로 간주됩니다.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
