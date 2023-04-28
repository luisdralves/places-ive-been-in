import { ReactComponent as MarkerIcon } from 'src/assets/svg/marker.svg';
import { MutableRefObject } from 'react';
import { Point } from 'src/core/config/points';
import { colors } from 'src/core/config/colors';

type Props = {
  markerRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onClick: () => void;
  point: Point;
};

export const CustomMarker = ({ markerRefs, onClick, point }: Props) => (
  <div
    ref={element => {
      markerRefs.current[point.name] = element;
    }}
  >
    <MarkerIcon
      color={colors[point.color]}
      onClick={onClick}
      style={{
        cursor: 'pointer'
      }}
      width={32}
    />
  </div>
);
