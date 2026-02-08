import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../../utils/api";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("유효하지 않은 토큰입니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await auth.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (err: any) {
      if (typeof err.response?.data?.detail === "object") {
        setError(
          err.response?.data?.detail?.msg || "비밀번호 재설정에 실패했습니다."
        );
      } else {
        setError(
          err.response?.data?.detail || "비밀번호 재설정에 실패했습니다."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              잘못된 접근
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            새 비밀번호 설정
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            새로운 비밀번호를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/50 p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-200">
                비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로
                이동합니다.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                새 비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                새 비밀번호 확인
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                required
                disabled={loading}
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400"
          >
            {loading ? "처리 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
