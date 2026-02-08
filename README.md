# SungbLab AI 프로젝트 문서

SungbLab AI는 교육적 편의성과 업무 효율을 극대화하기 위해 설계된 인공지능 기반 풀스택 플랫폼입니다. 본 프로젝트는 최신 AI 모델(Gemini)과의 연동, 브라우저 환경에서의 코드 실행(Pyodide), 그리고 벡터 데이터베이스(PGVector)를 활용한 지능형 데이터 처리를 핵심으로 합니다.

---

## 1. 아키텍처 개요

본 시스템은 분리된 프론트엔드와 백엔드로 구성된 Client-Server 아키텍처를 따릅니다.

- 프론트엔드: React 기반의 SPA(Single Page Application)로, Vite를 통해 최적화된 빌드 환경을 제공합니다. 사용자 경험을 위해 복잡한 상태 관리와 실시간 렌더링(Markdown, LaTeX, Mermaid)을 지원합니다.
- 백엔드: FastAPI를 활용한 비동기 API 서버입니다. PostgreSQL과 SQLAlchemy를 사용하여 데이터를 관리하며, Redis와 Celery를 이용해 비동기 작업 및 캐싱을 처리합니다.
- AI 엔진: Google의 Gemini API를 주력으로 사용하며, PGVector를 통한 시맨틱 검색 기능을 갖추고 있습니다.

---

## 2. 세부 기술 스택

### 프론트엔드 엔지니어링 (Frontend)

- 핵심 프레임워크: React 18.2, TypeScript
- 빌드 도구: Vite 7.1
- 상태 관리 및 컨텍스트: React Context API (Auth, Theme, Layout, Project, Subscription)
- UI/UX 시스템:
  - 스타일링: Tailwind CSS 3.3, Emotion 11 (MUI와의 결합)
  - 컴포넌트: Radix UI, Headless UI, Heroicons, Lucide React
  - 알림: React Hot Toast
- 편집기 및 렌더링:
  - Code Editor: Monaco Editor (@monaco-editor/react)
  - 컨텐츠 렌더링: React Markdown, rehype-katex (수식), Mermaid (다이어그램)
  - 실행 환경: Pyodide (브라우저 내 Python 런타임)
- 데이터 통신: Axios (인터셉터를 통한 인증 토큰 처리)

### 백엔드 엔지니어링 (Backend)

- 핵심 프레임워크: FastAPI (Asynchronous Server Gateway Interface)
- 언어: Python 3.10+
- 데이터베이스 시스템:
  - 메인 DB: PostgreSQL
  - 벡터 엔진: PGVector (문서 임베딩 및 유사도 검색용)
  - ORM: SQLAlchemy 2.0
- 분산 태스크 및 캐시:
  - 메시지 브로커: Redis
  - 작업 큐: Celery
- 보안 및 인증:
  - 인증 방식: OAuth2 Password Flow (JWT - Access/Refresh Tokens)
  - 비밀번호 암호화: Passlib (Bcrypt)
- 외부 서비스:
  - AI SDK: Google Generative AI (Gemini)
  - 이메일: Jinja2 템플릿 기반 이메일 발송 시스템

### 인프라 및 운영 (Infrastructure)

- 모니터링:
  - 성능 및 상태: Prometheus Client, Health Monitor
  - 에러 로그: Sentry SDK
- 가상화: Docker, Docker Compose
- CI/CD 및 배포: Vercel (Frontend), Dockerized environments (Backend)

---

## 3. 핵심 기능 상세

### 서비스형 AI 채팅 (Advanced Chat System)

- 대화 스트리밍: 실시간 텍스트 생성 응답 지원
- 멀티 모달 및 렌더링: 코드 하이라이팅, 수학 공식(LaTeX), 순서도(Mermaid) 렌더링 지원
- 컨텍스트 유지: 프로젝트 단위의 대화 기록 및 컨텍스트 관리

### 교육 특화 도우미 (Educational Helpers)

- 과제 수행 도우미 (Assignment Helper): 학생의 학습 목표에 맞춘 단계별 가이드라인 생성 및 학습 자료 분석 지원
- 생활기록부 도우미 (Student Record Helper): 관찰 기록을 바탕으로 교육부 지침에 부합하는 학생별 핵심 역량 및 행동 특성 초안 작성

### 코드 실행 및 에디터 (Interactive Environment)

- 웹 플레이그라운드: HTML, CSS, Javascript 실시간 편집 및 미리보기 기능
- 데이터 과학 환경: Pyodide를 이용해 별도의 서버 설치 없이 브라우저 단에서 Pandas, Numpy 등을 활용한 Python 코드 실행 지원

### 관리 시스템 (Admin & Ops)

- 실시간 리소스 모니터링: 서버 메모리 사용량 및 API 응답 속도 실시간 추적
- 사용자 및 구독 관리: 구독 등급별 AI 모델 접근 권한 제어 및 사용량 통계 제공

---

## 4. 프로젝트 구조

### 프론트엔드 (Sungblab_AI_frontend)

- src/api: Axios 인스턴스 및 서비스별 API 호출 로직 (v1/v2 대응)
- src/components: 아토믹 디자인을 지향하는 공통 UI 및 복합 컴포넌트
- src/contexts: 어플리케이션 전역 상태(사용자 인증, 구독 정보 등) 관리자
- src/hooks: 비즈니스 로직 캡슐화를 위한 Custom Hooks (useChat, useProject 등)
- src/pages: 라우팅에 매핑되는 주요 페이지 뷰 (ChatPage, EditorPage 등)
- src/types: TypeScript 인터페이스 및 타입 정의

### 백엔드 (Sungblab_AI_backend)

- app/api: RESTful API 엔드포인트 라우터 정의
- app/core: 환경 설정(Config), 보안(Security), 로깅, 에러 핸들링 등 핵심 모듈
- app/crud: 데이터베이스 CRUD(Create, Read, Update, Delete) 핵심 로직
- app/db: 데이터베이스 세션 관리 및 초기화(Initialization)
- app/models: SQLAlchemy 데이테베이스 테이블 모델
- app/schemas: 데이터 검증 및 직렬화를 위한 Pydantic 모델
- app/utils: 공통 유틸리티 (파일명 정규화, 시간대 처리 등)

---

## 5. 실행 및 설정 방법

### 환경 변수 설정

프론트엔드 및 백엔드 루트 폴더의 `.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필수 값(API_KEY, DATABASE_URL 등)을 입력해야 합니다.

### 프론트엔드 설치 및 실행

1. 의존성 설치: npm install
2. 개발 서버 실행: npm run dev
3. 배포용 빌드: npm run build

### 백엔드 설치 및 실행

1. 가상환경 생성: python -m venv venv
2. 의존성 설치: pip install -r requirements.txt
3. 서버 실행: uvicorn app.main:app --reload

---

## 6. 라이선스 정보

본 프로젝트는 MIT 라이선스 하에 배포됩니다. 상세 내용은 라이선스 파일을 참조하십시오.
