/**
 * Navigation routes configuration
 * Centralized route definitions for screen-based navigation
 */

export const routes = {
  home: '/',
  health: {
    base: '/health',
    upload: '/health/upload',
    summary: '/health/summary',
    timeline: '/health/timeline',
    symptoms: '/health/symptoms',
  },
  nutrition: {
    base: '/nutrition',
    input: '/nutrition/input',
    suggestions: '/nutrition/suggestions',
    detail: '/nutrition/detail',
  },
  emotional: {
    base: '/emotional',
    mood: '/emotional/mood',
    journal: '/emotional/journal',
    response: '/emotional/response',
    timeline: '/emotional/timeline',
  },
  privacy: {
    base: '/privacy',
    settings: '/privacy/settings',
    view: '/privacy/view',
    export: '/privacy/export',
    delete: '/privacy/delete',
  },
} as const;

export type RoutePath = typeof routes[keyof typeof routes] extends string
  ? typeof routes[keyof typeof routes]
  : typeof routes[keyof typeof routes][keyof typeof routes[keyof typeof routes]];

