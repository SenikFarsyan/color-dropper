import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import Circle from "../../assets/icons/selected-color-circle.svg?react";

import styles from "./colorPickerPreview.module.scss";

const PREVIEW_GAP = 10;
const BLOCKS_COUNT = 15;

const rgbToHex = (r = 0, g = 0, b = 0) => {
  if (r > 255 || g > 255 || b > 255) {
    console.error("Invalid color component");
  }

  return ((r << 16) | (g << 8) | b).toString(16);
};

type ColorPickerPreviewProps = {
  canvasDimensions: DOMRect;
  canvasCtxRef: MutableRefObject<CanvasRenderingContext2D | null> | null;
  canvasRef: MutableRefObject<HTMLCanvasElement | null> | null;
  setSelectedColor: React.Dispatch<React.SetStateAction<string>>;
  isPicking: boolean;
  mouseIsOut: boolean;
};

export const ColorPickerPreview = ({
  canvasDimensions,
  canvasCtxRef,
  canvasRef,
  setSelectedColor,
  isPicking,
  mouseIsOut,
}: ColorPickerPreviewProps) => {
  const [colors, setColors] = useState<string[]>([]);
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
  });

  const previewerRef = useRef<HTMLDivElement | null>(null);

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      const x = event.pageX - canvasDimensions!.left;
      const y = event.pageY - canvasDimensions!.top;

      setCoords({ x, y });

      const pixels = canvasCtxRef!.current!.getImageData(
        x - BLOCKS_COUNT,
        y - BLOCKS_COUNT,
        2 * BLOCKS_COUNT + 1,
        2 * BLOCKS_COUNT + 1
      ).data;

      const newColors = [];

      for (let i = 0; i < pixels.length; i += 4) {
        const hex = rgbToHex(pixels[i], pixels[i + 1], pixels[i + 2]);

        const color = hex === "0" ? "black" : "#" + ("000000" + hex).slice(-6);

        newColors.push(color);
      }

      setColors(newColors);
    },
    [canvasCtxRef, canvasDimensions, setCoords]
  );

  const onSelectColor = useCallback(
    (event: MouseEvent) => {
      const x = event.pageX - canvasDimensions!.left;
      const y = event.pageY - canvasDimensions!.top;

      const pixels = canvasCtxRef!.current!.getImageData(x, y, 1, 1).data;

      const hex = rgbToHex(pixels[0], pixels[1], pixels[2]);

      const color = hex === "0" ? "black" : "#" + ("000000" + hex).slice(-6);

      setSelectedColor(color);
    },
    [canvasCtxRef, canvasDimensions, setSelectedColor]
  );

  useEffect(() => {
    const canvas = canvasRef?.current;

    if (isPicking) {
      canvas?.addEventListener("mousemove", onMouseMove);
      canvas?.addEventListener("click", onSelectColor);
    }

    return () => {
      canvas?.removeEventListener("mousemove", onMouseMove);
      canvas?.removeEventListener("click", onSelectColor);
    };
  }, [canvasRef, onMouseMove, onSelectColor, isPicking]);

  const midIndex = (colors.length - 1) / 2;

  const display = isPicking && !mouseIsOut && colors.length ? "flex" : "none";
  let left = (canvasDimensions?.left ?? 0) + coords.x + PREVIEW_GAP;
  let top = (canvasDimensions?.top ?? 0) + coords.y + PREVIEW_GAP;

  const previewHeight = previewerRef.current?.clientHeight ?? 0;
  const previewWidth = previewerRef.current?.clientWidth ?? 0;

  const overlayTop =
    top + previewHeight > window.innerHeight
      ? previewHeight + 2 * PREVIEW_GAP
      : 0;
  const overlayLeft =
    left + previewWidth > window.innerWidth
      ? previewWidth + 2 * PREVIEW_GAP
      : 0;

  left -= overlayLeft;
  top -= overlayTop;

  return (
    <div
      style={{
        display,
        left,
        top,
      }}
      className={styles.previewWrapper}
      ref={previewerRef}
    >
      <Circle className={styles.circle} />
      <div className={styles.blocksWrapper}>
        {colors.map((backgroundColor, index) => (
          <div
            style={{
              border: "0.5px solid gray",
              borderBottomColor:
                index === midIndex ||
                index === midIndex - (2 * BLOCKS_COUNT + 1)
                  ? "white"
                  : "gray",
              borderTopColor:
                index === midIndex ||
                index === midIndex + (2 * BLOCKS_COUNT + 1)
                  ? "white"
                  : "gray",
              borderRightColor:
                index === midIndex || index === midIndex - 1 ? "white" : "gray",
              borderLeftColor:
                index === midIndex || index === midIndex + 1 ? "white" : "gray",
              flexBasis: `calc(100% / ${2 * BLOCKS_COUNT + 1})`,
              backgroundColor,
            }}
            key={index}
          />
        ))}
        <p className={styles.currentColor}>{colors[midIndex]}</p>
      </div>
    </div>
  );
};
