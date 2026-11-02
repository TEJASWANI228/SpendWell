import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Tailwind Merge does not know about the custom typography scale in
 * `tailwind.config.js` (`text-pmd`, `text-h4`, …). Without this extension it
 * treats those classes as text colours and silently drops `text-white` from
 * primary buttons. Registering the scale keeps font size and text colour
 * independent.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['h3', 'h4', 'h5', 'h6', 'pmd', 'psm', 'caption'],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
