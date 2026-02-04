# Taemindang

React 프론트엔드와 Node.js 백엔드로 구성된 프로젝트입니다.

## 프로젝트 구조

```
taemindang/
├── frontend/          # React 프론트엔드 (Vite)
├── backend/           # Node.js 백엔드 (Express)
└── README.md
```

## 기술 스택

### Frontend
- React 18
- Vite
- Axios

### Backend
- Node.js
- Express
- CORS
- dotenv
- MySQL2

## 시작하기

### 1. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 `http://localhost:3000`에서 실행됩니다.

### 2. 백엔드 실행

```bash
cd backend
npm install
npm run dev
```

백엔드는 `http://localhost:5000`에서 실행됩니다.

## 환경 변수

백엔드 `.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=new_project
DB_CHARSET=utf8mb4
```

`.env.example` 파일을 참고하세요.

## 데이터베이스 설정

프로젝트는 MySQL 데이터베이스를 사용합니다. 다음 정보로 설정되어 있습니다:

| 항목       | 값             |
| -------- | ------------- |
| host     | `127.0.0.1`   |
| port     | `3306`        |
| user     | `root`        |
| password | `1234`        |
| database | `new_project` |
| charset  | `utf8mb4`     |

서버 시작 시 자동으로 데이터베이스 연결을 테스트합니다.

## Figma MCP

이 프로젝트는 Figma MCP(Model Context Protocol)를 사용하여 디자인과 코드를 연결할 수 있습니다.

## 개발 가이드

- 프론트엔드와 백엔드를 별도 터미널에서 실행해야 합니다.
- API 요청은 `/api` 경로를 통해 프록시됩니다.
