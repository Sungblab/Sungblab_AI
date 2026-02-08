import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

type ReportStep = "content" | "html" | "preview" | "complete";

interface ReportState {
  step: ReportStep;
  content?: string;
  htmlContent?: string;
  isPreviewOpen: boolean;
}

interface ReportContextType {
  reportState: ReportState;
  setReportStep: (step: ReportStep) => void;
  setContent: (content: string) => void;
  setHtmlContent: (html: string) => void;
  setPreviewOpen: (isOpen: boolean) => void;
  resetReport: () => void;
}

// 로컬 스토리지 키
const REPORT_STORAGE_KEY = "report_state";

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [reportState, setReportState] = useState<ReportState>({
    step: "content",
    content: "",
    htmlContent: "",
    isPreviewOpen: false,
  });

  // 초기 로드 시 로컬 스토리지에서 상태 복원
  useEffect(() => {
    const savedState = localStorage.getItem(REPORT_STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setReportState(parsedState);
      } catch (error) {
        console.error("저장된 보고서 상태 복원 오류:", error);
      }
    }
  }, []);

  // 상태 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportState));
  }, [reportState]);

  const setReportStep = (step: ReportStep) => {
    setReportState((prev) => ({ ...prev, step }));
  };

  const setContent = (content: string) => {
    setReportState((prev) => ({ ...prev, content }));
  };

  const setHtmlContent = (html: string) => {
    setReportState((prev) => ({ ...prev, htmlContent: html }));
  };

  const setPreviewOpen = (isOpen: boolean) => {
    setReportState((prev) => ({ ...prev, isPreviewOpen: isOpen }));
  };

  const resetReport = () => {
    setReportState({
      step: "content",
      content: "",
      htmlContent: "",
      isPreviewOpen: false,
    });
    // 리셋 시 로컬 스토리지도 초기화
    localStorage.removeItem(REPORT_STORAGE_KEY);
  };

  return (
    <ReportContext.Provider
      value={{
        reportState,
        setReportStep,
        setContent,
        setHtmlContent,
        setPreviewOpen,
        resetReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error("useReport must be used within a ReportProvider");
  }
  return context;
};
