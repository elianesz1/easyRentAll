import { useState } from "react";
import defaultPic from "../assets/defaultPic.png";

export default function ImageWithFallback({ src, alt, className, onClick }) {
  const [err, setErr] = useState(false);
  return (
    <img
      src={err ? defaultPic : src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setErr(true)}
      onClick={onClick}
      draggable={false}
    />
  );
}
