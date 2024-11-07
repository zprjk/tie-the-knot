import {getApiBaseURL} from './utils/get-api-url';
import {resizeImage} from './utils/resize-image';
import type {UpldFile} from './types';

// Config
const uploadType: 'optimized' | 'original' = 'optimized';
const maxFilesPerUpload = 2;
const optimizedMaxUploadSize = 2500;

// Detect server url connection
const baseApiUrl = getApiBaseURL();
// Hack: check if user has special permissions
const isSpecial = new URLSearchParams(location.search).has('iamgod');

// Cache
let galleryData: UpldFile[] = [];
let modalIndex = 0;

// Hack: In order to `npm run build` this file properly.
window._tie = {
  upload,
  openModal,
  closeModal,
  nextImage,
  prevImage,
  delImage,
};

async function upload(input: HTMLInputElement) {
  const filesList = input.files;

  if (!filesList || filesList.length === 0) {
    console.log('no file selected');
    return;
  }

  const progress = document.getElementById('progress')!;
  const progressText = document.getElementById('progress-text')!;

  input.classList.add('is-loading');
  progress.classList.add('is-active');

  const files = Array.from(filesList);
  const totalChunks = Math.ceil(files.length / maxFilesPerUpload);
  const fotosStr = files.length === 1 ? 'foto' : 'fotos';

  progressText.innerText = `0/${files.length} ${fotosStr}`;

  for (let i = 0; i < totalChunks; i++) {
    const formData = new FormData();
    const start = i * maxFilesPerUpload;
    const end =
      start + maxFilesPerUpload > files.length
        ? files.length
        : start + maxFilesPerUpload;
    const chunkFiles = files.slice(start, end);

    if (uploadType === 'original') {
      Array.from(chunkFiles).forEach(async (file, idx) => {
        const fileMb = (file.size / 1024 / 1024).toFixed(2);
        console.log('uploading:', fileMb, 'MB');
        formData.append(String(idx), file);
      });
    } else {
      for (let idx = 0; idx < chunkFiles.length; idx++) {
        const file = chunkFiles[idx];
        const resizedFile = await resizeImage({
          maxSize: optimizedMaxUploadSize,
          file,
        });
        const fileMb = (resizedFile.size / 1024 / 1024).toFixed(2);
        console.log('uploading:', fileMb, 'MB');
        formData.append(String(idx), resizedFile);
      }
    }

    try {
      await fetch(`${baseApiUrl}/media`, {method: 'POST', body: formData});
      progressText.innerText = `${end}/${files.length} ${fotosStr}`;
    } catch (err) {
      console.error(err);
    }
  }

  progressText.innerText = `${files.length}/${files.length} ${fotosStr} ✅`;

  setTimeout(() => {
    input.classList.remove('is-loading');
    progress.classList.remove('is-active');
    window.location.reload();
  }, 1500);
}

async function getGallery() {
  const res = await fetch(`${baseApiUrl}/media`, {method: 'GET'});
  if (!res.ok) {
    console.error('Failed to fetch gallery');
    return;
  }
  const data = await res.json();

  const gallery = document.getElementById('gallery');
  if (!gallery) {
    return;
  }

  // Ensure type safety since we are binding this func to innerHTML string below.
  window._tie.openModal;
  const html = data
    .map((item: any, idx: number) => {
      return `
      <div class="cell">
        <figure class="image">
          <img loading="lazy" class="thumbnail" width="200" height="200" src=${baseApiUrl}/${item.thumbnail} onclick="window._tie.openModal(${idx})" />
        </figure>
      </div>`;
    })
    .join('');

  galleryData = data;
  gallery.innerHTML = html;
}

async function delImage() {
  if (!isSpecial) return;

  const decision = confirm('Are you sure you?');
  if (!decision) {
    return;
  }

  const item = galleryData[modalIndex];
  if (!item) {
    console.error('No image to delete');
    return;
  }

  const hash = item.hash;
  const res = await fetch(`${baseApiUrl}/media/${hash}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    console.error('Failed to delete image');
    return;
  }

  window.location.reload();
}

function openModal(index: number) {
  modalIndex = index;
  const item = galleryData[index];
  const url = item.url;
  const thumbnail = item.thumbnail;
  const modal = document.getElementById('modal');
  if (!modal) {
    return;
  }

  const modalImg = document.getElementById('modal-img') as HTMLImageElement;
  const modalTinyImg = document.getElementById(
    'modal-tiny-img'
  ) as HTMLImageElement;

  // Visual refresh
  modalTinyImg.style.display = 'none';
  modalImg.style.display = 'none';
  setTimeout(() => {
    modalTinyImg.style.display = 'block';
    modalImg.style.display = 'block';
    modalTinyImg.src = `${baseApiUrl}/${thumbnail}`;
    modalImg.src = `${baseApiUrl}/${url}`;
  }, 0);

  modal.classList.add('is-active');
  document.documentElement.classList.add('is-clipped');
}

function closeModal() {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img') as HTMLImageElement;
  const modalTinyImg = document.getElementById(
    'modal-tiny-img'
  ) as HTMLImageElement;
  if (!modal || !modalImg) {
    return;
  }

  modal.classList.remove('is-active');
  modalImg.src = '';
  modalTinyImg.src = '';
  document.documentElement.classList.remove('is-clipped');
}

function nextImage() {
  const nextIndex = modalIndex + 1;

  if (nextIndex >= galleryData.length) {
    openModal(0);
  } else {
    openModal(nextIndex);
  }
}

function prevImage() {
  const prevIndex = modalIndex - 1;

  if (prevIndex < 0) {
    openModal(galleryData.length - 1);
  } else {
    openModal(prevIndex);
  }
}

// Fetch gallery on init
getGallery();

// Attach del button to DOM for the special user.
(() => {
  if (isSpecial) {
    const elem = document.getElementById('special');

    if (!elem) {
      return;
    }

    // Ensure type safety since we are binding this func to innerHTML string below.
    const delFn = window._tie.delImage;
    delFn;

    elem.innerHTML = `
    <button id="modal-del" class="icon is-medium" onclick="window._tie.delImage()">
      <span class="icon">
        <i class="trash-ico"></i>
      </span>
      </button>
    `;
  }
})();

// Watch escape btn and close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
