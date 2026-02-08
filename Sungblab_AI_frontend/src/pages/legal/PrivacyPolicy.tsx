import React from "react";
import Header from "../../components/layout/Header";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            개인정보처리방침
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Sungblab AI(이하 '회사')는 개인정보보호법에 따라 이용자의 개인정보
              보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게
              처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              1. 수집하는 개인정보의 항목
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              회사는 회원가입, 서비스 제공 등을 위해 다음과 같은 개인정보를
              수집합니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">
                <span className="font-medium">필수항목:</span>
                <ul className="list-circle pl-6 mt-2">
                  <li>이메일 주소</li>
                  <li>이름</li>
                  <li>비밀번호</li>
                </ul>
              </li>
              <li className="mb-2">
                <span className="font-medium">
                  서비스 이용 과정에서 생성되는 정보:
                </span>
                <ul className="list-circle pl-6 mt-2">
                  <li>프로젝트 및 학습 데이터</li>
                  <li>채팅 기록</li>
                  <li>서비스 이용 기록</li>
                  <li>접속 로그</li>
                </ul>
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              2. 개인정보의 처리 목적
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
              개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용
              목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의
              동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">회원 가입 및 관리</li>
              <li className="mb-2">서비스 제공 및 운영</li>
              <li className="mb-2">서비스 이용 현황 통계 분석</li>
              <li className="mb-2">서비스 개선 및 개발</li>
              <li className="mb-2">안전한 서비스 제공을 위한 보안 강화</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              3. 개인정보의 처리 및 보유기간
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
              개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
              개인정보를 처리·보유합니다.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">회원 가입 정보: 회원 탈퇴 시까지</li>
              <li className="mb-2">
                프로젝트 및 학습 데이터: 프로젝트 삭제 시까지
              </li>
              <li className="mb-2">채팅 기록: 대화 종료 후 3개월</li>
              <li className="mb-2">접속 기록: 3개월</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              4. 개인정보의 안전성 확보 조치
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
              있습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">비밀번호의 암호화 저장</li>
              <li className="mb-2">접속 기록의 보관 및 위조/변조 방지</li>
              <li className="mb-2">보안 프로그램의 설치 및 주기적 점검/갱신</li>
              <li className="mb-2">개인정보에 대한 접근 권한 제한</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              5. 정보주체의 권리·의무 및 행사방법
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
              권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">개인정보 열람 요구</li>
              <li className="mb-2">오류 등이 있을 경우 정정 요구</li>
              <li className="mb-2">삭제 요구</li>
              <li className="mb-2">처리정지 요구</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              6. 개인정보 보호책임자
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
              처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
              같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                개인정보 보호책임자
                <br />
                이름 : 김 성 빈
                <br />
                이메일: support@sungblab.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
