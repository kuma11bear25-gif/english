// 英語→日本語の自動翻訳
// 日常会話表現・口語表現を優先的に扱うため、まずGoogle翻訳（内部エンドポイント）で
// ニューラル機械翻訳を試み、失敗した場合のみMyMemory（用例ベース）にフォールバックする。
// 慣用句など特殊な表現は自動翻訳でも不自然になることがあるため、保存前に手動修正を推奨。
const Translator = (() => {
  const GOOGLE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
  const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";

  async function viaGoogle(text) {
    const params = new URLSearchParams({
      client: "gtx",
      sl: "en",
      tl: "ja",
      dt: "t",
      q: text,
    });
    const res = await fetch(`${GOOGLE_ENDPOINT}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Google翻訳APIエラー: ${res.status}`);
    }
    const data = await res.json();
    // data[0] は [翻訳文, 原文, ...] のセグメント配列
    const segments = data?.[0];
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new Error("翻訳結果を取得できませんでした");
    }
    return segments.map((seg) => seg[0]).join("");
  }

  async function viaMyMemory(text) {
    const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=en|ja`;
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

  async function toJapanese(englishText) {
    const text = englishText.trim();
    if (!text) return "";

    try {
      return await viaGoogle(text);
    } catch (e) {
      console.warn("Google翻訳に失敗したためMyMemoryにフォールバックします", e);
      return await viaMyMemory(text);
    }
  }

  return { toJapanese };
})();
