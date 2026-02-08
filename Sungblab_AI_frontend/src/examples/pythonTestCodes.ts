export const PYTHON_TEST_CODES = {
  basicPlot: `
import matplotlib.pyplot as plt
import numpy as np

# 기본 그래프 예제
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure(figsize=(10, 6))
plt.plot(x, y, 'b-', linewidth=2, label='sin(x)')
plt.xlabel('X 값')
plt.ylabel('Y 값')
plt.title('사인 함수 그래프')
plt.legend()
plt.grid(True)
plt.show()
`,

  dataVisualization: `
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# 데이터 생성
data = {
    '제품': ['A', 'B', 'C', 'D', 'E'],
    '판매량': [23, 45, 56, 78, 32],
    '수익': [230, 450, 560, 780, 320]
}

df = pd.DataFrame(data)

# 서브플롯 생성
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

# 막대 그래프
ax1.bar(df['제품'], df['판매량'], color='skyblue')
ax1.set_title('제품별 판매량')
ax1.set_ylabel('판매량')

# 파이 차트
ax2.pie(df['수익'], labels=df['제품'], autopct='%1.1f%%', startangle=90)
ax2.set_title('제품별 수익 비율')

plt.tight_layout()
plt.show()

# 데이터 요약 출력
print("데이터 요약:")
print(df.describe())
`,

  advancedAnalysis: `
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats
import seaborn as sns

# 고급 데이터 분석 예제
np.random.seed(42)
n_samples = 1000

# 정규분포 데이터 생성
data1 = np.random.normal(100, 15, n_samples)
data2 = np.random.normal(120, 20, n_samples)

# 데이터프레임 생성
df = pd.DataFrame({
    'Group_A': data1,
    'Group_B': data2
})

# 통계 분석
t_stat, p_value = stats.ttest_ind(data1, data2)

print(f"T-검정 결과:")
print(f"t-통계량: {t_stat:.4f}")
print(f"p-값: {p_value:.4f}")
print(f"유의수준 0.05에서 {'통계적으로 유의함' if p_value < 0.05 else '통계적으로 유의하지 않음'}")

# 시각화
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 히스토그램
axes[0,0].hist(data1, alpha=0.7, label='Group A', bins=30, color='skyblue')
axes[0,0].hist(data2, alpha=0.7, label='Group B', bins=30, color='lightcoral')
axes[0,0].set_title('분포 비교')
axes[0,0].legend()

# 박스플롯
axes[0,1].boxplot([data1, data2], labels=['Group A', 'Group B'])
axes[0,1].set_title('박스플롯 비교')

# Q-Q 플롯
stats.probplot(data1, dist="norm", plot=axes[1,0])
axes[1,0].set_title('Group A Q-Q Plot')

# 산점도
axes[1,1].scatter(data1[:100], data2[:100], alpha=0.6)
axes[1,1].set_xlabel('Group A')
axes[1,1].set_ylabel('Group B')
axes[1,1].set_title('상관관계 (처음 100개 샘플)')

plt.tight_layout()
plt.show()

# 기초 통계량
print("\\n기초 통계량:")
print(df.describe())
`,

  machinelearning: `
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

# 가상의 데이터 생성 (집 크기와 가격)
np.random.seed(42)
house_sizes = np.random.uniform(50, 300, 100)  # 50-300 평방미터
noise = np.random.normal(0, 10, 100)
house_prices = 2.5 * house_sizes + 50 + noise  # 가격 = 2.5 * 크기 + 50 + 노이즈

# 데이터 분할
X_train, X_test, y_train, y_test = train_test_split(
    house_sizes.reshape(-1, 1), house_prices, test_size=0.2, random_state=42
)

# 선형 회귀 모델 훈련
model = LinearRegression()
model.fit(X_train, y_train)

# 예측
y_pred = model.predict(X_test)

# 성능 평가
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"모델 성능:")
print(f"평균 제곱 오차: {mse:.2f}")
print(f"R² 점수: {r2:.4f}")
print(f"회귀 계수: {model.coef_[0]:.2f}")
print(f"절편: {model.intercept_:.2f}")

# 시각화
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.scatter(X_train, y_train, alpha=0.6, label='훈련 데이터')
plt.scatter(X_test, y_test, alpha=0.6, label='테스트 데이터', color='red')
plt.plot(X_test, y_pred, color='green', linewidth=2, label='예측 선')
plt.xlabel('집 크기 (평방미터)')
plt.ylabel('가격 (만원)')
plt.title('주택 가격 예측 모델')
plt.legend()

plt.subplot(1, 2, 2)
plt.scatter(y_test, y_pred, alpha=0.6)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', linewidth=2)
plt.xlabel('실제 가격')
plt.ylabel('예측 가격')
plt.title('실제 vs 예측 가격')

plt.tight_layout()
plt.show()

# 새로운 집 크기에 대한 가격 예측
new_house_size = 150
predicted_price = model.predict([[new_house_size]])
print(f"\\n{new_house_size}평방미터 집의 예상 가격: {predicted_price[0]:.2f}만원")
`,

  errorHandling: `
import matplotlib.pyplot as plt
import numpy as np

try:
    # 정상적인 그래프 생성
    x = np.linspace(0, 10, 100)
    y = np.sin(x)
    
    plt.figure(figsize=(8, 6))
    plt.plot(x, y, 'b-', linewidth=2)
    plt.title('에러 핸들링 테스트 - 정상 실행')
    plt.xlabel('X')
    plt.ylabel('sin(X)')
    plt.grid(True)
    plt.show()
    
    print("그래프가 성공적으로 생성되었습니다!")
    
    # 의도적으로 에러 발생시키기 (주석 해제 시)
    # undefined_variable = some_undefined_var
    
except Exception as e:
    print(f"오류가 발생했습니다: {e}")
    print("하지만 프로그램은 계속 실행됩니다.")

# 간단한 계산
result = 2 + 2
print(f"2 + 2 = {result}")
`
};

export const getRandomTestCode = (): string => {
  const codes = Object.values(PYTHON_TEST_CODES);
  return codes[Math.floor(Math.random() * codes.length)];
};

export const getTestCodeByName = (name: keyof typeof PYTHON_TEST_CODES): string => {
  return PYTHON_TEST_CODES[name];
};