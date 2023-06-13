import { colors } from 'src/core/config/colors';

export const getTotalTime = (dates: [string, string?][] = []) => {
  return dates.reduce((total, [start, end]) => {
    return (
      total + (new Date(end ?? start).getTime() + 24 * 60 * 60 * 1000 - new Date(start).getTime())
    );
  }, 0);
};

export const getColor = (dates: [string, string?][] = []) => {
  const totalTime = getTotalTime(dates);

  if (totalTime > 30 * 24 * 60 * 60 * 1000) {
    return colors[0];
  }

  if (
    (totalTime > 14 * 24 * 60 * 60 * 1000 && dates.length === 1) ||
    (totalTime > 7 * 24 * 60 * 60 * 1000 && dates.length > 1)
  ) {
    return colors[1];
  }

  if (totalTime > 2 * 24 * 60 * 60 * 1000) {
    return colors[2];
  }

  return colors[3];
};

export const formatMonth = (date: Date) =>
  `${date.toDateString().split(' ')[1]} ${date.getFullYear()}`;
