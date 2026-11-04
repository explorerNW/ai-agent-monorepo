export function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const formatTimestamp = (timestamp: Date): string => {
  const date = timestamp;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  // const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

export const dateCheck = (fromDate: Date, toDate: Date): Record<string, any> => {
  const fromDay = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );
  const toDay = new Date(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate(),
  );
  const dayDiff = Math.round(
    (toDay.getTime() - fromDay.getTime()) / (24 * 60 * 60 * 1000),
  );
  const isRecentOneDay = dayDiff <= 1;

  return { fromDay,  toDay, dayDiff, isRecentOneDay};
};
