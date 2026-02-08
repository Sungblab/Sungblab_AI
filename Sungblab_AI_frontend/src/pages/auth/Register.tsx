import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../utils/api";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 실시간 유효성 검사
    if (name === "email") {
      setValidationErrors((prev) => ({
        ...prev,
        email: validateEmail(value) ? "" : "유효한 이메일 형식이 아닙니다",
      }));
    }
    if (name === "password") {
      setValidationErrors((prev) => ({
        ...prev,
        password: validatePassword(value)
          ? ""
          : "비밀번호는 8자 이상이어야 합니다",
      }));
    }
  };

  const handleSendVerification = async () => {
    if (!validateEmail(formData.email)) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "유효한 이메일 형식이 아닙니다",
      }));
      return;
    }

    try {
      setIsLoading(true);
      await auth.sendVerificationEmail(formData.email);
      setShowVerificationInput(true);
      setVerificationError("");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setVerificationError(
          error.response.data.detail || "이메일 전송에 실패했습니다."
        );
      } else {
        setVerificationError("이메일 전송 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsLoading(true);
      await auth.verifyEmail(formData.email, verificationCode);
      setIsEmailVerified(true);
      setShowVerificationInput(false);
      setVerificationError("");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setVerificationError(
          error.response.data.detail || "인증에 실패했습니다."
        );
      } else {
        setVerificationError("인증 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!isEmailVerified) {
      setError("이메일 인증이 필요합니다.");
      setIsLoading(false);
      return;
    }

    // 폼 제출 시 유효성 검사
    if (!validateEmail(formData.email)) {
      setError("유효한 이메일 형식이 아닙니다");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("비밀번호는 8자 이상이어야 합니다");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    try {
      // 회원가입 API 호출
      await auth.signup({
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
      });

      // 회원가입 성공 후 자동 로그인
      const response = await auth.login(formData.email, formData.password);
      login(response.access_token, response.refresh_token, response.user, response.expires_in);
      navigate("/");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.detail || "회원가입에 실패했습니다.");
      } else {
        setError("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Sungblab AI 회원가입
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
            이미 계정이 있으신가요?{" "}
            <Link
              to="/auth/login"
              className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              로그인하기
            </Link>
          </p>
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                이메일
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border ${
                      validationErrors.email
                        ? "border-red-300 dark:border-red-600"
                        : "border-gray-300 dark:border-gray-600"
                    } bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors`}
                    placeholder="이메일을 입력해주세요"
                    disabled={isLoading || isEmailVerified}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isLoading || isEmailVerified || !formData.email}
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {isEmailVerified ? "인증완료" : "인증하기"}
                </button>
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.email}
                </p>
              )}
              {showVerificationInput && !isEmailVerified && (
                <div className="mt-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="인증번호 6자리 입력"
                      className="flex-1 block rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isLoading || !verificationCode}
                      className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400"
                    >
                      확인
                    </button>
                  </div>
                  {verificationError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {verificationError}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                이름
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors"
                placeholder="이름을 입력해주세요"
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
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`block w-full rounded-lg border ${
                  validationErrors.password
                    ? "border-red-300 dark:border-red-600"
                    : "border-gray-300 dark:border-gray-600"
                } bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors`}
                placeholder="비밀번호를 입력해주세요"
                disabled={isLoading}
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {validationErrors.password}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors"
                placeholder="비밀번호를 다시 입력해주세요"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus:ring-primary-400 dark:disabled:bg-primary-400 shadow-sm hover:shadow-md transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "회원가입 중..." : "회원가입"}
            </button>
          </div>

          <div className="text-sm text-center text-gray-600 dark:text-gray-400">
            회원가입 시{" "}
            <Link
              to="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              이용약관
            </Link>{" "}
            및{" "}
            <Link
              to="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              개인정보처리방침
            </Link>
            에 동의하게 됩니다.
          </div>
        </form>
      </div>
    </div>
  );
}
