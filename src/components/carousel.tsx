import { useCallback, useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';

type Props = {
  autoplay?: boolean;
  autoplaySpeed?: number;
  children: React.ReactNode[];
  initialSlide?: number;
};

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &:focus {
    outline: none;
  }
`;

const Slide = styled.div`
  flex: 0 0 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
`;

const NavButton = styled.button`
  appearance: none;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  font-size: 20px;
  height: 40px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  transition: background-color 200ms ease, opacity 200ms ease;
  width: 40px;
  z-index: 1;

  &:hover {
    background-color: rgba(0, 0, 0, 0.75);
  }

  &:focus {
    outline: 2px solid white;
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
`;

const PrevButton = styled(NavButton)`
  left: 4px;
`;

const NextButton = styled(NavButton)`
  right: 4px;
`;

const DotsContainer = styled.div`
  bottom: 0;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  left: 0;
  padding: 12px 8px;
  position: absolute;
  right: 0;
`;

const Dot = styled.button<{ active: boolean }>`
  appearance: none;
  background: none;
  border: none;
  cursor: pointer;
  height: 12px;
  padding: 0;
  position: relative;
  width: 12px;

  &::before {
    background-color: #000000;
    border-radius: 50%;
    bottom: 4px;
    content: '';
    left: 4px;
    opacity: ${props => (props.active ? 0.75 : 0.25)};
    position: absolute;
    right: 4px;
    top: 4px;
    transition: opacity 100ms ease;
  }

  &:hover::before {
    opacity: ${props => (props.active ? 0.75 : 0.5)};
  }

  &:focus {
    outline: 2px solid rgba(0, 0, 0, 0.5);
    outline-offset: 2px;
  }
`;

export function Carousel({
  autoplay = false,
  autoplaySpeed = 5000,
  children,
  initialSlide = 0
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialSlide);
  const autoplayTimerRef = useRef<number>();
  const currentIndexRef = useRef(currentIndex);
  const slideCountRef = useRef(children.length);

  // Keep refs in sync
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    slideCountRef.current = children.length;
  }, [children.length]);

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;

    const targetIndex = Math.max(0, Math.min(index, slideCountRef.current - 1));
    const slideWidth = scrollRef.current.offsetWidth;
    scrollRef.current.scrollLeft = targetIndex * slideWidth;
    setCurrentIndex(targetIndex);
  }, []);

  const goToNext = useCallback(() => {
    const nextIndex =
      currentIndexRef.current === slideCountRef.current - 1 ? 0 : currentIndexRef.current + 1;

    scrollToIndex(nextIndex);
  }, [scrollToIndex]);

  const goToPrev = useCallback(() => {
    const prevIndex =
      currentIndexRef.current === 0 ? slideCountRef.current - 1 : currentIndexRef.current - 1;

    scrollToIndex(prevIndex);
  }, [scrollToIndex]);

  // Handle scroll events to update current index
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const slideWidth = scrollContainer.offsetWidth;
      const newIndex = Math.round(scrollContainer.scrollLeft / slideWidth);
      setCurrentIndex(newIndex);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrev();
          break;

        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;

        case 'Home':
          e.preventDefault();
          scrollToIndex(0);
          break;

        case 'End':
          e.preventDefault();
          scrollToIndex(slideCountRef.current - 1);
          break;

        default:
          break;
      }
    };

    scrollContainer.addEventListener('keydown', handleKeyDown);

    return () => scrollContainer.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, scrollToIndex]);

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return;

    const startAutoplay = () => {
      autoplayTimerRef.current = window.setTimeout(() => {
        goToNext();
      }, autoplaySpeed);
    };

    startAutoplay();

    return () => {
      if (autoplayTimerRef.current) {
        clearTimeout(autoplayTimerRef.current);
      }
    };
  }, [autoplay, autoplaySpeed, goToNext]);

  // Scroll to initial slide
  useEffect(() => {
    scrollToIndex(initialSlide);
  }, [initialSlide, scrollToIndex]);

  return (
    <CarouselContainer>
      <ScrollContainer aria-label={'Image carousel'} ref={scrollRef} role={'region'} tabIndex={0}>
        {children.map((child, index) => (
          <Slide key={index}>{child}</Slide>
        ))}
      </ScrollContainer>

      <PrevButton aria-label={'Previous slide'} onClick={goToPrev} type={'button'}>
        {'‹'}
      </PrevButton>

      <NextButton aria-label={'Next slide'} onClick={goToNext} type={'button'}>
        {'›'}
      </NextButton>

      <DotsContainer>
        {children.map((_, index) => (
          <Dot
            active={index === currentIndex}
            aria-current={index === currentIndex ? 'true' : 'false'}
            aria-label={`Go to slide ${index + 1}`}
            key={index}
            onClick={() => scrollToIndex(index)}
            type={'button'}
          />
        ))}
      </DotsContainer>
    </CarouselContainer>
  );
}
