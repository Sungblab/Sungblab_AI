export const TEST_MERMAID_CODE = `
간단한 Mermaid 다이어그램 테스트입니다:

\`\`\`mermaid
graph TD
    A[시작] --> B{선택}
    B -->|옵션1| C[처리1]
    B -->|옵션2| D[처리2]
    C --> E[완료]
    D --> E
\`\`\`

위의 다이어그램이 정상적으로 표시되나요?

좀 더 복잡한 예제:

\`\`\`mermaid
sequenceDiagram
    participant A as 사용자
    participant B as 브라우저
    participant C as 서버
    
    A->>B: 요청
    B->>C: API 호출
    C-->>B: 응답
    B-->>A: 결과 표시
\`\`\`

클래스 다이어그램:

\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    
    class Dog {
        +String breed
        +bark()
    }
    
    Animal <|-- Dog
\`\`\`
`;

export const SIMPLE_MERMAID = `
\`\`\`mermaid
graph LR
    A --> B --> C
\`\`\`
`;