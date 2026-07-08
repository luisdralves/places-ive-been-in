import styled from "@emotion/styled";
import { useMemo, useState } from "react";
import CalendarIcon from "src/assets/icons/calendar.svg?react";
import CloseIcon from "src/assets/icons/close.svg?react";
import { colors } from "src/core/config/colors";
import { firstPhotoIndex, flattenVisits, type Visit } from "src/core/utils/dates";
import type { Point } from "types/point";

type Props = {
  onSelect: (entry: [string, Point], index?: number) => void;
  points: Map<string, Point>;
  selectedPoint: [string, Point] | null;
};

const MOBILE = "(max-width: 640px)";

const Toggle = styled.button`
  align-items: center;
  appearance: none;
  backdrop-filter: blur(6px);
  background-color: #000000aa;
  border: solid 2px black;
  border-radius: 22px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font-size: 15px;
  gap: 8px;
  height: 44px;
  justify-content: center;
  position: fixed;
  right: 12px;
  top: 12px;
  transition: opacity 200ms ease;
  width: 104px;
  z-index: ${colors.length + 3};

  &:hover {
    opacity: 0.75;
  }

  svg {
    height: 16px;
    width: 16px;
  }
`;

const Panel = styled.div<{ open: boolean }>`
  backdrop-filter: blur(6px);
  background-color: #00000066;
  border-left: solid 2px black;
  bottom: 0;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  max-width: 90vw;
  position: fixed;
  right: 0;
  top: 0;
  transform: translateX(${({ open }) => (open ? "0" : "100%")});
  transition: transform 250ms ease;
  width: 420px;
  z-index: ${colors.length + 2};

  @media ${MOBILE} {
    max-width: none;
    width: 100vw;
  }
`;

const Header = styled.div`
  border-bottom: solid 2px black;
  font-size: 15px;
  font-weight: bold;
  padding: 16px;
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
`;

const YearHeader = styled.div`
  background-color: #1a1a1a;
  font-size: 12px;
  padding: 6px 16px;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const Row = styled.button<{ active: boolean }>`
  align-items: center;
  appearance: none;
  background-color: ${({ active }) => (active ? "#ffffff22" : "transparent")};
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 8px 16px;
  text-align: left;
  width: 100%;

  &:hover {
    background-color: #ffffff14;
  }
`;

const Dot = styled.span`
  border-radius: 50%;
  flex: 0 0 auto;
  height: 10px;
  width: 10px;
`;

const Where = styled.div`
  font-size: 13px;
  font-weight: 600;
`;

const When = styled.div`
  font-size: 11px;
  opacity: 0.65;
`;

export const VisitsDrawer = ({ onSelect, points, selectedPoint }: Props) => {
  const [open, setOpen] = useState(false);
  const [selectedName] = selectedPoint ?? [];

  const handleSelect = (visit: Visit) => {
    onSelect([visit.name, visit.point], firstPhotoIndex(visit.name, visit.start));

    if (window.matchMedia(MOBILE).matches) {
      setOpen(false);
    }
  };

  const years = useMemo(() => {
    const byYear = new Map<number, ReturnType<typeof flattenVisits>>();

    for (const visit of flattenVisits(points)) {
      const bucket = byYear.get(visit.year) ?? [];
      bucket.push(visit);
      byYear.set(visit.year, bucket);
    }

    return [...byYear.entries()]
      .sort(([a], [b]) => b - a)
      .map(([year, visits]) => [year, [...visits].reverse()] as const);
  }, [points]);

  return (
    <>
      <Toggle
        aria-label={open ? "Close visits" : "Open visits"}
        onClick={() => setOpen((value) => !value)}
        type={"button"}
      >
        {open ? <CloseIcon /> : <CalendarIcon />}
        {open ? "Close" : "Visits"}
      </Toggle>

      <Panel open={open}>
        <Header>{"Visits"}</Header>

        <List>
          {years.map(([year, visits]) => (
            <div key={year}>
              <YearHeader>{year}</YearHeader>

              {visits.map((visit) => (
                <Row
                  active={visit.name === selectedName}
                  key={`${visit.name}-${visit.start}`}
                  onClick={() => handleSelect(visit)}
                  type={"button"}
                >
                  <Dot style={{ backgroundColor: visit.color }} />

                  <div>
                    <Where>{visit.name}</Where>

                    <When>{visit.label}</When>
                  </div>
                </Row>
              ))}
            </div>
          ))}
        </List>
      </Panel>
    </>
  );
};
