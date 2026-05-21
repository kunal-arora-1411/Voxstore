/**
 * Compresses an image file client-side using canvas, then returns base64 + preview URL.
 * Keeps dimensions under maxWidth/maxHeight and uses JPEG at the given quality.
 */
export async function compressAndEncode(file, { maxWidth = 1400, maxHeight = 1400, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      const scale = Math.min(1, maxWidth / width, maxHeight / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          resolve({
            data: dataUrl.split(',')[1], // raw base64 without the data: prefix
            ext: 'jpg',
            preview: dataUrl,
            originalName: file.name,
            sizeKb: Math.round(blob.size / 1024),
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };

    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}
