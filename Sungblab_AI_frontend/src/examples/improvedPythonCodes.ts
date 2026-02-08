export const IMPROVED_PYTHON_CODES = {
  koreanSafeExample: `
import matplotlib.pyplot as plt
import numpy as np

# 한글 폰트 문제를 해결하는 방법 1: 영어 레이블 사용
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')
plt.xlabel('X Value')  # 영어 사용
plt.ylabel('Y Value')  # 영어 사용
plt.title('Sine Function Graph')  # 영어 사용
plt.legend()
plt.grid(True)
plt.show()

print("그래프 생성 완료!")  # 한글은 print에서는 정상 작동
`,

  unicodeAlternative: `
import matplotlib.pyplot as plt
import numpy as np

# 한글 폰트 문제를 해결하는 방법 2: 유니코드 이스케이프
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

plt.figure(figsize=(12, 6))
plt.plot(x, y1, 'b-', linewidth=2, label='sin(x)')
plt.plot(x, y2, 'r-', linewidth=2, label='cos(x)')

# ASCII 아트로 한글 표현 대신 영어+기호 사용
plt.xlabel('X --> ')
plt.ylabel('Y |')
plt.title('Trigonometric Functions')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

# 한글 결과는 print로 출력 (여기는 정상 작동)
print("=== 삼각함수 분석 결과 ===")
print(f"sin(π/2) = {np.sin(np.pi/2):.4f}")
print(f"cos(π/2) = {np.cos(np.pi/2):.4f}")
`,

  mermaidFlowchart: `
graph TD
    A[시작] --> B{데이터 있음?}
    B -->|예| C[데이터 처리]
    B -->|아니오| D[데이터 로드]
    C --> E[분석 수행]
    D --> E
    E --> F[결과 시각화]
    F --> G[보고서 작성]
    G --> H[완료]
    
    style A fill:#e1f5fe
    style H fill:#c8e6c9
    style B fill:#fff3e0
`,

  mermaidSequence: `
sequenceDiagram
    participant User as 사용자
    participant UI as 웹 인터페이스
    participant API as API 서버
    participant DB as 데이터베이스
    
    User->>UI: 코드 입력
    UI->>API: 실행 요청
    API->>DB: 결과 저장
    DB-->>API: 저장 완료
    API-->>UI: 실행 결과
    UI-->>User: 결과 표시
    
    Note over User,DB: 파이썬 코드 실행 과정
`,

  mermaidGantt: `
gantt
    title AI 프로젝트 개발 일정
    dateFormat  YYYY-MM-DD
    section 기획
    요구사항 분석    :done,    des1, 2024-01-01, 2024-01-05
    설계             :done,    des2, 2024-01-06, 2024-01-12
    section 개발
    프론트엔드       :active,  dev1, 2024-01-13, 2024-02-10
    백엔드           :         dev2, 2024-01-20, 2024-02-15
    AI 모델          :         dev3, 2024-01-25, 2024-02-20
    section 테스트
    단위 테스트      :         test1, 2024-02-16, 2024-02-25
    통합 테스트      :         test2, 2024-02-26, 2024-03-05
`,

  dataVisualizationSafe: `
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# 안전한 데이터 시각화 (영어 레이블 사용)
data = {
    'Product': ['A', 'B', 'C', 'D', 'E'],
    'Sales': [23, 45, 56, 78, 32],
    'Revenue': [230, 450, 560, 780, 320]
}

df = pd.DataFrame(data)

# 서브플롯 생성
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# 막대 그래프
bars = ax1.bar(df['Product'], df['Sales'], 
               color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
ax1.set_title('Sales by Product', fontsize=14, fontweight='bold')
ax1.set_xlabel('Product')
ax1.set_ylabel('Sales Volume')
ax1.grid(True, alpha=0.3)

# 막대 위에 값 표시
for bar in bars:
    height = bar.get_height()
    ax1.annotate(f'{height}',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3),  # 3 points vertical offset
                textcoords="offset points",
                ha='center', va='bottom')

# 파이 차트
colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
wedges, texts, autotexts = ax2.pie(df['Revenue'], labels=df['Product'], 
                                   autopct='%1.1f%%', startangle=90,
                                   colors=colors, explode=(0.05, 0, 0, 0, 0))
ax2.set_title('Revenue Distribution', fontsize=14, fontweight='bold')

# 파이 차트 텍스트 스타일링
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontweight('bold')

plt.tight_layout()
plt.show()

# 한글 출력은 print로 (정상 작동)
print("\\n=== 데이터 분석 결과 ===")
print("제품별 판매 현황:")
for i, row in df.iterrows():
    print(f"제품 {row['Product']}: 판매량 {row['Sales']}, 수익 {row['Revenue']}")

print(f"\\n총 판매량: {df['Sales'].sum()}")
print(f"총 수익: {df['Revenue'].sum()}")
print(f"평균 판매량: {df['Sales'].mean():.1f}")
`,

  plotlyInteractive: `
# Plotly를 사용한 인터랙티브 시각화 (한글 문제 없음)
import plotly.graph_objects as go
import plotly.express as px
import numpy as np
import pandas as pd

# 데이터 생성
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)
y3 = np.sin(x) * np.cos(x)

# 인터랙티브 라인 차트
fig = go.Figure()

fig.add_trace(go.Scatter(x=x, y=y1, mode='lines', name='sin(x)', 
                        line=dict(color='blue', width=2)))
fig.add_trace(go.Scatter(x=x, y=y2, mode='lines', name='cos(x)', 
                        line=dict(color='red', width=2)))
fig.add_trace(go.Scatter(x=x, y=y3, mode='lines', name='sin(x)×cos(x)', 
                        line=dict(color='green', width=2)))

fig.update_layout(
    title='Interactive Trigonometric Functions',
    xaxis_title='X Value',
    yaxis_title='Y Value',
    hovermode='x unified',
    template='plotly_white'
)

# HTML로 저장하여 표시
fig.write_html("/tmp/plotly_chart.html")
print("인터랙티브 차트가 생성되었습니다!")

# 3D 시각화
df = pd.DataFrame({
    'x': np.random.randn(100),
    'y': np.random.randn(100),
    'z': np.random.randn(100),
    'category': np.random.choice(['A', 'B', 'C'], 100)
})

fig_3d = px.scatter_3d(df, x='x', y='y', z='z', color='category',
                       title='3D Scatter Plot')
fig_3d.write_html("/tmp/plotly_3d.html")
print("3D 차트도 생성되었습니다!")
`
};

export const MERMAID_EXAMPLES = {
  flowchart: IMPROVED_PYTHON_CODES.mermaidFlowchart,
  sequence: IMPROVED_PYTHON_CODES.mermaidSequence,
  gantt: IMPROVED_PYTHON_CODES.mermaidGantt,
  
  classdiagram: `
classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    
    class ChatRoom {
        +String id
        +String title
        +Date created
        +addMessage()
        +deleteMessage()
    }
    
    class Message {
        +String content
        +Date timestamp
        +String type
        +render()
    }
    
    class PythonExecution {
        +String code
        +Object result
        +execute()
        +captureOutput()
    }
    
    User ||--o{ ChatRoom : owns
    ChatRoom ||--o{ Message : contains
    Message ||--|| PythonExecution : executes
`,

  erdiagram: `
erDiagram
    USER ||--o{ CHAT_ROOM : creates
    CHAT_ROOM ||--o{ MESSAGE : contains
    MESSAGE ||--o| PYTHON_EXECUTION : executes
    MESSAGE ||--o{ FILE_ATTACHMENT : includes
    
    USER {
        string id PK
        string name
        string email
        datetime created_at
    }
    
    CHAT_ROOM {
        string id PK
        string title
        string user_id FK
        datetime created_at
    }
    
    MESSAGE {
        string id PK
        string content
        string type
        string chat_room_id FK
        datetime timestamp
    }
    
    PYTHON_EXECUTION {
        string id PK
        string code
        text output
        text error
        string message_id FK
    }
`
};

export const getRandomImprovedCode = (): string => {
  const codes = Object.values(IMPROVED_PYTHON_CODES);
  return codes[Math.floor(Math.random() * codes.length)];
};