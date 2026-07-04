import type { Map as MapboxMap } from "mapbox-gl";
import { useCallback, useRef, useState } from "react";
import MapGL, { type MapRef, NavigationControl } from "react-map-gl";
import { CSSTransition } from "react-transition-group";
import type { Point } from "types/point";
import { CustomPopup } from "./components/custom-popup";
import { PinsLayer } from "./components/pins-layer";
import { points } from "./core/config/points";
import { useDelayedState } from "./core/hooks/use-delayed-state";
import { latitudeOffsetFromHeight } from "./core/utils/coords";

const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
// Const dayTheme = import.meta.env.VITE_MAPBOX_DAY;
const nightTheme = import.meta.env.VITE_MAPBOX_NIGHT;

const App = () => {
  const query = new URLSearchParams(window.location.search);
  const queryConsumed = useRef(false);
  const mapRef = useRef<MapRef | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const [selectedPoint, selectPoint] = useState<Point | null>(
    (query.get("place") && points.find(({ name }) => name === query.get("place"))) || null,
  );

  const delayedPoint = useDelayedState(selectedPoint, { delay: 200 });
  const safePoint = delayedPoint ?? selectedPoint;

  const getVerticalOffset = useCallback(() => {
    if (!mapRef.current) {
      return 0;
    }

    const bounds = mapRef.current.getBounds();

    return (bounds.getNorth() - bounds.getSouth()) / 4;
  }, []);

  const handleSelectPoint = useCallback(
    (point: Point) => {
      selectPoint(point);
      history.pushState(null, "", `?place=${point.name}`);
      mapRef.current?.easeTo?.({
        center: [point.lon, point.lat - getVerticalOffset()],
        duration: 500,
      });
    },
    [getVerticalOffset],
  );

  const getInitialSlide = () => {
    if (queryConsumed.current) {
      return 0;
    }

    queryConsumed.current = true;

    try {
      return Number(query.get("index"));
    } catch {
      return 0;
    }
  };

  return (
    <MapGL
      initialViewState={{
        latitude: selectedPoint
          ? selectedPoint.lat - latitudeOffsetFromHeight(window.innerHeight)
          : 47,
        longitude: selectedPoint?.lon ?? 4.7,
        zoom: 4,
      }}
      mapStyle={nightTheme}
      mapboxAccessToken={accessToken}
      maxZoom={7}
      onLoad={() =>
        setMapInstance((mapRef.current?.getMap() ?? null) as unknown as MapboxMap | null)
      }
      projection={{ name: "globe" }}
      ref={mapRef}
      style={{ height: "100vh", width: "100vw" }}
    >
      <PinsLayer map={mapInstance} onSelect={handleSelectPoint} points={points} />

      <CSSTransition
        classNames={"popup"}
        in={!!selectedPoint && selectedPoint === delayedPoint}
        nodeRef={popupRef}
        timeout={200}
        unmountOnExit
      >
        {safePoint ? (
          <CustomPopup
            initialSlide={getInitialSlide()}
            onClose={() => {
              selectPoint(null);
              history.pushState(null, "", "/");
            }}
            point={safePoint}
            ref={popupRef}
          />
        ) : (
          <div />
        )}
      </CSSTransition>

      <NavigationControl position={"top-left"} />
    </MapGL>
  );
};

export default App;
