import { MouseEventHandler, useRef } from 'react';
import styled from '@emotion/styled';

type Props = {
  onClose: () => void;
};

const BackdropDiv = styled.div`
  height: 100%;
  position: absolute;
  width: 100%;
`;

export const Backdrop = ({ onClose }: Props) => {
  const pointer = useRef({ x: 0, y: 0 });

  const onMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    pointer.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp: MouseEventHandler<HTMLDivElement> = e => {
    const { x, y } = pointer.current;

    if (Math.abs(e.clientX - x) < 8 && Math.abs(e.clientY - y) < 8) {
      onClose();
    }
  };

  return (
    <BackdropDiv
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    />
  );
};
