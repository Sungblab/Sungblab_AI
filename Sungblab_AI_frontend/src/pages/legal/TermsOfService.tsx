import React from "react";
import Header from "../../components/layout/Header";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            이용약관
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              제 1 조 (목적)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              이 약관은 Sungblab AI(이하 "회사")가 제공하는 모든 서비스(이하
              "서비스")의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및
              책임사항을 규정함을 목적으로 합니다.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              제 2 조 (용어의 정의)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              이 약관에서 사용하는 용어의 정의는 다음과 같습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">
                "서비스"란 회사가 제공하는 AI 기반 교육 지원 서비스, 학습 자료
                생성 및 관리 서비스, 교육 컨텐츠 제공 서비스 등을 의미합니다.
              </li>
              <li className="mb-2">
                "회원"이란 회사와 서비스 이용계약을 체결하고 회사가 제공하는
                서비스를 이용하는 개인 또는 법인을 말합니다.
              </li>
              <li className="mb-2">
                "이용자"란 회사의 서비스를 이용하는 회원 및 비회원을 말합니다.
              </li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              제 3 조 (약관의 효력 및 변경)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게
              공지함으로써 효력이 발생합니다.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을
              개정할 수 있습니다.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              제 4 조 (서비스의 제공 및 변경)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              1. 회사는 다음과 같은 서비스를 제공합니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">AI 기반 교육 지원 서비스</li>
              <li className="mb-2">학습 자료 생성 및 관리 서비스</li>
              <li className="mb-2">교육 컨텐츠 제공 서비스</li>
              <li className="mb-2">채팅 기반 학습 지원 서비스</li>
              <li className="mb-2">프로젝트 관리 서비스</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              제 5 조 (회원가입 및 계정 관리)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              1. 회원가입은 이용자가 회사가 정한 양식에 따라 필요한 정보를
              기입하고, 이 약관에 동의한 후 회사가 승인함으로써 완료됩니다.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              2. 회원은 등록한 정보에 변경이 있는 경우, 즉시 회사가 정한 방법에
              따라 정보를 수정해야 합니다.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              3. 회사는 다음과 같은 경우 회원가입을 거부하거나 회원자격을 정지
              또는 상실시킬 수 있습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">타인의 정보를 도용한 경우</li>
              <li className="mb-2">서비스의 운영을 고의로 방해한 경우</li>
              <li className="mb-2">법령 또는 이 약관을 위반한 경우</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
              제 6 조 (서비스 이용 제한)
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              회사는 다음과 같은 경우 서비스 이용을 제한할 수 있습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6">
              <li className="mb-2">
                시스템 정기점검, 증설 및 교체를 위해 필요한 경우
              </li>
              <li className="mb-2">
                서비스 이용의 폭주로 서비스 제공에 지장이 있는 경우
              </li>
              <li className="mb-2">
                정전, 제반 설비의 장애 또는 이용량의 폭주 등으로 정상적인 서비스
                이용에 지장이 있는 경우
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
