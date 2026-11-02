import {
  Car,
  Film,
  GraduationCap,
  HeartPulse,
  MoreHorizontal,
  Plane,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryId } from '@/api/types';
import { categoryFor } from '@/data/categories';
import { cn } from '@/lib/cn';

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  cart: ShoppingCart,
  bag: ShoppingBag,
  car: Car,
  receipt: ReceiptText,
  film: Film,
  heart: HeartPulse,
  graduation: GraduationCap,
  plane: Plane,
  more: MoreHorizontal,
};

const sizeMap = {
  sm: { box: 'h-9 w-9', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11', icon: 'h-[19px] w-[19px]' },
  lg: { box: 'h-[52px] w-[52px]', icon: 'h-6 w-6' },
} as const;

export interface CategoryIconProps {
  categoryId: CategoryId;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function CategoryIcon({ categoryId, size = 'md', className }: CategoryIconProps) {
  const category = categoryFor(categoryId);
  const Icon = ICONS[category.icon] ?? MoreHorizontal;
  const dimensions = sizeMap[size];
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        dimensions.box,
        className,
      )}
      style={{ backgroundColor: category.tint, color: category.color }}
      aria-hidden
    >
      <Icon className={dimensions.icon} strokeWidth={2.1} />
    </span>
  );
}
