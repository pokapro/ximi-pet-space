export type PetStage = "Egg" | "Baby" | "Growth" | "Evolution" | "Rare";

export const STAGE_NAMES: Record<PetStage, string> = {
  Egg: "蛋",
  Baby: "幼体",
  Growth: "成长期",
  Evolution: "进化期",
  Rare: "稀有形态",
};

export const PET_NAMES: Record<PetStage, string[]> = {
  Egg: ["小宠物蛋", "闪闪蛋", "星星蛋", "彩蛋"],
  Baby: ["小毛球", "小豆苗", "星宝宝", "小绒球"],
  Growth: ["跳跳熊", "萌芽鹿", "星火花", "叮咚鼠", "叶灵"],
  Evolution: ["羽灵鸟", "光角鹿", "星焰狮", "浪花鲸", "雷鸣蜥"],
  Rare: ["幻彩凤", "星辰龙", "极光狐", "翡翠神鹿", "暗夜狼"],
};

export const LEVEL_THRESHOLDS: { level: number; stage: PetStage }[] = [
  { level: 1, stage: "Egg" },
  { level: 4, stage: "Baby" },
  { level: 7, stage: "Growth" },
  { level: 12, stage: "Evolution" },
  { level: 20, stage: "Rare" },
];

export function experienceForLevel(level: number): number {
  // 1→2: 10exp, 2→3: 20exp, 3→4: 30exp...
  return level * 10;
}

export function getStageByLevel(level: number): PetStage {
  let stage: PetStage = "Rare";
  for (const t of LEVEL_THRESHOLDS) {
    if (level >= t.level) {
      stage = t.stage;
    }
  }
  return stage;
}

export function randomPetName(stage: PetStage): string {
  const names = PET_NAMES[stage];
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * 3D可爱卡通宠物图片配置
 * 每个阶段有2-3种风格，前端按index或随机选取
 */
export const PET_IMAGES: Record<PetStage, string[]> = {
  Egg: ["/pets/egg_01.png", "/pets/egg_02.png"],
  Baby: ["/pets/baby_01.png", "/pets/baby_02.png"],
  Growth: ["/pets/growth_01.png", "/pets/growth_02.png"],
  Evolution: ["/pets/evolution_01.png", "/pets/evolution_02.png"],
  Rare: ["/pets/rare_01.png", "/pets/rare_02.png"],
};

/** 获取宠物图片URL */
export function getPetImage(stage: PetStage, index?: number): string {
  const list = PET_IMAGES[stage];
  return list[index ?? Math.floor(Math.random() * list.length)] ?? list[0];
}

/**
 * 兼容旧接口 — 返回图片URL（替代emoji）
 */
export function getSkin(stage: PetStage, index?: number): string {
  return getPetImage(stage, index);
}

export function moodAfterDelta(current: number, delta: number): number {
  return Math.max(0, Math.min(100, current + delta));
}

export const MOOD_ICONS: Record<string, string> = {
  excited: "🤩",
  happy: "😄",
  calm: "😊",
  tired: "😴",
  sad: "😢",
};

export function getMoodState(mood: number): string {
  if (mood >= 80) return "excited";
  if (mood >= 60) return "happy";
  if (mood >= 40) return "calm";
  if (mood >= 20) return "tired";
  return "sad";
}

export function getMoodEmoji(mood: number): string {
  return MOOD_ICONS[getMoodState(mood)];
}

export const INTERACTION_MODIFIERS: Record<string, number> = {
  Pat: 2,
  Feed: 3,
  Greet: 1,
  Encourage: 5,
};
