import type { ImgHTMLAttributes } from "react";
import {
  STAYNEST_EMBLEM_FALLBACK_SRC,
  STAYNEST_EMBLEM_SRC,
  STAYNEST_LOGO_ALT,
  STAYNEST_WORDMARK_FALLBACK_SRC,
  STAYNEST_WORDMARK_SRC,
} from "@/brand";

type BrandImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  kind?: "wordmark" | "emblem";
  alt?: string;
};

export function BrandImage({ kind = "wordmark", alt = STAYNEST_LOGO_ALT, ...props }: BrandImageProps) {
  const isEmblem = kind === "emblem";
  const primarySrc = isEmblem ? STAYNEST_EMBLEM_SRC : STAYNEST_WORDMARK_SRC;
  const fallbackSrc = isEmblem ? STAYNEST_EMBLEM_FALLBACK_SRC : STAYNEST_WORDMARK_FALLBACK_SRC;

  return (
    <img
      {...props}
      src={primarySrc}
      alt={alt}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallbackSrc;
      }}
    />
  );
}
