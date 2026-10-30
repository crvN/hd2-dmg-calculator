import type { EnemyBodyPart, PartImage } from "../../data/types";

const WIKI_THUMBNAIL_ROOT = "https://helldivers.wiki.gg/images/thumb";

/** Display-ready picture of a body part. */
export type PartImageModel = {
  src: string;
  srcSet: string;
  alt: string;
  caption: string | null;
};

function thumbnailUrl({ file, version }: PartImage, widthPixels: number): string {
  return `${WIKI_THUMBNAIL_ROOT}/${file}/${widthPixels}px-${file}?${version}`;
}

/** The same three widths the wiki serves on its own pages. */
export function partImageModels(
  part: EnemyBodyPart,
  enemyName: string,
): PartImageModel[] {
  return part.images.map((image) => ({
    src: thumbnailUrl(image, 200),
    srcSet: `${thumbnailUrl(image, 300)} 1.5x, ${thumbnailUrl(image, 400)} 2x`,
    alt: image.view
      ? `${enemyName} ${part.label}, ${image.view.toLowerCase()} view`
      : `${enemyName} ${part.label}`,
    caption: image.view,
  }));
}
