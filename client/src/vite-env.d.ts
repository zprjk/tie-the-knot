/// <reference types="vite/client" />

declare interface Window {
  _tie: {
    upload: (input: HTMLInputElement) => Promise<void>;
    openModal: (index: number) => void;
    closeModal: () => void;
    nextImage: () => void;
    prevImage: () => void;
    delImage: () => Promise<void>;
  };
}
