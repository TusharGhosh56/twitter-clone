export function validateWordLimit(text, limit) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length <= limit;
  }
  