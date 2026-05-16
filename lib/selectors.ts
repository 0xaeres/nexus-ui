export function forProduct<T extends { productId?: string }>(productId: string, arr: T[]): T[] {
  return arr.filter(item => !item.productId || item.productId === productId)
}
