export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

export function getDateRange(period: string, type: string) {
  let startDate = new Date();
  let endDate = new Date();

  if (type === "MONTHLY") {
    const [year, month] = period.split("-");
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    startDate = new Date(y, m, 1);
    endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
  } else if (type === "QUARTERLY") {
    const [year, quarter] = period.split("-");
    const y = parseInt(year, 10);
    const q = quarter.toUpperCase();
    let startMonth = 0;
    if (q === "Q1") startMonth = 0;
    else if (q === "Q2") startMonth = 3;
    else if (q === "Q3") startMonth = 6;
    else if (q === "Q4") startMonth = 9;

    startDate = new Date(y, startMonth, 1);
    endDate = new Date(y, startMonth + 3, 0, 23, 59, 59, 999);
  } else if (type === "ANNUAL") {
    const y = parseInt(period, 10);
    startDate = new Date(y, 0, 1);
    endDate = new Date(y, 12, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
}
