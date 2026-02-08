import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../utils/api";

const FindPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await auth.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail;
      setError(
        typeof errorMessage === "string"
          ? errorMessage
          : "비밀번호 재설정 이메일을 보내는데 실패했습니다. 입력하신 정보를 다시 확인해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/50 p-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-200">
                비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을
                확인해주세요.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 sm:text-sm transition-colors"
              placeholder="이메일을 입력해주세요"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-primary-400 dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus:ring-primary-400 dark:disabled:bg-primary-400 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {loading ? "전송 중..." : "비밀번호 재설정 링크 전송"}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <Link
              to="/auth/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FindPassword;
