// MyMemory Translation API を使った英語→日本語の自動翻訳
const Translator = (() => {
  const ENDPOINT = "https://api.mymemory.translated.net/get";

  async function toJapanese(englishText) {
    const text = englishText.trim();
    if (!text) return "";

    const url = `${ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|ja`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`翻訳APIエラー: ${res.status}`);
    }
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (!translated) {
      throw new Error("翻訳結果を取得できませんでした");
    }
    return translated;
  }

  return { toJapanese };
})();
