export const TEST_COMPOSITE_ARTIFACT = `
다음은 HTML, CSS, JavaScript를 조합한 복합 아티팩트 테스트입니다:

\`\`\`html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>복합 아티팩트 테스트</title>
</head>
<body>
    <div class="container">
        <h1 id="title">복합 아티팩트 데모</h1>
        <button id="colorBtn" class="demo-button">색상 변경</button>
        <div class="info-box">
            <p>이것은 HTML + CSS + JavaScript가 결합된 복합 아티팩트입니다.</p>
        </div>
    </div>
</body>
</html>
\`\`\`

\`\`\`css
.container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
    color: white;
    text-align: center;
}

#title {
    margin-bottom: 2rem;
    font-size: 2.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
}

.demo-button {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 12px 24px;
    font-size: 1.1rem;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.demo-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.info-box {
    margin-top: 2rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}
\`\`\`

\`\`\`javascript
document.addEventListener('DOMContentLoaded', function() {
    const title = document.getElementById('title');
    const colorBtn = document.getElementById('colorBtn');
    
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    
    let currentColorIndex = 0;
    
    colorBtn.addEventListener('click', function() {
        currentColorIndex = (currentColorIndex + 1) % colors.length;
        document.querySelector('.container').style.background = colors[currentColorIndex];
        
        title.style.transform = 'scale(1.1)';
        setTimeout(() => {
            title.style.transform = 'scale(1)';
        }, 200);
        
        // 버튼 텍스트 업데이트
        colorBtn.textContent = \`색상 변경 (\${currentColorIndex + 1}/\${colors.length})\`;
    });
    
    // 초기 설정
    colorBtn.textContent = \`색상 변경 (1/\${colors.length})\`;
});
\`\`\`

위의 코드들이 자동으로 복합 아티팩트로 결합되어 하나의 인터랙티브한 데모로 표시되어야 합니다.
`;

export const TEST_CSS_ONLY = `
CSS만 있는 예제:

\`\`\`css
.beautiful-card {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    padding: 2rem;
    border-radius: 15px;
    color: white;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    transition: transform 0.3s ease;
}

.beautiful-card:hover {
    transform: translateY(-5px);
}

.card-title {
    font-size: 2rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
\`\`\`
`;

export const TEST_JS_ONLY = `
JavaScript만 있는 예제:

\`\`\`javascript
function createAnimatedCounter() {
    let count = 0;
    const display = document.createElement('div');
    display.style.cssText = \`
        font-size: 3rem;
        font-weight: bold;
        color: #333;
        text-align: center;
        padding: 2rem;
        border: 3px solid #007bff;
        border-radius: 10px;
        background: linear-gradient(45deg, #f0f8ff, #e6f3ff);
        cursor: pointer;
        transition: all 0.3s ease;
    \`;
    
    display.textContent = count;
    display.addEventListener('click', () => {
        count++;
        display.textContent = count;
        display.style.transform = 'scale(1.1)';
        setTimeout(() => display.style.transform = 'scale(1)', 150);
    });
    
    document.body.appendChild(display);
    return display;
}

// 카운터 생성
createAnimatedCounter();
\`\`\`
`;