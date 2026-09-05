function readAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (file.size >= 10 * 1024 * 1024) return reject(new Error('The image must be smaller than 10MB.'));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });
}