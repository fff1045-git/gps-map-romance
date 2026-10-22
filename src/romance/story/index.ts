import { CHAEA } from './chaea';
import { DOHA } from './doha';
import { SEOYUN } from './seoyun';
import type { Story } from './types';

export const STORIES: Record<string, Story> = {
  seoyun: SEOYUN,
  chaea: CHAEA,
  doha: DOHA,
};
