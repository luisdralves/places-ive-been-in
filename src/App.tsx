import { Backdrop } from './components/backdrop';
import { CustomMarker } from 'src/components/custom-marker';
import { Map, Marker } from 'pigeon-maps';
import { Point, points } from 'src/core/config/points';
import { Tooltip } from 'src/components/tooltip';
import { VirtualElement } from '@popperjs/core';
import { maptiler } from 'pigeon-maps/providers';
import { useAnimationFrame } from 'src/core/hooks/use-animation-frame';
import { useCallback, useRef, useState } from 'react';
import styled from '@emotion/styled';

const maptilerProvider = maptiler(
  import.meta.env.VITE_MAPTILER_API_KEY as string,
  import.meta.env.VITE_MAPTILER_MAP
);

const getVirtualElement = (element: HTMLElement) => ({
  getBoundingClientRect: () => element.getBoundingClientRect()
});

const Main = styled.main`
  height: 100vh;
  overflow: hidden;

  .pigeon-click-block {
    cursor: initial !important;
    filter: none !important;
    pointer-events: initial !important;
    top: -8px;
  }
`;

const App = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPoint, selectPoint] = useState<Point>();
  const markerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [referenceElement, setReferenceElement] = useState<VirtualElement>();

  const updatePopper = useCallback(() => {
    if (!selectedPoint) {
      return;
    }

    const element = markerRefs.current[selectedPoint.name];

    if (!element) {
      return;
    }

    setReferenceElement(getVirtualElement(element));
  }, [selectedPoint]);

  useAnimationFrame(isVisible && selectedPoint && updatePopper);

  return (
    <Main>
      <Map
        defaultCenter={[50.879, 4.6997]}
        defaultZoom={4}
        dprs={[1, 2]}
        maxZoom={8}
        minZoom={3}
        provider={maptilerProvider}
        zoomSnap={false}
      >
        <Backdrop onClose={() => setIsVisible(false)} />

        {points
          .sort((first, second) => second.color - first.color)
          .map(point => (
            <Marker
              anchor={[point.lat, point.lon]}
              key={point.name}
            >
              <CustomMarker
                markerRefs={markerRefs}
                onClick={() => {
                  selectPoint(point);
                  setIsVisible(true);
                }}
                point={point}
              />
            </Marker>
          ))}

        <Tooltip
          isVisible={isVisible}
          point={selectedPoint}
          referenceElement={referenceElement}
        />
      </Map>
    </Main>
  );
};

export default App;
