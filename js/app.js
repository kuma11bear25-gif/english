document.addEventListener("DOMContentLoaded", () => {
  // ---- Service Worker登録（オフライン対応・ホーム画面追加用） ----
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch((err) => {
      console.error("Service Workerの登録に失敗しました", err);
    });
  }

  // ---- タブ切り替え ----
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");

      if (btn.dataset.tab === "list") renderList();
      if (btn.dataset.tab === "flashcard") setupFlashcards();
    });
  });

  // ---- 追加タブ ----
  const enInput = document.getElementById("en-input");
  const jaInput = document.getElementById("ja-input");
  const translateBtn = document.getElementById("translate-btn");
  const addForm = document.getElementById("add-form");
  const addStatus = document.getElementById("add-status");

  function setStatus(msg, isError = false) {
    addStatus.textContent = msg;
    addStatus.classList.toggle("error", isError);
  }

  translateBtn.addEventListener("click", async () => {
    const text = enInput.value.trim();
    if (!text) {
      setStatus("英語文章を入力してください", true);
      return;
    }
    setStatus("翻訳中...");
    translateBtn.disabled = true;
    try {
      const ja = await Translator.toJapanese(text);
      jaInput.value = ja;
      setStatus("翻訳しました。必要であれば編集してください。");
    } catch (e) {
      console.error(e);
      setStatus("翻訳に失敗しました。手動で日本語訳を入力してください。", true);
    } finally {
      translateBtn.disabled = false;
    }
  });

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const en = enInput.value.trim();
    let ja = jaInput.value.trim();

    if (!en) {
      setStatus("英語文章を入力してください", true);
      return;
    }

    if (!ja) {
      setStatus("翻訳中...");
      try {
        ja = await Translator.toJapanese(en);
        jaInput.value = ja;
      } catch (err) {
        console.error(err);
        ja = "";
      }
    }

    Storage.add({
      id: Storage.makeId(),
      en,
      ja,
      createdAt: Date.now(),
    });

    enInput.value = "";
    jaInput.value = "";
    setStatus("保存しました！");
    setTimeout(() => setStatus(""), 2000);
  });

  // ---- 一覧タブ ----
  const listEl = document.getElementById("sentence-list");
  const listEmpty = document.getElementById("list-empty");

  function renderList() {
    const sentences = Storage.loadAll();
    listEl.innerHTML = "";
    listEmpty.style.display = sentences.length ? "none" : "block";

    sentences.forEach((s) => {
      const li = document.createElement("li");
      li.className = "sentence-card";
      li.innerHTML = `
        <p class="sentence-en">${escapeHtml(s.en)}</p>
        <p class="sentence-ja">${escapeHtml(s.ja || "（訳なし）")}</p>
        <div class="sentence-actions">
          <button class="icon-btn speak-btn" title="読み上げ">🔊 読み上げ</button>
          <button class="icon-btn retranslate-btn" title="再翻訳">🔁 再翻訳</button>
          <button class="icon-btn edit-btn" title="編集">✏️ 編集</button>
          <button class="icon-btn delete-btn" title="削除">🗑️ 削除</button>
        </div>
      `;

      li.querySelector(".speak-btn").addEventListener("click", () => {
        Speech.speak(s.en, "en-US");
      });

      li.querySelector(".retranslate-btn").addEventListener("click", async (ev) => {
        ev.target.disabled = true;
        try {
          const ja = await Translator.toJapanese(s.en);
          Storage.update(s.id, { ja });
          renderList();
        } catch (err) {
          alert("翻訳に失敗しました");
        } finally {
          ev.target.disabled = false;
        }
      });

      li.querySelector(".edit-btn").addEventListener("click", () => {
        const newEn = prompt("英語文章を編集", s.en);
        if (newEn === null) return;
        const newJa = prompt("日本語訳を編集", s.ja || "");
        if (newJa === null) return;
        Storage.update(s.id, { en: newEn.trim(), ja: newJa.trim() });
        renderList();
      });

      li.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm("この文章を削除しますか？")) {
          Storage.remove(s.id);
          renderList();
        }
      });

      listEl.appendChild(li);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- フラッシュカードタブ ----
  const fcMode = document.getElementById("fc-mode");
  const fcShuffleBtn = document.getElementById("fc-shuffle");
  const fcEmpty = document.getElementById("fc-empty");
  const fcArea = document.getElementById("fc-area");
  const fcProgress = document.getElementById("fc-progress");
  const flashcardEl = document.getElementById("flashcard");
  const fcText = document.getElementById("fc-text");
  const fcSpeakBtn = document.getElementById("fc-speak");
  const fcFlipBtn = document.getElementById("fc-flip");
  const fcPrevBtn = document.getElementById("fc-prev");
  const fcNextBtn = document.getElementById("fc-next");

  let fcCards = [];
  let fcIndex = 0;
  let fcFlipped = false;

  function setupFlashcards() {
    const all = Storage.loadAll().filter((s) => s.en && s.ja);
    fcCards = shuffle([...all]);
    fcIndex = 0;
    fcFlipped = false;

    const hasCards = fcCards.length > 0;
    fcEmpty.style.display = hasCards ? "none" : "block";
    fcArea.style.display = hasCards ? "block" : "none";

    if (hasCards) renderCard();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function currentFrontBack() {
    const card = fcCards[fcIndex];
    const mode = fcMode.value; // 'en-ja' or 'ja-en'
    if (mode === "en-ja") {
      return { front: card.en, back: card.ja, frontLang: "en-US", backLang: "ja-JP" };
    }
    return { front: card.ja, back: card.en, frontLang: "ja-JP", backLang: "en-US" };
  }

  function renderCard() {
    fcFlipped = false;
    const { front } = currentFrontBack();
    fcText.textContent = front;
    fcProgress.textContent = `${fcIndex + 1} / ${fcCards.length}`;
  }

  function flipCard() {
    if (!fcCards.length) return;
    fcFlipped = !fcFlipped;
    const { front, back } = currentFrontBack();
    fcText.textContent = fcFlipped ? back : front;
  }

  function goNext() {
    if (!fcCards.length) return;
    fcIndex = (fcIndex + 1) % fcCards.length;
    renderCard();
  }

  function goPrev() {
    if (!fcCards.length) return;
    fcIndex = (fcIndex - 1 + fcCards.length) % fcCards.length;
    renderCard();
  }

  fcMode.addEventListener("change", () => {
    fcIndex = 0;
    if (fcCards.length) renderCard();
  });

  fcShuffleBtn.addEventListener("click", () => {
    fcCards = shuffle([...fcCards]);
    fcIndex = 0;
    if (fcCards.length) renderCard();
  });

  flashcardEl.addEventListener("click", flipCard);
  fcFlipBtn.addEventListener("click", flipCard);
  fcNextBtn.addEventListener("click", goNext);
  fcPrevBtn.addEventListener("click", goPrev);

  // ---- スワイプ操作（モバイル向け: 左右スワイプで前後移動） ----
  let touchStartX = null;
  let touchStartY = null;

  flashcardEl.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
  );

  flashcardEl.addEventListener(
    "touchend",
    (e) => {
      if (touchStartX === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;

      const SWIPE_THRESHOLD = 40;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) {
        return; // 小さい動きやタップはflipCardのclickに任せる
      }
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    { passive: true }
  );

  fcSpeakBtn.addEventListener("click", () => {
    if (!fcCards.length) return;
    const { front, back, frontLang, backLang } = currentFrontBack();
    const text = fcFlipped ? back : front;
    const lang = fcFlipped ? backLang : frontLang;
    Speech.speak(text, lang);
  });

  // 初期表示
  renderList();
});
