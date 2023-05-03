import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';
import { Point } from 'src/core/config/points';
import { VirtualElement } from '@popperjs/core';
import { colors } from 'src/core/config/colors';
import { css } from '@emotion/react';
import { ifProp, prop } from 'styled-tools';
import { useDelayedState } from 'src/core/hooks/use-delayed-state';
import { usePopper } from 'react-popper';
import { useState } from 'react';
import BaseSlider from 'react-slick';
import imagePaths from 'src/core/config/image-paths.json';
import styled from '@emotion/styled';

type Props = {
  isVisible?: boolean;
  point?: Point;
  referenceElement?: VirtualElement;
};

const Wrapper = styled.div<{ isVisible?: boolean; zIndex: number }>`
  backdrop-filter: blur(4px);
  background-color: #0004;
  border: solid 2px black;
  border-radius: 16px;
  color: #fff;
  overflow: hidden;
  transition: opacity 200ms ease, visibility 200ms ease, transform 200ms ease;
  visibility: hidden;
  width: 360px;
  z-index: ${prop('zIndex')};

  ${ifProp(
    'isVisible',
    css`
      opacity: 1;
      visibility: visible;
    `,
    css`
      opacity: 0;
      visibility: hidden;
    `
  )}

  & > *:not(:first-child) {
    border-top: solid 2px black;
  }
`;

const Slider = styled(BaseSlider)`
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

  .slick-dots {
    bottom: 12px !important;
    padding: 0 8px;
    width: calc(100% - 16px);
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
    background-color: #000;
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
`;

export const Tooltip = ({ isVisible, point, referenceElement }: Props) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const shouldRenderContent = useDelayedState(point && isVisible);
  const { attributes, styles } = usePopper(referenceElement, popperElement);
  const imagesKey = point && (point.name as keyof typeof imagePaths);

  return (
    <Wrapper
      {...attributes.popper}
      isVisible={point && isVisible}
      ref={setPopperElement}
      style={styles.popper}
      zIndex={colors.length}
    >
      {((point && isVisible) || shouldRenderContent) && (
        <>
          <h3 style={{ textAlign: 'center' }}>{point?.name}</h3>

          {point?.dates && (
            <div>
              {point?.dates?.map(dateSpan => (
                // eslint-disable-next-line react/jsx-key
                <p>{dateSpan.join(' -> ')}</p>
              ))}
            </div>
          )}

          {imagesKey && imagePaths[imagesKey] && (
            <Slider
              adaptiveHeight
              autoplay
              autoplaySpeed={5000}
              dots
              dotsClass={'dots'}
              easing={'ease'}
              infinite
              slidesToScroll={1}
              slidesToShow={1}
              speed={1000}
            >
              {imagePaths[imagesKey].map(image => (
                <Image
                  key={image}
                  src={`/images/${point.name}/${image}`}
                />
              ))}
            </Slider>
          )}
        </>
      )}
    </Wrapper>
  );
};
