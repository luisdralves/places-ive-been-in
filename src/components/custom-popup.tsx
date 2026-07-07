import styled from "@emotion/styled";
import { forwardRef, useEffect, useState } from "react";
import { Popup as BasePopup } from "react-map-gl";
import CloseIcon from "src/assets/icons/close.svg?react";
import { colors } from "src/core/config/colors";
import imagePaths from "src/core/config/image-paths.json";
import { useDelayedState } from "src/core/hooks/use-delayed-state";
import type { Point } from "types/point";
import { Carousel } from "./carousel";
import { Timeline } from "./timeline";

type Props = {
  initialSlide?: number;
  onClose?: () => void;
  place: [string, Point];
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

const EmptyState = styled.div`
  align-items: center;
  display: flex;
  font-size: 14px;
  justify-content: center;
  min-height: 120px;
  opacity: 0.7;
  padding: 24px;
  text-align: center;
`;

const Name = styled.h3`
  margin: 0;
  padding: 12px 0;
  position: relative;
  text-align: center;
`;

const CloseButton = styled.button`
  align-items: center;
  appearance: none;
  background: none;
  border: none;
  bottom: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  justify-content: center;
  outline: none;
  position: absolute;
  right: 4px;
  top: 0;
  width: 44px;

  svg {
    height: 24px;
    width: 24px;
  }
`;

export const CustomPopup = forwardRef<HTMLDivElement, Props>(
  ({ initialSlide, onClose, place }, ref) => {
    const [name, point] = place;
    const imagesKey = name as keyof typeof imagePaths;
    const delayedImagesKey = useDelayedState(imagesKey, { delay: 100 });
    const images = imagePaths[imagesKey];
    const isEmpty = !point.dates?.length && !images?.length;

    const [slide, setSlide] = useState(initialSlide ?? 0);

    // biome-ignore lint/correctness/useExhaustiveDependencies: imagesKey resets the slide when the popup switches places.
    useEffect(() => {
      setSlide(initialSlide ?? 0);
    }, [imagesKey, initialSlide]);

    return (
      <Popup
        anchor={"top"}
        closeButton={false}
        closeOnClick={false}
        closeOnMove={false}
        latitude={point.lat}
        longitude={point.lon}
        maxWidth={"360px"}
      >
        <Content ref={ref}>
          <Name>
            {name}

            <CloseButton aria-label={"Close"} onClick={onClose}>
              <CloseIcon />
            </CloseButton>
          </Name>

          {point.dates && <Timeline dates={point.dates} marker={images?.[slide]?.date} />}

          {images && (
            <CarouselWrapper>
              {delayedImagesKey === imagesKey && (
                <Carousel
                  autoplay
                  autoplaySpeed={5000}
                  initialSlide={initialSlide}
                  onIndexChange={setSlide}
                >
                  {images.map((image) => (
                    <a
                      href={`/images/${name}/${image.original}`}
                      key={image.thumbnail}
                      rel={"noreferrer"}
                      target={"_blank"}
                    >
                      <Image src={`/thumbnails/${name}/${image.thumbnail}`} />
                    </a>
                  ))}
                </Carousel>
              )}
            </CarouselWrapper>
          )}

          {isEmpty && <EmptyState>{"Too many to keep track of"}</EmptyState>}
        </Content>
      </Popup>
    );
  },
);

CustomPopup.displayName = "CustomPopup";
