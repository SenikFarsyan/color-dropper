import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react";

import NoImage from "../../assets/icons/no-image.svg?react";
import Picker from "../../assets/icons/IconColorPicker.svg?react";

import { ColorPickerPreview } from "../ColorPickerPreview/ColorPickerPreview";

import styles from "./colorDropper.module.scss";

const hiddenCanvas = document.createElement("canvas");
const imageElement = document.createElement("img");

const ColorDropper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isImageSelected, setImageSelected] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [mouseIsOut, setMouseIsOut] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(imageElement);

  // CanvasRef
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(hiddenCanvas);

  const drawCanvas = useCallback((canvasDimensions: DOMRect) => {
    const imageElement = imageRef!.current!;

    const dpr = window.devicePixelRatio;

    const hiddenCtx = hiddenCanvasRef!.current.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    })!;
    const ctx = canvasRef!.current!.getContext("2d", {
      alpha: false,
      willReadFrequently: true,
    })!;

    const scaleY1 = imageElement.height / canvasDimensions.height;
    const scaleX1 = imageElement.width / canvasDimensions.width;

    const scaleY2 = 1 / scaleY1;
    const scaleX2 = 1 / scaleX1;

    const scale = Math.min(scaleX1, scaleY1, scaleX2, scaleY2);

    canvasRef!.current!.style.height = `${imageElement.height * scale}px`;
    canvasRef!.current!.style.width = `${imageElement.width * scale}px`;

    hiddenCanvasRef!.current.style.height = `${imageElement.height * scale}px`;
    hiddenCanvasRef!.current.style.width = `${imageElement.width * scale}px`;

    canvasRef!.current!.height = imageElement.height * scale * dpr;
    canvasRef!.current!.width = imageElement.width * scale * dpr;

    hiddenCanvasRef!.current.height = imageElement.height * scale;
    hiddenCanvasRef!.current.width = imageElement.width * scale;

    ctx.scale(scale * dpr, scale * dpr);
    hiddenCtx.scale(scale, scale);

    ctx.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);
    hiddenCtx.drawImage(
      imageElement,
      0,
      0,
      imageElement.width,
      imageElement.height
    );

    canvasCtxRef!.current = hiddenCtx;
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (image) {
      const imageElement = document.createElement("img");

      imageElement.onload = () => {
        imageRef!.current = imageElement;

        drawCanvas(canvasRef!.current!.parentElement!.getClientRects()[0]);

        setImageSelected(true);
        setIsLoading(false);
        setHasError(false);
      };

      imageElement.onerror = () => {
        setIsLoading(false);
        setHasError(true);
      };

      imageElement.src = URL.createObjectURL(image);
    }
  };

  const handlePick = () => {
    setIsPicking((prev) => !prev);
  };

  useEffect(() => {
    const canvas = canvasRef?.current;

    const onMouseLeave = () => setMouseIsOut(true);
    const onMouseEnter = () => setMouseIsOut(false);

    canvas?.addEventListener("mouseleave", onMouseLeave);
    canvas?.addEventListener("mouseenter", onMouseEnter);

    return () => {
      canvas?.removeEventListener("mouseleave", onMouseLeave);
      canvas?.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [canvasRef, setMouseIsOut]);

  useEffect(() => {
    const onResize = () => {
      const dimensions =
        canvasRef!.current!.parentElement!.getClientRects()[0]!;

      drawCanvas(dimensions);
    };

    if (isImageSelected) {
      window.addEventListener("resize", onResize);
    }

    return () => window.removeEventListener("resize", onResize);
  }, [canvasRef, isImageSelected, drawCanvas]);

  return (
    <div className={styles.editor}>
      <div className={styles.wrapper}>
        <div className={styles.sidebar}>
          <div className={styles.section}>
            <span>1. Select an image</span>
            <input
              accept="image/jpeg, image/png"
              onChange={handleFileChange}
              className={styles.hidden}
              ref={fileInputRef}
              type="file"
            />
          </div>
          <div className={styles.section}>
            <span>2. Pick color</span>
            <button
              className={`${isPicking ? styles.isPicking : ""}${
                !isImageSelected ? styles.disabled : ""
              }`}
              onClick={handlePick}
              disabled={!isImageSelected}
            >
              <Picker />
            </button>
          </div>
          <div className={styles.section}>
            <span>3. View selected</span>
            <div
              className={styles.selectedColor}
              style={{ background: selectedColor }}
            >
              <span>{selectedColor}</span>
            </div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.image}>
            <canvas
              className={`${styles.canvas} ${isPicking ? styles.picker : ""}`}
              ref={canvasRef}
            />
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <>
                {hasError && (
                  <p>
                    <span>Something went wrong</span>
                    <span>Please try again!</span>
                  </p>
                )}
                {!isImageSelected && (
                  <div
                    role="presentation"
                    onClick={() => fileInputRef.current?.click()}
                    className={styles.title}
                  >
                    <NoImage style={{ fill: "#808080" }} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {canvasRef.current && (
        <ColorPickerPreview
          canvasDimensions={
            canvasRef.current.parentElement!.getClientRects()[0]
          }
          canvasCtxRef={canvasCtxRef}
          canvasRef={canvasRef}
          setSelectedColor={setSelectedColor}
          isPicking={isPicking}
          mouseIsOut={mouseIsOut}
        />
      )}
    </div>
  );
};

export default ColorDropper;
