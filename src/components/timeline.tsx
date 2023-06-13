import { formatMonth, getColor } from 'src/core/utils/dates';
import { prop } from 'styled-tools';
import { useMemo } from 'react';
import styled from '@emotion/styled';

type Props = {
  dates: [string, string?][];
};

const Wrapper = styled.div`
  padding: 4px 0 8px;

  & > div:first-child {
    display: flex;
    justify-content: space-between;
    padding: 2px 8px;
  }

  & > div:last-child {
    padding: 2px 12px;
  }
`;

const Track = styled.div`
  border-radius: 8px;
  height: 8px;
  border: solid 1px black;
  background-color: #0008;
  position: relative;
`;

const Timespan = styled.div<{ color: string; left: number; right: number }>`
  border-radius: 8px;
  height: 8px;
  background-color: ${prop('color')};
  position: absolute;
  left: ${prop('left')}%;
  right: ${prop('right')}%;
  min-width: 8px;

  & > div {
    background-color: #000000aa;
    border: solid 2px black;
    border-radius: 16px;
    position: absolute;
    padding: 0 8px;
    bottom: 12px;
    left: 50%;
    opacity: 0;
    transform: translateX(-50%);
    transition: opacity 200ms ease-in-out;
    white-space: nowrap;
  }

  &:hover > div {
    opacity: 1;
  }
`;

export const Timeline = ({ dates }: Props) => {
  const { color, firstDate, lastDate, total } = useMemo(() => {
    const firstDate = new Date(dates[0][0]);
    const lastDate = new Date(dates.slice(-1)[0][1] ?? dates.slice(-1)[0][0]);

    const total = lastDate.getTime() - firstDate.getTime();
    const monthsMargin = Math.floor(total / (2 * 30 * 24 * 60 * 60 * 1000));

    firstDate.setMonth(firstDate.getMonth() - monthsMargin);
    firstDate.setDate(1);
    lastDate.setMonth(lastDate.getMonth() + 1 + monthsMargin);
    lastDate.setDate(1);

    return {
      color: getColor(dates),
      firstDate,
      lastDate,
      total: lastDate.getTime() - firstDate.getTime()
    };
  }, [dates]);

  return (
    <Wrapper>
      <div>
        <span>{formatMonth(firstDate)}</span>

        <span>{formatMonth(lastDate)}</span>
      </div>

      <div>
        <Track>
          {dates.map(([start, end]) => (
            // eslint-disable-next-line react/jsx-key
            <Timespan
              color={color}
              left={(100 * (new Date(start).getTime() - firstDate.getTime())) / total}
              right={
                (100 *
                  (lastDate.getTime() - new Date(end ?? start).getTime() + 24 * 60 * 60 * 1000)) /
                total
              }
            >
              <div>{`${start}${end ? ` -> ${end}` : ''}`}</div>
            </Timespan>
          ))}
        </Track>
      </div>
    </Wrapper>
  );
};
