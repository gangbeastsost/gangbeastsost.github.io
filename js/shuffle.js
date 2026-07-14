export function createShuffleQueue(allowedIndices, currentIndex, random = Math.random) {
  if (!Array.isArray(allowedIndices) || allowedIndices.length <= 1) return [];
  const queue = allowedIndices.filter((index) => index !== currentIndex);
  for (let index = queue.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [queue[index], queue[swapIndex]] = [queue[swapIndex], queue[index]];
  }
  return queue;
}
