import { Popup as BasePopup } from 'react-map-gl';
import { Carousel } from './carousel';
import { Point } from 'types/point';
import { Timeline } from './timeline';
import { colors } from 'src/core/config/colors';
import { forwardRef } from 'react';
import { useDelayedState } from 'src/core/hooks/use-delayed-state';
import imagePaths from 'src/core/config/image-paths.json';
import styled from '@emotion/styled';

type Props = {
  initialSlide?: number;
  onClose?: () => void;
  point: Point;
};

const Popup = styled(BasePopup)`
  z-index: ${colors.length + 1};
  .mapboxgl-popup-tip {
    display: none;
  }

  .mapboxgl-popup-content {
    background: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  .mapboxgl-popup-content > .mapboxgl-popup-close-button {
    font-size: 32px;
    height: 44px;
    transition: opacity 200ms ease;
  }

  .mapboxgl-popup-content > .mapboxgl-popup-close-button:hover {
    background: none;
    opacity: 0.75;
  }

  .popup-enter {
    opacity: 0;
  }

  .popup-enter-active {
    opacity: 1;
    transition: opacity 200ms;
  }

  .popup-exit {
    opacity: 1;
  }

  .popup-exit-active {
    opacity: 0;
    transition: opacity 200ms;
  }
`;

const Content = styled.div`
  backdrop-filter: blur(4px);
  background-color: #00000044;
  border: solid 2px black;
  border-radius: 16px;
  color: #ffffff;
  width: 360px;

  & > *:not(:first-child) {
    border-top: solid 2px black;
  }
`;

const CarouselWrapper = styled.div`
  aspect-ratio: 4 / 3;
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 16px;
  overflow: hidden;
`;

const Image = styled.img`
  aspect-ratio: 4 / 3;
  object-fit: cover;
  width: 360px;
`;

const Name = styled.h3`
  margin: 0;
  padding: 12px 0;
  position: relative;
  text-align: center;
`;

const CloseButton = styled.button`
  appearance: none;
  background: none;
  border: none;
  bottom: 4px;
  cursor: pointer;
  font-size: 32px;
  outline: none;
  position: absolute;
  right: 4px;
  top: 0;
`;

export const CustomPopup = forwardRef<HTMLDivElement, Props>(
  ({ initialSlide, onClose, point }, ref) => {
    const imagesKey = point && (point.name as keyof typeof imagePaths);
    const delayedImagesKey = useDelayedState(imagesKey, { delay: 100 });

    return (
      <Popup
        anchor={'top'}
        closeButton={false}
        closeOnClick={false}
        closeOnMove={false}
        latitude={point.lat}
        longitude={point.lon}
        maxWidth={'360px'}
      >
        <Content ref={ref}>
          <Name>
            {point?.name}

            <CloseButton onClick={onClose}>{'\u00d7'}</CloseButton>
          </Name>

          {point?.dates && <Timeline dates={point.dates} />}

          {imagesKey && imagePaths[imagesKey] && (
            <CarouselWrapper>
              {delayedImagesKey === imagesKey && (
                <Carousel autoplay autoplaySpeed={5000} initialSlide={initialSlide}>
                  {imagePaths[imagesKey].map(image => (
                    <a
                      href={`/images/${point.name}/${image.original}`}
                      key={image.thumbnail}
                      rel={'noreferrer'}
                      target={'_blank'}
                    >
                      <Image src={`/thumbnails/${point.name}/${image.thumbnail}`} />
                    </a>
                  ))}
                </Carousel>
              )}
            </CarouselWrapper>
          )}
        </Content>
      </Popup>
    );
  }
);

CustomPopup.displayName = 'CustomPopup';
