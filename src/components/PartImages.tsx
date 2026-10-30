import type { PartImageModel } from "../logic/targets";

type PartImagesProps = {
  images: PartImageModel[];
};

export function PartImages({ images }: PartImagesProps) {
  if (images.length === 0) return null;

  return (
    <div className="part-images">
      {images.map((image) => (
        <figure key={image.src} className="part-image">
          <img
            src={image.src}
            srcSet={image.srcSet}
            alt={image.alt}
            loading="lazy"
          />
          {image.caption && <figcaption>{image.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
