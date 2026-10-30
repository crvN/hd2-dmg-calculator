import type { EnemyBodyPart } from "../../data/types";
import { partImageModels } from "./partImages";

const part: EnemyBodyPart = {
  id: "head",
  label: "Head",
  section: null,
  count: 1,
  images: [
    { view: "Front", file: "Warrior_Head_Front.png", version: "aa11" },
    { view: null, file: "Warrior_Head.png", version: "bb22" },
  ],
  hitPointsByDifficulty: [{ fromDifficulty: 1, hitPoints: 110 }],
  sharesHealthWith: null,
  hasInfiniteHealth: false,
  armorByDifficulty: [{ fromDifficulty: 1, armorRating: 1 }],
  durablePercent: 20,
  explosiveResistPercent: 100,
  percentToMain: 100,
  capsOverflowToMain: false,
  isFatal: true,
  downsEnemy: false,
  constitution: null,
};

describe("partImageModels", () => {
  it("builds the wiki's own thumbnail addresses", () => {
    const [front] = partImageModels(part, "Warrior");

    expect(front.src).toBe(
      "https://helldivers.wiki.gg/images/thumb/Warrior_Head_Front.png/200px-Warrior_Head_Front.png?aa11",
    );
    expect(front.srcSet).toBe(
      "https://helldivers.wiki.gg/images/thumb/Warrior_Head_Front.png/300px-Warrior_Head_Front.png?aa11 1.5x, https://helldivers.wiki.gg/images/thumb/Warrior_Head_Front.png/400px-Warrior_Head_Front.png?aa11 2x",
    );
  });

  it("describes the enemy, the part, and the angle when there is one", () => {
    const [front, lone] = partImageModels(part, "Warrior");

    expect(front.alt).toBe("Warrior Head, front view");
    expect(front.caption).toBe("Front");
    expect(lone.alt).toBe("Warrior Head");
    expect(lone.caption).toBeNull();
  });

  it("returns nothing for a part with no pictures", () => {
    expect(partImageModels({ ...part, images: [] }, "Warrior")).toEqual([]);
  });
});
