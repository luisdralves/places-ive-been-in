import styled from "@emotion/styled";
import { useMemo } from "react";
import { getColor, summarizeDates } from "src/core/utils/dates";

type Props = {
  dates: [string, string?][];
  marker?: string;
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
`;

const Summary = styled.div`
  font-size: 13px;
  text-align: center;
`;

const Track = styled.div`
  background-color: #ffffff1a;
  border-radius: 5px;
  height: 10px;
  position: relative;
`;

const Segment = styled.div`
  border-radius: 5px;
  bottom: 0;
  min-width: 4px;
  position: absolute;
  top: 0;
`;

const Marker = styled.div`
  background-color: #ffffff;
  border-radius: 1px;
  bottom: -3px;
  box-shadow: 0 0 0 1px #0009;
  pointer-events: none;
  position: absolute;
  top: -3px;
  transform: translateX(-50%);
  transition: left 200ms ease;
  width: 2px;
`;

const Axis = styled.div`
  display: flex;
  font-size: 11px;
  justify-content: space-between;
  opacity: 0.6;
`;

export const Timeline = ({ dates, marker }: Props) => {
  const summary = useMemo(() => summarizeDates(dates), [dates]);

  if (!summary) {
    return null;
  }

  const color = getColor(dates);
  const markerTime = marker ? new Date(marker).getTime() : Number.NaN;
  const markerPosition =
    markerTime >= summary.start && markerTime <= summary.end
      ? (markerTime - summary.start) / (summary.end - summary.start)
      : null;

  return (
    <Wrapper>
      <Summary>{summary.header}</Summary>

      <Track>
        {summary.segments.map(({ label, left, width }) => (
          // biome-ignore lint/correctness/useJsxKeyInIterable: segments are a fixed per-place list and never reorder.
          <Segment
            style={{
              backgroundColor: color,
              left: `${left * 100}%`,
              width: `${width * 100}%`,
            }}
            title={label}
          />
        ))}

        {markerPosition !== null && <Marker style={{ left: `${markerPosition * 100}%` }} />}
      </Track>

      {summary.startLabel !== summary.endLabel && (
        <Axis>
          <span>{summary.startLabel}</span>

          <span>{summary.endLabel}</span>
        </Axis>
      )}
    </Wrapper>
  );
};
