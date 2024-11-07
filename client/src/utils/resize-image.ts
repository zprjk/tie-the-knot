type ResizeImageOptions = {
  maxSize: number;
  file: File;
};

/**
 * Resize an image to a maximum size
 *
 * @example
 * ```ts
 * const someFile = document.getElementById('file').files[0];
 * const resizedFile = await resizeImage({
 *  maxSize: 3000, // Max 3MB file size
 *  file: someFile
 * });
 *
 * console.log(resizedFile); // Blob
 * ```
 */
export function resizeImage(settings: ResizeImageOptions): Promise<Blob> {
  const file = settings.file;
  const fileMimeType = file.type;
  const maxSize = settings.maxSize;
  const reader = new FileReader();
  const image = new Image();
  const canvas = new OffscreenCanvas(1, 1); // https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas

  const resize = () => {
    let width = image.width;
    let height = image.height;

    if (width > height) {
      if (width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(image, 0, 0, width, height);

    return canvas.convertToBlob();
  };

  return new Promise((ok, no) => {
    if (!fileMimeType.match(/image.*/)) {
      no(new Error('Not an image'));
      return;
    }

    reader.onload = (readerEvent: any) => {
      image.onload = () => ok(resize());
      image.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  });
}
