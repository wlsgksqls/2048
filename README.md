# testq — 2048 퍼즐 게임

React + Vite로 만든 간단한 **2048** 퍼즐 게임입니다. 로비 / 인게임 / 설정 세 화면으로 구성되어 있습니다.

## 화면

- **로비**: 게임 시작, 설정 진입, 최고 점수 표시
- **인게임**: N×N 보드, 현재 점수 / 최고 점수, 다시하기, 승리·패배 오버레이
- **설정**: 보드 크기(3×3 / 4×4 / 5×5), 테마(라이트 / 다크), 승리 목표값, 최고 점수 초기화

설정과 최고 점수는 `localStorage`에 저장되어 새로고침해도 유지됩니다.

## 조작

- **PC**: 화살표 키 또는 `WASD`
- **모바일**: 스와이프

## 실행

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 구조

```
src/
├── main.jsx                # React 진입점
├── App.jsx                 # 화면 전환 + SettingsProvider
├── styles.css              # 전역 스타일 + 라이트/다크 테마 변수
├── game/gameLogic.js       # 순수 함수 게임 로직 (슬라이드/머지/판정)
├── context/SettingsContext.jsx  # 설정 상태 + localStorage 영속
├── hooks/useGame.js        # 보드 상태, 점수, 키보드/스와이프 입력
└── screens/                # Lobby / Game / Settings
```
