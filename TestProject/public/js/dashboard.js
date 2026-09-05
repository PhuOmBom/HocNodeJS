const dashboardRequest = async (url, options = {}) => { const response = await fetch(url, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || 'Request failed.'); return data; };
const stat = (label, value) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
const maxImageSize = 10 * 1024 * 1024;
let encodedBookImages = [];

function encodeImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size >= maxImageSize) {
      reject(new Error(`${file.name} must be smaller than 10MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function renderImagePreview() {
  document.querySelector('#imagePreview').innerHTML = encodedBookImages.map((image, index) => `<div class="preview-item"><img src="${image}" alt="Book image ${index + 1}"><button type="button" data-remove-image="${index}" aria-label="Remove image">×</button>${index === 0 ? '<span>Cover</span>' : ''}</div>`).join('');
  document.querySelectorAll('[data-remove-image]').forEach((button) => button.addEventListener('click', () => { encodedBookImages.splice(Number(button.dataset.removeImage), 1); renderImagePreview(); }));
}

async function handleBookImages(fileList) {
  const files = [...fileList];
  if (files.some((file) => !file.type.startsWith('image/'))) throw new Error('Only image files are allowed.');
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  if (totalSize >= 12 * 1024 * 1024) throw new Error('The total image size must be smaller than 12MB.');
  encodedBookImages = await Promise.all(files.map(encodeImage));
  renderImagePreview();
}

async function setupBookForm() {
  const panel = document.querySelector('#addBookPanel');
  const categories = (await dashboardRequest('/api/categories')).categories;
  panel.hidden = false;
  document.querySelector('#bookCategory').innerHTML = categories.map((category) => `<option value="${category._id}">${category.name}</option>`).join('');
  const dropzone = document.querySelector('#imageDropzone');
  const imageInput = document.querySelector('#bookImages');
  const imageMessage = document.querySelector('#bookFormMessage');
  imageInput.addEventListener('change', async () => { try { await handleBookImages(imageInput.files); imageMessage.textContent = ''; } catch (error) { imageMessage.textContent = error.message; imageMessage.className = 'form-message error'; } });
  ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('is-dragging'); }));
  ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('is-dragging'); }));
  dropzone.addEventListener('drop', async (event) => { try { await handleBookImages(event.dataTransfer.files); imageMessage.textContent = ''; } catch (error) { imageMessage.textContent = error.message; imageMessage.className = 'form-message error'; } });
  document.querySelector('#addBookForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.querySelector('#bookFormMessage');
    const data = Object.fromEntries(new FormData(form));
    data.price = Number(data.price);
    data.stock = Number(data.stock);
    if (!encodedBookImages.length) { message.textContent = 'Please add at least one book image.'; message.className = 'form-message error'; return; }
    data.cover = encodedBookImages[0];
    data.images = encodedBookImages;
    try { await dashboardRequest('/api/books', { method: 'POST', body: JSON.stringify(data) }); form.reset(); encodedBookImages = []; renderImagePreview(); message.textContent = 'Book published successfully.'; message.className = 'form-message success'; loadDashboard(); }
    catch (error) { message.textContent = error.message; message.className = 'form-message error'; }
  });
}
async function loadSellerRequests() {
  const panel = document.querySelector('#sellerRequestsPanel');
  const list = (await dashboardRequest('/api/seller/requests?status=pending')).requests;
  panel.hidden = false;
  document.querySelector('#requestCount').textContent = `${list.length} pending`;
  document.querySelector('#sellerRequests').innerHTML = list.length ? list.map((request) => `<div class="request-row"><div><strong>${request.storeName}</strong><span>${request.phone}</span></div><span>${request.address}</span><span>${new Date(request.createdAt).toLocaleDateString()}</span><div class="request-actions"><button class="approve-button" data-request-id="${request._id}" data-decision="approved">Approve</button><button class="reject-button" data-request-id="${request._id}" data-decision="rejected">Reject</button></div></div>`).join('') : '<p class="empty-state">No pending seller requests.</p>';
  document.querySelectorAll('[data-request-id]').forEach((button) => button.addEventListener('click', async () => {
    button.disabled = true;
    await dashboardRequest(`/api/seller/requests/${button.dataset.requestId}/review`, { method: 'PATCH', body: JSON.stringify({ status: button.dataset.decision }) });
    loadSellerRequests();
  }));
}
async function loadDashboard() {
  try {
    const profile = (await dashboardRequest('/api/auth/profile')).user;
    if (profile.role === 'admin') { const data = await dashboardRequest('/api/admin/overview'); document.querySelector('#dashboardTitle').textContent = 'Admin overview'; document.querySelector('#dashboardEyebrow').textContent = 'SYSTEM CONTROL'; document.querySelector('#dashboardStats').innerHTML = stat('Revenue', `$${data.revenue.toFixed(2)}`) + stat('Users', data.users) + stat('Books', data.books) + stat('Orders', data.orders); const users = (await dashboardRequest('/api/admin/users')).users; document.querySelector('#tableTitle').textContent = 'Users'; document.querySelector('#dashboardTable').innerHTML = users.map((user) => `<div class="table-row"><strong>${user.name}</strong><span>${user.email}</span><span>${user.role}</span><span>${user.isBanned ? 'Banned' : 'Active'}</span></div>`).join(''); await loadSellerRequests(); await setupBookForm(); }
    else if (profile.role === 'seller') { const data = await dashboardRequest('/api/seller-dashboard'); document.querySelector('#dashboardTitle').textContent = 'Seller dashboard'; document.querySelector('#dashboardEyebrow').textContent = 'YOUR STORE'; document.querySelector('#dashboardStats').innerHTML = stat('Products', data.totalProducts) + stat('Sold', data.totalSold) + stat('Revenue', `$${data.totalRevenue.toFixed(2)}`) + stat('Orders', data.orders.length); document.querySelector('#tableTitle').textContent = 'Your books'; document.querySelector('#dashboardTable').innerHTML = data.books.map((book) => `<div class="table-row"><strong>${book.title}</strong><span>${book.stock} in stock</span><span>${book.sold} sold</span><span>$${book.price.toFixed(2)}</span></div>`).join(''); await setupBookForm(); }
    else throw new Error('This account has no dashboard access.');
  } catch (error) { document.querySelector('#dashboardTitle').textContent = error.message; }
}
loadDashboard();