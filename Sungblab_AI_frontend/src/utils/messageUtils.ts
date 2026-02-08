import * as math from "mathjs";

// 수식 처리를 위한 유틸리티 함수
export const processMathExpression = (expression: string) => {
  try {
    // LaTeX 문법을 mathjs가 이해할 수 있는 형식으로 변환
    const cleanExpression = expression
      .replace(/\\frac{([^}]*)}{([^}]*)}/, "($1)/($2)")
      .replace(/\\cdot/g, "*")
      .replace(/\\times/g, "*");

    // 수식 계산
    const result = math.evaluate(cleanExpression);

    // 결과를 LaTeX 형식으로 반환
    return {
      result,
      latex: math.parse(result.toString()).toTex(),
      error: null,
    };
  } catch (error) {
    console.error("Math processing error:", error);
    return {
      result: null,
      latex: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// 도메인 추출 함수
export const extractDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// 파일 아이콘 타입 결정
export const getFileIcon = (type: string): { iconType: 'image' | 'document'; color: string } => {
  if (type.startsWith("image/")) {
    return { iconType: 'image', color: 'text-red-500' };
  }
  return { iconType: 'document', color: 'text-red-500' };
};

// 텍스트 토큰화 함수
export const tokenizeText = (content: string) => {
  const tokens = [];
  let currentText = "";
  let i = 0;

  while (i < content.length) {
    if (content.startsWith("\\[", i)) {
      const endIndex = content.indexOf("\\]", i);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        const mathContent = content.slice(i + 2, endIndex).trim();
        const processedMath = processMathExpression(mathContent);
        tokens.push({
          type: "math-block",
          content: mathContent,
          result: processedMath.result,
          latex: processedMath.latex,
        });
        i = endIndex + 2;
        continue;
      }
    } else if (content.startsWith("```latex", i)) {
      // LaTeX 코드 블록을 수식 블록으로 처리
      const endIndex = content.indexOf("```", i + 3);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        tokens.push({
          type: "math-block",
          content: content.slice(i + 8, endIndex).trim(),
        });
        i = endIndex + 3;
        continue;
      }
    } else if (content.startsWith("```html", i)) {
      // HTML 코드 블록 처리
      const endIndex = content.indexOf("```", i + 7);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        tokens.push({
          type: "html-artifact",
          content: content.slice(i + 7, endIndex).trim(),
        });
        i = endIndex + 3;
        continue;
      }
    } else if (content.startsWith("```svg", i)) {
      // SVG 코드 블록 처리
      const endIndex = content.indexOf("```", i + 6);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        tokens.push({
          type: "svg-artifact",
          content: content.slice(i + 6, endIndex).trim(),
        });
        i = endIndex + 3;
        continue;
      }
    } else if (content.startsWith("```mermaid", i)) {
      // Mermaid 다이어그램 처리
      const endIndex = content.indexOf("```", i + 10);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        tokens.push({
          type: "mermaid-diagram",
          content: content.slice(i + 10, endIndex).trim(),
        });
        i = endIndex + 3;
        continue;
      }
    } else if (content.startsWith("```css", i)) {
      // CSS 코드 블록 처리 (아티팩트로)
      const endIndex = content.indexOf("```", i + 6);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        const cssContent = content.slice(i + 6, endIndex).trim();
        if (cssContent.length > 50) { // 최소 50자 이상일 때만 아티팩트로 처리
          tokens.push({
            type: "css-artifact",
            content: cssContent,
          });
        } else {
          tokens.push({
            type: "code",
            language: "css",
            content: cssContent,
          });
        }
        i = endIndex + 3;
        continue;
      }
    } else if (content.startsWith("```javascript", i) || content.startsWith("```js", i)) {
      // JavaScript 코드 블록 처리 (아티팩트로)
      const langLength = content.startsWith("```javascript", i) ? 13 : 5;
      const endIndex = content.indexOf("```", i + langLength);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        const jsContent = content.slice(i + langLength, endIndex).trim();
        if (jsContent.length > 50) { // 최소 50자 이상일 때만 아티팩트로 처리
          tokens.push({
            type: "js-artifact",
            content: jsContent,
          });
        } else {
          tokens.push({
            type: "code",
            language: "javascript",
            content: jsContent,
          });
        }
        i = endIndex + 3;
        continue;
      }
    } else if (content.startsWith("```", i)) {
      const endIndex = content.indexOf("```", i + 3);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        // 언어 식별자 처리
        const firstNewline = content.indexOf("\n", i + 3);
        const language =
          firstNewline !== -1
            ? content.slice(i + 3, firstNewline).trim()
            : "";
        const codeContent =
          firstNewline !== -1
            ? content.slice(firstNewline + 1, endIndex)
            : content.slice(i + 3, endIndex);

        tokens.push({
          type: "code",
          language,
          content: codeContent,
        });
        i = endIndex + 3;
        continue;
      }
    } else if (content.startsWith("---", i)) {
      // 구분선 처리
      if (currentText) {
        tokens.push({ type: "text", content: currentText });
        currentText = "";
      }
      tokens.push({ type: "divider" });
      i += 3;
      continue;
    } else if (content.startsWith("### ", i)) {
      // h3 헤더 처리
      if (currentText) {
        tokens.push({ type: "text", content: currentText });
        currentText = "";
      }
      const lineEnd = content.indexOf("\n", i);
      const headerContent =
        lineEnd === -1
          ? content.slice(i + 4)
          : content.slice(i + 4, lineEnd);
      tokens.push({
        type: "header3",
        content: headerContent,
      });
      i = lineEnd === -1 ? content.length : lineEnd + 1;
      continue;
    } else if (content.startsWith("$$", i)) {
      // 블록 수식 처리
      const endIndex = content.indexOf("$$", i + 2);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        tokens.push({
          type: "math-block",
          content: content.slice(i + 2, endIndex),
        });
        i = endIndex + 2;
        continue;
      }
    } else if (
      content.startsWith("$", i) &&
      !content.startsWith("$$", i)
    ) {
      // 인라인 수식 처리
      const endIndex = content.indexOf("$", i + 1);
      if (endIndex !== -1) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        const mathContent = content.slice(i + 1, endIndex);
        const processedMath = processMathExpression(mathContent);
        tokens.push({
          type: "math-inline",
          content: mathContent,
          result: processedMath.result,
          latex: processedMath.latex,
        });
        i = endIndex + 1;
        continue;
      }
    } else if (content.startsWith("## ", i)) {
      // 헤더 처리
      if (currentText) {
        tokens.push({ type: "text", content: currentText });
        currentText = "";
      }
      const lineEnd = content.indexOf("\n", i);
      const lineContent =
        lineEnd === -1
          ? content.slice(i + 3)
          : content.slice(i + 3, lineEnd);
      tokens.push({
        type: "header",
        content: lineContent,
      });
      i = lineEnd === -1 ? content.length : lineEnd + 1;
      continue;
    } else if (content.startsWith("**", i)) {
      // 볼드 텍스트 처리 개선
      const endIndex = content.indexOf("**", i + 2);
      if (endIndex !== -1) {
        // 현재 텍스트에서 마지막 공백 제거
        if (currentText.trim()) {
          tokens.push({ type: "text", content: currentText.trimEnd() });
        }
        currentText = "";

        // 볼드 콘텐츠 처리
        const boldContent = content.slice(i + 2, endIndex);
        tokens.push({
          type: "bold",
          content: boldContent,
        });

        i = endIndex + 2;
        continue;
      }
    } else if (content.startsWith("[", i)) {
      // 인용 번호 처리
      const match = content.slice(i).match(/^\[(\d+)\]/);
      if (match) {
        if (currentText) {
          tokens.push({ type: "text", content: currentText });
          currentText = "";
        }
        tokens.push({
          type: "citation",
          number: parseInt(match[1]),
        });
        i += match[0].length;
        continue;
      }
    }

    currentText += content[i];
    i++;
  }

  if (currentText) {
    tokens.push({ type: "text", content: currentText });
  }

  return tokens;
};

// 안정적인 블록 ID 생성 함수
export const generateBlockId = (code: string, language: string): string => {
  return `code-${language}-${code
    .substring(0, 20)
    .replace(/\s+/g, "-")}`;
};

// 복합 아티팩트 결합 함수
export const combineArtifacts = (tokens: any[]): any[] => {
  const combinedTokens: any[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    // HTML + CSS + JS 복합 아티팩트 감지
    if (token.type === "html-artifact") {
      const relatedArtifacts = [token];
      let j = i + 1;

      // 다음 몇 개 토큰에서 관련 CSS/JS 찾기 (최대 3개 토큰까지)
      while (j < tokens.length && j < i + 4) {
        const nextToken = tokens[j];
        if (nextToken.type === "css-artifact" || nextToken.type === "js-artifact") {
          relatedArtifacts.push(nextToken);
          tokens.splice(j, 1); // 결합된 토큰 제거
          continue;
        } else if (nextToken.type === "text" && nextToken.content.trim().length < 10) {
          // 짧은 텍스트는 건너뛰기
          j++;
        } else {
          break;
        }
      }

      if (relatedArtifacts.length > 1) {
        // 복합 아티팩트 생성
        const htmlContent = relatedArtifacts.find(a => a.type === "html-artifact")?.content || "";
        const cssContent = relatedArtifacts.find(a => a.type === "css-artifact")?.content || "";
        const jsContent = relatedArtifacts.find(a => a.type === "js-artifact")?.content || "";

        combinedTokens.push({
          type: "composite-artifact",
          content: htmlContent,
          css: cssContent,
          javascript: jsContent,
          components: relatedArtifacts.length
        });
      } else {
        combinedTokens.push(token);
      }
    } else if (token.type === "css-artifact" || token.type === "js-artifact") {
      // HTML 없이 CSS/JS만 있는 경우
      const relatedArtifacts = [token];
      let j = i + 1;

      while (j < tokens.length && j < i + 3) {
        const nextToken = tokens[j];
        if ((token.type === "css-artifact" && nextToken.type === "js-artifact") ||
            (token.type === "js-artifact" && nextToken.type === "css-artifact")) {
          relatedArtifacts.push(nextToken);
          tokens.splice(j, 1);
          break;
        }
        j++;
      }

      if (relatedArtifacts.length > 1) {
        const cssContent = relatedArtifacts.find(a => a.type === "css-artifact")?.content || "";
        const jsContent = relatedArtifacts.find(a => a.type === "js-artifact")?.content || "";

        // 기본 HTML 템플릿 생성
        const htmlTemplate = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS & JavaScript Demo</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; }
        .demo-container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>CSS & JavaScript Demo</h1>
        <div id="demo-content">
            <p>이 페이지는 제공된 CSS와 JavaScript를 적용한 데모입니다.</p>
        </div>
    </div>
</body>
</html>`;

        combinedTokens.push({
          type: "composite-artifact",
          content: htmlTemplate,
          css: cssContent,
          javascript: jsContent,
          components: relatedArtifacts.length
        });
      } else {
        combinedTokens.push(token);
      }
    } else {
      combinedTokens.push(token);
    }

    i++;
  }

  return combinedTokens;
}; 