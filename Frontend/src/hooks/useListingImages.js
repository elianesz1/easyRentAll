import { useMemo } from "react";
import defaultPic from "../assets/defaultPic.png";

export default function useListingImages(images) {
  return useMemo(() => {
    const arr = Array.isArray(images) && images.length ? images : [defaultPic];
    return arr.map(src => ({ src, thumb: src }));
  }, [images]);
}
