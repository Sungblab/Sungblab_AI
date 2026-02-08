export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
