# SungbLab AI

SungbLab AI는 인공지능 기반의 교육 및 업무 지원 플랫폼입니다. 다양한 AI 모델과의 대화, 프로젝트 관리, 그리고 코드 실행 환경을 제공하여 사용자의 생산성을 극대화합니다.

## 프로젝트 개요

이 프로젝트는 현대적인 웹 기술을 활용하여 구축된 풀스택 어플리케이션으로, AI와의 상호작용뿐만 아니라 교육 현장에서 유용한 과제 도우미, 생활기록부 작성 도우미 등 특화된 기능을 제공합니다.

---

## 🛠 기술 스택

### Frontend

- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Material UI (MUI), Emotion
- **State Management**: React Context API
- **UI Components**: Radix UI, Headless UI, Lucide React (Icons)
- **Editor & Rendering**:
  - Monaco Editor (Code Editing)
  - React Markdown & KaTeX (Mathematical Formulas)
  - Mermaid (Diagrams)
  - Pyodide (In-browser Python Execution)
- **Data Visualization**: Chart.js

### Backend

- **Framework**: FastAPI (Python)
- **Database**:
  - PostgreSQL (Relational Data)
  - PGVector (Vector Similarity Search for AI)
- **ORM**: SQLAlchemy
- **Caching & Task Queue**: Redis, Celery
- **AI Integration**: Google GenAI (Gemini)
- **Security**: JWT (JSON Web Tokens), OAuth2 (Google Login), Bcrypt

### Infrastructure & DevOps

- **Deployment**: Vercel (Frontend), Docker & Docker Compose (Backend)
- **Monitoring**: Prometheus, Sentry
- **Version Control**: Git

---

## ✨ 주요 기능

### 1. 지능형 채팅 시스템 (AI Chat)

- 다양한 AI 모델과의 실시간 스트리밍 대화 지원
- Markdown, KaTeX(수식), Mermaid(다이어그램) 렌더링 지원
- 코드 하이라이팅 및 에디터 연동

### 2. 교육 특화 도우미 (specialized Helpers)

- **과제 도우미 (Assignment Helper)**: 학생들의 과제 수행을 돕는 단계별 안내 및 정보 제공
- **생활기록부 도우미 (Student Record Helper)**: 교사를 위한 학생 관찰 기록 및 생활기록부 초안 작성 지원

### 3. 코드 플레이그라운드 (Code Playground)

- **HTML/JS Editor**: 실시간 미리보기가 가능한 웹 개발 환경
- **Python Canvas**: Pyodide를 활용하여 브라우저 내에서 별도의 서버 없이 Python 코드 실행 및 시각화

### 4. 프로젝트 관리 (Project Management)

- 작업 단위별 프로젝트 생성 및 관리
- 프로젝트별 대화 내역 및 자료 저장

### 5. 관리자 대시보드 (Admin Dashboard)

- 사용자 관리 및 구독 상태 확인
- 시스템 헬스 체크 및 API 상태 모니터링
- 통계 분석 및 AI 모델 설정 관리

---

## 📂 프로젝트 구조

### Frontend (`Sungblab_AI_frontend`)

- `src/api`: API 호출 관련 모듈
- `src/components`: 재사용 가능한 UI 컴포넌트
- `src/contexts`: 전역 상태 관리를 위한 Context Providers
- `src/pages`: 주요 서비스 화면 (Chat, Editor, Helper 등)
- `src/types`: TypeScript 타입 정의
- `src/utils`: 유틸리티 함수 및 헬퍼

### Backend (`Sungblab_AI_backend`)

- `app/api`: API 엔드포인트 및 라우터 정보
- `app/core`: 설정(Config), 보안, 로깅 등 핵심 로직
- `app/db`: 데이터베이스 세션 및 초기화
- `app/models`: SQLAlchemy 데이터베이스 모델
- `app/schemas`: Pydantic 데이터 검증 스키마
- `app/crud`: CRUD 작업 로직

---

## 🚀 시작하기

### Prerequisites

- Node.js (v18+) & Desktop
- Python 3.10+
- PostgreSQL & Redis (Docker 환경 권장)

### Frontend 실행

```bash
cd Sungblab_AI_frontend
npm install
npm run dev
```

### Backend 실행

```bash
cd Sungblab_AI_backend
# 가상환경 생성 및 활성화
python -m venv venv
# Windows: venv\Scripts\activate
# Unix/MacOS: source venv/bin/activate
pip install -r requirements.txt

# .env 설정 후 서버 실행
uvicorn app.main:app --reload
```

---

## 📝 라이선스

이 프로젝트는 MIT License를 따릅니다.
