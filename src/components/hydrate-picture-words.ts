import { mediaUrl } from "@/lib/utils";

let activePictureAudio: HTMLAudioElement | null = null;

/** Wire 01-6 / 01-7 picture cards: image + label + circular play button + audio. */
export function hydratePictureWordCards(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".picture-word-card").forEach((card) => {
    const btn = card.querySelector<HTMLButtonElement>(".pinyin-play-btn");
    const audio = card.querySelector<HTMLAudioElement>("audio[data-src], audio.pinyin-sr-audio");
    if (!btn || !audio || btn.dataset.wired === "1") return;
    btn.dataset.wired = "1";

    const src =
      audio.querySelector("source")?.getAttribute("data-src") ?? audio.getAttribute("data-src");
    if (src) {
      const url = mediaUrl(src);
      audio.src = url;
      const source = audio.querySelector("source");
      if (source) source.setAttribute("src", url);
    }

    btn.addEventListener("click", () => {
      document.querySelectorAll<HTMLAudioElement>(".picture-word-card audio").forEach((a) => {
        if (a !== audio) {
          a.pause();
          a.closest(".picture-word-card")?.classList.remove("is-playing");
        }
      });
      if (activePictureAudio && activePictureAudio !== audio) {
        activePictureAudio.pause();
        activePictureAudio.closest(".picture-word-card")?.classList.remove("is-playing");
      }
      if (audio.paused) {
        audio.currentTime = 0;
        void audio.play();
        card.classList.add("is-playing");
        activePictureAudio = audio;
      } else {
        audio.pause();
        card.classList.remove("is-playing");
        activePictureAudio = null;
      }
    });
    audio.addEventListener("ended", () => {
      card.classList.remove("is-playing");
      if (activePictureAudio === audio) activePictureAudio = null;
    });
  });
}
