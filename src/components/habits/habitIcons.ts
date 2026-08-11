import {
  Droplet,
  Moon,
  Footprints,
  Sparkles,
  Salad,
  Sun,
  BookOpen,
  Dumbbell,
  Heart,
  Wind,
  Coffee,
  Smile,
  type LucideIcon,
} from 'lucide-react-native';

export const HABIT_ICON_NAMES = [
  'Droplet',
  'Moon',
  'Footprints',
  'Sparkles',
  'Salad',
  'Sun',
  'BookOpen',
  'Dumbbell',
  'Heart',
  'Wind',
  'Coffee',
  'Smile',
] as const;

export type HabitIconName = (typeof HABIT_ICON_NAMES)[number];

const ICONS: Record<HabitIconName, LucideIcon> = {
  Droplet,
  Moon,
  Footprints,
  Sparkles,
  Salad,
  Sun,
  BookOpen,
  Dumbbell,
  Heart,
  Wind,
  Coffee,
  Smile,
};

export function getHabitIcon(name: string): LucideIcon {
  if (name in ICONS) {
    return ICONS[name as HabitIconName];
  }
  return Sparkles;
}
