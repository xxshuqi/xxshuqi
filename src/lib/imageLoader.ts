type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

// Custom loader for static GitHub Pages export.
// next/image with unoptimized:true does not apply basePath to src,
// so we apply it manually here using the NEXT_PUBLIC_BASE_PATH env var.
export default function imageLoader({ src }: ImageLoaderProps): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  // Only prepend basePath for local paths (starting with /)
  if (src.startsWith("/")) {
    return `${basePath}${src}`;
  }
  return src;
}
