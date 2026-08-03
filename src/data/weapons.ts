import type { Weapon } from '../types/game'

export const WEAPONS: Weapon[] = [
  { id: 'poison_herb', name: '毒草エキス', disguisedAs: '持病による発作死' },
  { id: 'dagger', name: '古い短剣', disguisedAs: '転落による外傷死' },
  { id: 'sedative', name: '睡眠薬の過剰投与', disguisedAs: '老衰・自然死' },
  { id: 'candlestick', name: '重い燭台', disguisedAs: '階段からの転落事故' },
  { id: 'poison_wine', name: '毒入りワイン', disguisedAs: '食中毒' },
  { id: 'strangling', name: '絞殺', disguisedAs: '自殺（首吊り）' },
  { id: 'drowning', name: '溺死', disguisedAs: '浴室での事故' },
]
