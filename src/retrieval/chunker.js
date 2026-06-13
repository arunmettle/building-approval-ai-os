function cleanText(text) {
  return text.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

export function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize || 120;
  const overlap = options.overlap || 30;
  const cleaned = cleanText(text);

  if (!cleaned) {
    return [];
  }

  const words = cleaned.split(" ");
  const chunks = [];

  for (let start = 0; start < words.length; start += Math.max(1, chunkSize - overlap)) {
    const slice = words.slice(start, start + chunkSize);

    if (!slice.length) {
      continue;
    }

    chunks.push({
      startWord: start,
      endWord: start + slice.length,
      text: slice.join(" ")
    });

    if (start + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
}
