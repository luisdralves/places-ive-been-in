import { CSSTransition } from 'react-transition-group';
import { CustomMarker } from './components/custom-marker';
import { CustomPopup } from './components/custom-popup';
import { Point, points } from './core/config/points';
import { latitudeOffsetFromHeight } from './core/utils/coords';
import { useDelayedState } from './core/hooks/use-delayed-state';
import { useMemo, useRef, useState } from 'react';
import Map, { MapRef, NavigationControl } from 'react-map-gl';

const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
// Const dayTheme = import.meta.env.VITE_MAPBOX_DAY;
const nightTheme = import.meta.env.VITE_MAPBOX_NIGHT;

const sortedPoints = points.sort((first, second) => second.color - first.color);

const App = () => {
  const query = new URLSearchParams(window.location.search);
  const queryConsumed = useRef(false);
  const mapRef = useRef<MapRef | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [selectedPoint, selectPoint] = useState<Point | null>(
    (query.get('city') && points.find(({ name }) => name === query.get('city'))) || null
  );

  const delayedPoint = useDelayedState(selectedPoint, { delay: 200 });
  const safePoint = delayedPoint ?? selectedPoint;

  const getVerticalOffset = () => {
    if (!mapRef.current) {
      return 0;
    }

    const bounds = mapRef.current.getBounds();

    return (bounds.getNorth() - bounds.getSouth()) / 4;
  };

  const markers = useMemo(
    () =>
      sortedPoints.map(point => (
        <CustomMarker
          key={point.name}
          onClick={() => {
            selectPoint(point);
            mapRef.current?.easeTo?.({
              center: [point.lon, point.lat - getVerticalOffset()],
              duration: 500
            });
          }}
          point={point}
        />
      )),
    []
  );

  const getInitialSlide = () => {
    if (queryConsumed.current) {
      return 0;
    }

    queryConsumed.current = true;

    try {
      return Number(query.get('index'));
    } catch {
      return 0;
    }
  };

  return (
    <Map
      initialViewState={{
        latitude: selectedPoint
          ? selectedPoint.lat - latitudeOffsetFromHeight(window.innerHeight)
          : 47,
        longitude: selectedPoint?.lon ?? 4.7,
        zoom: 4
      }}
      mapStyle={nightTheme}
      mapboxAccessToken={accessToken}
      maxZoom={7}
      projection={'globe'}
      ref={mapRef}
      style={{ height: '100vh', width: '100vw' }}
    >
      {markers}

      <CSSTransition
        classNames={'popup'}
        in={!!selectedPoint && selectedPoint === delayedPoint}
        nodeRef={popupRef}
        timeout={200}
        unmountOnExit
      >
        {safePoint ? (
          <CustomPopup
            initialSlide={getInitialSlide()}
            onClose={() => selectPoint(null)}
            point={safePoint}
            ref={popupRef}
          />
        ) : (
          <div />
        )}
      </CSSTransition>

      <NavigationControl position={'top-left'} />
    </Map>
  );
};

export default App;
