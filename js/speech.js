// Web Speech API を使った読み上げ
const Speech = (() => {
  const supported = "speechSynthesis" in window;

  function speak(text, lang = "en-US") {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  return { speak, supported };
})();
