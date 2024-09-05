// --- Hack ---
// In order to `npm run build` this file properly.
// @ts-ignore
window.zpr = {
  upload,
  openModal,
  closeModal,
};

const isLocalhost = import.meta.url.match('//localhost');
const isPublicIP = import.meta.url.match(/\/\/(\d+\.\d+\.\d+\.\d+)/);

const baseApiUrl = isLocalhost
  ? // running npm run dev -- --host
    'http://localhost:3000'
  : // running npx serve -s dist -p 5173
  isPublicIP
  ? `http://${isPublicIP[1]}`
  : // from domain(production)
    '.';

async function upload(input: HTMLInputElement) {
  console.log('uploading..');
  const filesList = input.files;

  if (!filesList || filesList.length === 0) {
    console.log('no file selected');
    return;
  }

  input.classList.add('is-loading');

  const files = Array.from(filesList);
  const chunkSize = 3;
  const totalChunks = Math.ceil(files.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end =
      start + chunkSize > files.length ? files.length : start + chunkSize;
    const chunkFiles = files.slice(start, end);

    const formData = new FormData();
    Array.from(chunkFiles).forEach((file, idx) => {
      formData.append(String(idx), file);
    });

    try {
      await fetch(`${baseApiUrl}/media`, {
        method: 'POST',
        body: formData,
      });
    } catch (err) {
      console.error(err);
    }
  }

  input.classList.remove('is-loading');
  window.location.reload();
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
  const html = data
    .map((item: any) => {
      return `
      <div class="cell">
        <figure class="image">
          <img  src=${baseApiUrl}/${item.thumbnail} onclick="window.zpr.openModal(this, '${item.url}')" />
        </figure>
      </div>`;
    })
    .join('');

  gallery.innerHTML = html;
}

function openModal(_: HTMLImageElement, url: string) {
  const modal = document.getElementById('modal');
  if (!modal) {
    return;
  }

  const modalImg = document.getElementById('modal-img') as HTMLImageElement;
  modalImg.src = `${baseApiUrl}/${url}`;
  modal.classList.add('is-active');
  document.documentElement.classList.add('is-clipped');
}

function closeModal() {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img') as HTMLImageElement;
  if (!modal || !modalImg) {
    return;
  }

  modal.classList.remove('is-active');
  modalImg.src = '';
  document.documentElement.classList.remove('is-clipped');
}

getGallery();

// watch escape btn and close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
