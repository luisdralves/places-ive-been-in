import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import { Popup as BasePopup } from 'react-map-gl';
import { Point } from 'types/point';
import { Timeline } from './timeline';
import { colors } from 'src/core/config/colors';
import { forwardRef } from 'react';
import { useDelayedState } from 'src/core/hooks/use-delayed-state';
import BaseSlider, { Settings } from 'react-slick';
import imagePaths from 'src/core/config/image-paths.json';
import styled from '@emotion/styled';

type Props = Pick<Settings, 'initialSlide'> & {
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

const SliderWrapper = styled.div`
  aspect-ratio: 4 / 3;
`;

const Slider = styled(BaseSlider)`
  border-bottom-right-radius: 16px;
  border-bottom-left-radius: 16px;
  overflow: hidden;

  .slick-list {
    aspect-ratio: 4 / 3;
    height: auto !important;
    width: 100% !important;
  }

  .slick-arrow {
    z-index: 1;
  }

  .slick-next {
    right: 4px !important;
  }

  .slick-prev {
    left: 4px !important;
  }

  .dots {
    bottom: 0;
    box-sizing: border-box;
    display: flex !important;
    flex-wrap: wrap;
    justify-content: center;
    list-style: none;
    margin: 0;
    padding: 12px 8px;
    position: absolute;
    width: 100%;
  }

  .dots > li {
    height: 12px;
    width: 12px;
  }

  .dots > li > button {
    appearance: none;
    background: none;
    border: none;
    color: transparent;
    cursor: pointer;
    height: 100%;
    padding: 0;
    position: relative;
    width: 100%;
  }

  .dots > li > button > * {
    display: none;
  }

  .dots > li > button::before {
    background-color: #000000;
    border-radius: 50%;
    bottom: 4px;
    content: '';
    left: 4px;
    opacity: 0.25;
    position: absolute;
    right: 4px;
    top: 4px;
    transition: opacity 100ms ease;
  }

  .dots > li > button:hover::before {
    opacity: 0.5;
  }

  .dots > li.slick-active > button::before {
    opacity: 0.75;
  }
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
            <SliderWrapper>
              {delayedImagesKey === imagesKey && (
                <Slider
                  adaptiveHeight
                  autoplay
                  autoplaySpeed={5000}
                  dots
                  dotsClass={'dots'}
                  easing={'ease'}
                  infinite
                  initialSlide={initialSlide}
                  slidesToScroll={1}
                  slidesToShow={1}
                  speed={1000}
                >
                  {imagePaths[imagesKey].map(image => (
                    <a
                      href={`/images/${point.name}/${image}`}
                      key={image}
                      rel={'noreferrer'}
                      target={'_blank'}
                    >
                      <Image src={`/thumbnails/${point.name}/${image}`} />
                    </a>
                  ))}
                </Slider>
              )}
            </SliderWrapper>
          )}
        </Content>
      </Popup>
    );
  }
);

CustomPopup.displayName = 'CustomPopup';
