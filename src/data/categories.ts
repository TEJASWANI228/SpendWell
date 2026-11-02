import type { Category, CategoryId } from '@/api/types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Drinks', icon: 'utensils', color: '#ff7a45', tint: '#fff0e8' },
  { id: 'groceries', name: 'Groceries', icon: 'cart', color: '#59a662', tint: '#eaf6ec' },
  { id: 'shopping', name: 'Shopping', icon: 'bag', color: '#a783fc', tint: '#f2ecff' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#4c9aff', tint: '#eaf2ff' },
  { id: 'bills', name: 'Bills & Rent', icon: 'receipt', color: '#f79009', tint: '#fff4e5' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#ff5c93', tint: '#ffeaf1' },
  { id: 'health', name: 'Health', icon: 'heart', color: '#0f9f6e', tint: '#e6f7f1' },
  { id: 'education', name: 'Education', icon: 'graduation', color: '#6f33ff', tint: '#efe7ff' },
  { id: 'travel', name: 'Travel', icon: 'plane', color: '#22c3d6', tint: '#e5f8fb' },
  { id: 'other', name: 'Other', icon: 'more', color: '#828384', tint: '#f1f1f2' },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

export function categoryFor(id: CategoryId): Category {
  return CATEGORY_MAP[id];
}
