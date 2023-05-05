import { Marker } from 'react-map-gl';
import { ReactComponent as MarkerIcon } from 'src/assets/svg/marker.svg';
import { Point } from 'src/core/config/points';
import { colors } from 'src/core/config/colors';

type Props = {
  onClick?: () => void;
  point: Point;
};

export const CustomMarker = ({ onClick, point }: Props) => (
  <Marker
    anchor={'bottom'}
    latitude={point.lat}
    longitude={point.lon}
    offset={[0, 8]}
    onClick={onClick}
    style={{zIndex:colors.length - point.color}}
  >
    <MarkerIcon
      color={colors[point.color]}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      width={32}
    />
  </Marker>
);
