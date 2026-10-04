import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/** Merges conditional class names and de-duplicates conflicting Tailwind classes. */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
