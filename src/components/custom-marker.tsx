import { Marker } from 'react-map-gl';
import { ReactComponent as MarkerIcon } from 'src/assets/svg/marker.svg';
import { Point } from 'src/core/config/points';
import { colors } from 'src/core/config/colors';
import { getColor } from 'src/core/utils/dates';
import { useMemo } from 'react';

type Props = {
  onClick?: () => void;
  point: Point;
};

export const CustomMarker = ({ onClick, point }: Props) => {
  const autoColor = useMemo(
    () => colors.findIndex(color => color === getColor(point.dates)),
    [point.dates]
  );

  const colorIndex = point.color ?? autoColor;

  return (
    <Marker
      anchor={'bottom'}
      latitude={point.lat}
      longitude={point.lon}
      offset={[0, 8]}
      onClick={onClick}
      style={{ zIndex: colors.length - colorIndex }}
    >
      <MarkerIcon
        color={colors[colorIndex]}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
        width={32}
      />
    </Marker>
  );
};
