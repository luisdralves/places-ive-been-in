import type { Map as MapboxMap } from "mapbox-gl";
import { useCallback, useRef, useState } from "react";
import MapGL, { type MapRef, NavigationControl } from "react-map-gl";
import { CSSTransition } from "react-transition-group";
import type { Point } from "types/point";
import { CustomPopup } from "./components/custom-popup";
import { PinsLayer } from "./components/pins-layer";
import { VisitsDrawer } from "./components/visits-drawer";
import { points } from "./core/config/points";
import { useDelayedState } from "./core/hooks/use-delayed-state";
import { latitudeOffsetFromHeight } from "./core/utils/coords";

const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
// Const dayTheme = import.meta.env.VITE_MAPBOX_DAY;
const nightTheme = import.meta.env.VITE_MAPBOX_NIGHT;

const App = () => {
  const query = new URLSearchParams(window.location.search);
  const place = query.get("place");
  const deepLink = useRef(place ? { place, index: Number(query.get("index")) || 0 } : null);
  const mapRef = useRef<MapRef | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const selected = place ? points.get(place) : undefined;
  const [selectedPoint, selectPoint] = useState<[string, Point] | null>(
    place && selected ? [place, selected] : null,
  );

  const delayedPoint = useDelayedState(selectedPoint, { delay: 200 });
  const safePoint = delayedPoint ?? selectedPoint;
  const [, selectedData] = selectedPoint ?? [];

  const getVerticalOffset = useCallback(() => {
    if (!mapRef.current) {
      return 0;
    }

    const bounds = mapRef.current.getBounds();

    return (bounds.getNorth() - bounds.getSouth()) / 4;
  }, []);

  const handleSelectPoint = useCallback(
    (entry: [string, Point]) => {
      const [name, point] = entry;
      deepLink.current = null;
      selectPoint(entry);
      history.pushState(null, "", `?place=${name}`);
      mapRef.current?.easeTo?.({
        center: [point.lon, point.lat - getVerticalOffset()],
        duration: 500,
      });
    },
    [getVerticalOffset],
  );

  return (
    <MapGL
      initialViewState={{
        latitude: selectedData
          ? selectedData.lat - latitudeOffsetFromHeight(window.innerHeight)
          : 47,
        longitude: selectedData?.lon ?? 4.7,
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

      <VisitsDrawer onSelect={handleSelectPoint} points={points} selectedPoint={selectedPoint} />

      <CSSTransition
        classNames={"popup"}
        in={!!selectedPoint && selectedPoint === delayedPoint}
        nodeRef={popupRef}
        timeout={200}
        unmountOnExit
      >
        {safePoint ? (
          <CustomPopup
            initialSlide={deepLink.current?.place === safePoint[0] ? deepLink.current.index : 0}
            onClose={() => {
              selectPoint(null);
              history.pushState(null, "", "/");
            }}
            place={safePoint}
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
