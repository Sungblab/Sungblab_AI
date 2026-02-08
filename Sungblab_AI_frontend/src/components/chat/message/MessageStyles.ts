// MessageBubble과 관련 컴포넌트들의 스타일 정의
const initializeMessageStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* 아티팩트 컨테이너 스타일 */
.artifact-container {
  width: 100%;
  min-height: 50px;
  max-height: none;
  overflow: auto;
}

.artifact-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.artifact-container::-webkit-scrollbar-track {
  background: transparent;
}

.artifact-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

.artifact-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* SVG 아티팩트 스타일 */
.artifact-container svg {
  max-width: 100%;
  height: auto;
  max-height: 80vh;
  display: block;
  margin: 0 auto;
}

/* 반응형 SVG */
@media (max-width: 640px) {
  .artifact-container svg {
    max-height: 60vh;
  }
}

/* 프린트 미디어용 스타일 */
@media print {
  .artifact-container {
    max-height: none !important;
    overflow: visible !important;
  }
  
  .artifact-container svg {
    max-height: none !important;
    page-break-inside: avoid;
  }
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .artifact-container::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.8);
  }
}

/* 애니메이션 감소 선호 시 */
@media (prefers-reduced-motion: reduce) {
  .artifact-container {
    scroll-behavior: auto;
  }
  
  .artifact-container * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* HTML 아티팩트 내부 요소 스타일 */
.artifact-container * {
  max-width: 100%;
}
`;

  if (!document.head.querySelector('style[data-message-styles]')) {
    style.setAttribute('data-message-styles', 'true');
    document.head.appendChild(style);
  }
};

export default initializeMessageStyles;