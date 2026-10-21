export function coordinate(index) {
  return `${String.fromCharCode(65 + (index % 8))}${Math.floor(index / 8) + 1}`;
}
