import moment from "moment";

export function formatDate(date: Date): string {
  date = new Date(date);
  const dateWithTimezone = moment(date).utcOffset(9);
  // - 여러 Table 등에서 사용하는 모든 시간 보여주는 컴포넌트에 반영되어야 할듯
  const year = dateWithTimezone.year();
  const month = dateWithTimezone.month() + 1;
  const day = dateWithTimezone.date();
  const hours = dateWithTimezone.hour();
  const minutes = dateWithTimezone.minute();

  // - 3월의 경우 03월 등으로 표기 필요
  //2024 => 24
  const yearString = year.toString().slice(2);
  const monthString = month < 10 ? `0${month}` : `${month}`;
  const dayString = day < 10 ? `0${day}` : `${day}`;
  const hoursString = hours < 10 ? `0${hours}` : `${hours}`;
  const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;

  // - 오늘이 아닌 경우 날짜 표기 필요
  const today = new Date();
  if (
    today.getFullYear() === year &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  ) {
    return `${yearString}-${monthString}-${dayString} ${hoursString}:${minutesString}`;
  }
  if (
    today.getFullYear() === year &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  ) {
    return `${hoursString}:${minutesString}`;
  }

  if (today.getFullYear() === year) {
    return `${monthString}-${dayString}`;
  }

  return `${yearString}-${monthString}-${dayString}`;
}
