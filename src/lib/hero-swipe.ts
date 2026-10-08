export type SwipePoint = { x: number; y: number };
export function getHeroSwipeDirection(start: SwipePoint, end: SwipePoint): -1 | 0 | 1 {
  const x = end.x - start.x;
  const y = end.y - start.y;
  if (Math.abs(x) < 50 || Math.abs(x) <= Math.abs(y)) return 0;
  return x < 0 ? 1 : -1;
}
