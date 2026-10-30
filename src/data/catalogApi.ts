export const API_ORIGIN = "https://helldivers-api.dionatha.com.br";

/** Response shapes of the Helldivers 2 Data API, limited to the fields this app reads. */
export type ApiDamage = {
  standard: number | null;
  durable: number | null;
  type: string | null;
};

export type ApiAttack = {
  name: string;
  kind: string;
  damage: ApiDamage | null;
  penetration: { direct: string | null } | null;
  projectile?: { pellets: number | null } | null;
};

/** What stratagems and weapons share once a weapon's category is read as its kind. */
export type ApiArmament = {
  id: string;
  name: string;
  kind: string;
  upcoming: boolean;
  image?: { url: string } | null;
  attacks: ApiAttack[] | null;
};

export type ApiStratagem = ApiArmament;

export type ApiWeapon = Omit<ApiArmament, "kind"> & { category: string };

export type ApiListResponse<Item> = {
  meta?: { dataVersion?: string };
  data?: Item[];
};
