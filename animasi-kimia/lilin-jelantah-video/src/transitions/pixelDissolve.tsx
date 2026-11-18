import React, {useId, useMemo} from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, random} from 'remotion';

interface PixelDissolveProps extends Record<string, unknown> {
  cols?: number;
  rows?: number;
  seed?: string;
}

const PixelDissolvePresentation: React.FC<TransitionPresentationComponentProps<PixelDissolveProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const cols = passedProps.cols ?? 24;
  const rows = passedProps.rows ?? 14;
  const seed = passedProps.seed ?? 'pd';
  const maskId = useId();

  const thresholds = useMemo(() => {
    const list: Array<{x: number; y: number; t: number}> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          x: c,
          y: r,
          t: random(`${seed}-${c}-${r}`) * 0.88,
        });
      }
    }
    return list;
  }, [cols, rows, seed]);

  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <defs>
          <mask id={maskId} maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
            <rect width="1" height="1" fill="black" />
            {thresholds.map((cell, i) =>
              presentationProgress >= cell.t ? (
                <rect
                  key={i}
                  x={cell.x / cols}
                  y={cell.y / rows}
                  width={1.01 / cols}
                  height={1.01 / rows}
                  fill="white"
                />
              ) : null,
            )}
          </mask>
        </defs>
      </svg>
      <AbsoluteFill style={{mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})`}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const pixelDissolve = (
  props: PixelDissolveProps = {},
): TransitionPresentation<PixelDissolveProps> => ({
  component: PixelDissolvePresentation,
  props,
});
