import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./components/auth/AdminRoute";
import { Toaster } from "react-hot-toast";
import { ReportProvider } from "./contexts/ReportContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { HelmetProvider } from "react-helmet-async";

// 동적 import로 코드 스플리팅
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const FindPassword = lazy(() => import("./pages/auth/FindPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AssignmentHelper = lazy(() => import("./pages/AssignmentHelper"));
const StudentRecordHelper = lazy(() => import("./pages/StudentRecordHelper"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const HtmlEditorPage = lazy(() => import("./pages/HtmlEditorPage"));
const PyodideCanvasTest = lazy(() => import("./pages/PyodideCanvasTest"));

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <ReportProvider>
            <ProjectProvider>
              <ThemeProvider>
                <LayoutProvider>
              <Router>
                <Suspense 
                  fallback={
                    <div className="flex items-center justify-center min-h-screen">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                  }
                >
                  <Routes>
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  <Route
                    path="/auth/find-password"
                    element={<FindPassword />}
                  />
                  <Route
                    path="/auth/reset-password"
                    element={<ResetPassword />}
                  />
                  <Route path="/legal/terms" element={<TermsOfService />} />
                  <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                  {/* 메인 채팅 페이지는 모든 사용자 접근 가능 */}
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/chat/:chatId" element={<ChatPage />} />
                  {/* HTML 에디터 페이지 */}
                  <Route
                    path="/html-editor"
                    element={
                      <PrivateRoute>
                        <HtmlEditorPage />
                      </PrivateRoute>
                    }
                  />
                  {/* Pyodide Canvas 테스트 페이지 (개발 모드) */}
                  {import.meta.env.DEV && (
                    <Route path="/test/pyodide-canvas" element={<PyodideCanvasTest />} />
                  )}
                  {/* 프로젝트 관련 페이지들은 인증 필요 */}
                  <Route
                    path="/assignment"
                    element={
                      <PrivateRoute>
                        <AssignmentHelper />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/assignment/:projectId/chat/:chatId"
                    element={
                      <PrivateRoute>
                        <AssignmentHelper />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/student-record"
                    element={
                      <PrivateRoute>
                        <StudentRecordHelper />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/student-record/:projectId/chat/:chatId"
                    element={
                      <PrivateRoute>
                        <StudentRecordHelper />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/subscriptions"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/stats"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                              <Route
              path="/admin/chat-database"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
                  <Route
                    path="/admin/api-status"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />{" "}
                  <Route
                    path="/admin/api-management"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/model-management"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/system-health"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                    <Route path="*" element={<Navigate to="/chat" replace />} />
                  </Routes>
                </Suspense>
                <Toaster position="top-right" />
              </Router>
                </LayoutProvider>
              </ThemeProvider>
            </ProjectProvider>
          </ReportProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
