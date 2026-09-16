// localStorageへの文章データの読み書きを担当する
const Storage = (() => {
  const KEY = "englishNotebook.sentences";

  function loadAll() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("読み込みに失敗しました", e);
      return [];
    }
  }

  function saveAll(sentences) {
    localStorage.setItem(KEY, JSON.stringify(sentences));
  }

  function add(sentence) {
    const all = loadAll();
    all.unshift(sentence);
    saveAll(all);
    return sentence;
  }

  function update(id, changes) {
    const all = loadAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...changes };
    saveAll(all);
    return all[idx];
  }

  function remove(id) {
    const all = loadAll().filter((s) => s.id !== id);
    saveAll(all);
  }

  function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return { loadAll, saveAll, add, update, remove, makeId };
})();
