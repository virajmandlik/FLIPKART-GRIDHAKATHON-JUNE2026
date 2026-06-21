import type { Region } from "../data/scenarios";

const IMAGE_AR = 1.5; // all scenario frames are 1536x1024

interface Props {
  image: string;
  region: Region;
  /** Fraction of the square the region should occupy (0–1). Lower = more context. */
  target?: number;
  className?: string;
  filter?: string;
}

/**
 * Renders an undistorted, zoomed crop of `image` centred on `region`.
 * Region coords are percentages of the full frame. Container is forced square.
 */
export default function CropView({ image, region, target = 0.56, className = "", filter = "" }: Props) {
  const rwu = region.w / 100;
  const rhu = region.h / 100 / IMAGE_AR;
  const rawScale = target / Math.max(rwu, rhu, 0.001);
  const scale = Math.min(6.5, Math.max(2, rawScale));

  const fx = (region.x + region.w / 2) / 100;
  const fy = (region.y + region.h / 2) / 100;

  const widthPct = scale * 100;
  const left = 50 - fx * scale * 100;
  const top = 50 - (fy * scale * 100) / IMAGE_AR;

  return (
    <div className={`relative aspect-square overflow-hidden bg-black ${className}`}>
      <img
        src={image}
        alt=""
        aria-hidden
        draggable={false}
        className={`absolute max-w-none ${filter}`}
        style={{ width: `${widthPct}%`, height: "auto", left: `${left}%`, top: `${top}%` }}
      />
    </div>
  );
}
