const request = async (url, options = {}) => {
  const response = await fetch(url, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
};

const fallbackAvatar = '/css/avatar-placeholder.svg';
const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const showMessage = (element, message, success = false) => { if (!element) return; element.textContent = message; element.className = `form-message ${success ? 'success' : 'error'}`; };
const toast = (message) => { const element = document.querySelector('#toast'); element.textContent = message; element.hidden = false; setTimeout(() => { element.hidden = true; }, 2400); };
const setAvatar = (element, value) => {
  if (!element) return;
  element.onerror = () => {
    element.onerror = null;
    element.src = fallbackAvatar;
  };
  element.src = value || fallbackAvatar;
};

async function submitAuthForm(form, endpoint, successUrl) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#formMessage');
    const submitButton = form.querySelector('.auth-submit, .button[type="submit"]');
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = endpoint === 'login' ? 'Signing in...' : 'Creating account...'; }
    try { const data = await request(`/api/auth/${endpoint}`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); showMessage(message, data.message, true); setTimeout(() => { window.location.href = successUrl; }, 450); }
    catch (error) { showMessage(message, error.message); message.focus(); if (submitButton) { submitButton.disabled = false; submitButton.textContent = endpoint === 'login' ? 'Sign in' : 'Create account'; } }
  });
}
if (document.querySelector('#loginForm')) submitAuthForm(document.querySelector('#loginForm'), 'login', '/');
if (document.querySelector('#registerForm')) submitAuthForm(document.querySelector('#registerForm'), 'register', '/login');

document.querySelectorAll('[data-password-toggle]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const input = document.querySelector(`#${toggle.dataset.passwordToggle}`);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.textContent = isPassword ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(isPassword));
  });
});

let currentUser = null;
let books = [];
let cart = null;

function bookCard(book) {
  const cover = book.cover || (book.images && book.images[0]) || fallbackAvatar;
  return `<article class="book-card"><div class="cover-frame"><img src="${cover}" alt="${book.title}"><span class="book-badge">${book.sold > 0 ? 'Bestseller' : 'New'}</span></div><div class="book-info"><h3>${book.title}</h3><p>${book.author || 'Unknown author'}</p><div class="book-meta"><strong>${money(book.price)}</strong><span>${book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}</span></div><button class="add-cart" data-book-id="${book._id}" ${book.stock < 1 ? 'disabled' : ''}>${book.stock > 0 ? 'Add to cart' : 'Unavailable'}</button></div></article>`;
}

function renderRail(element, list) { element.innerHTML = list.length ? list.slice(0, 15).map(bookCard).join('') : '<p class="empty-state">No books here yet.</p>'; }
function wireBookButtons() { document.querySelectorAll('.add-cart').forEach((button) => button.addEventListener('click', () => addToCart(button.dataset.bookId))); }

async function loadCatalog(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const [bookData, categoryData] = await Promise.all([request(`/api/books${query}`), request('/api/categories')]);
  books = bookData.books || [];
  renderRail(document.querySelector('#bestSellerRail'), books);
  renderRail(document.querySelector('#newArrivalRail'), [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  const categories = categoryData.categories || [];
  document.querySelector('#categorySections').innerHTML = categories.map((category) => { const categoryBooks = books.filter((book) => book.category?._id === category._id || book.category === category._id); return `<section class="category-row"><div class="section-heading"><h2>${category.name}</h2><button class="text-link" data-category-id="${category._id}">View all →</button></div><div class="book-rail">${categoryBooks.length ? categoryBooks.slice(0, 15).map(bookCard).join('') : '<p class="empty-state">No books in this category yet.</p>'}</div></section>`; }).join('') || '<p class="empty-state">Categories will appear as sellers add books.</p>';
  wireBookButtons();
}

async function addToCart(bookId) {
  if (!currentUser) { window.location.href = '/login'; return; }
  try { cart = (await request('/api/cart/items', { method: 'POST', body: JSON.stringify({ bookId, quantity: 1 }) })).cart; renderCart(); toast('Added to cart.'); } catch (error) { toast(error.message); }
}
async function loadCart() { if (!currentUser) return; try { cart = (await request('/api/cart')).cart; renderCart(); } catch (error) { /* Cart is optional until sign in. */ } }
function renderCart() { const items = cart?.items || []; document.querySelector('#cartCount').textContent = items.reduce((sum, item) => sum + item.quantity, 0); document.querySelector('#cartItems').innerHTML = items.length ? items.map((item) => `<div class="cart-item"><img src="${item.bookId.cover || fallbackAvatar}" alt=""><div><strong>${item.bookId.title}</strong><span>${money(item.bookId.price)} × ${item.quantity}</span><button class="remove-item" data-book-id="${item.bookId._id}">Remove</button></div></div>`).join('') : '<p class="empty-state">Your cart is empty.</p>'; const total = items.reduce((sum, item) => sum + item.bookId.price * item.quantity, 0); document.querySelector('#cartTotal').textContent = money(total); document.querySelectorAll('.remove-item').forEach((button) => button.addEventListener('click', async () => { cart = (await request(`/api/cart/items/${button.dataset.bookId}`, { method: 'PATCH', body: JSON.stringify({ quantity: 0 }) })).cart; renderCart(); })); }

async function setupAccount() {
  try { currentUser = (await request('/api/auth/profile')).user; document.querySelector('#accountName').textContent = currentUser.name; setAvatar(document.querySelector('#avatarImage'), currentUser.avatar); document.querySelector('#sellerButton').hidden = currentUser.role !== 'customer' && currentUser.role !== 'user'; document.querySelector('#dashboardButton').hidden = currentUser.role !== 'seller' && currentUser.role !== 'admin'; document.querySelector('#editProfileButton').hidden = false; document.querySelector('#ordersButton').hidden = false; document.querySelector('#logoutButton').hidden = false; await loadCart(); }
  catch (error) { currentUser = null; document.querySelector('#accountName').textContent = 'Sign in'; document.querySelector('#accountMenu').hidden = true; document.querySelector('#editProfileButton').hidden = true; document.querySelector('#ordersButton').hidden = true; document.querySelector('#dashboardButton').hidden = true; document.querySelector('#sellerButton').hidden = true; document.querySelector('#logoutButton').hidden = true; }
}

async function submitSellerRequest() { const storeName = prompt('Store name'); const address = prompt('Store address'); const phone = prompt('Phone number'); if (!storeName || !address || !phone) return; try { await request('/api/seller/request', { method: 'POST', body: JSON.stringify({ storeName, address, phone, description: '' }) }); toast('Seller request submitted.'); } catch (error) { toast(error.message); } }
async function checkout() { if (!currentUser) return (window.location.href = '/login'); const fullName = prompt('Shipping name'); const phone = prompt('Phone number'); const address = prompt('Shipping address'); if (!fullName || !phone || !address) return; try { await request('/api/orders', { method: 'POST', body: JSON.stringify({ shipping: { fullName, phone, address }, paymentMethod: 'cod' }) }); cart = null; renderCart(); toast('Order placed successfully.'); } catch (error) { showMessage(document.querySelector('#cartMessage'), error.message); } }

function setupStorefront() {
  loadCatalog().catch((error) => { document.querySelector('#bestSellerRail').innerHTML = `<p class="empty-state">${error.message}</p>`; });
  setupAccount();
  document.querySelector('#searchForm').addEventListener('submit', (event) => { event.preventDefault(); loadCatalog(document.querySelector('#searchInput').value); });
  document.querySelector('#cartButton').addEventListener('click', () => { document.querySelector('#cartDrawer').hidden = false; });
  document.querySelector('#closeCart').addEventListener('click', () => { document.querySelector('#cartDrawer').hidden = true; });
  document.querySelector('#checkoutButton').addEventListener('click', checkout);
  const menu = document.querySelector('#accountMenu'); const accountButton = document.querySelector('#accountButton');
  accountButton.addEventListener('click', () => { if (!currentUser) { window.location.href = '/login'; return; } menu.hidden = !menu.hidden; accountButton.setAttribute('aria-expanded', String(!menu.hidden)); });
  document.querySelector('#sellerButton').addEventListener('click', submitSellerRequest);
  document.querySelector('#dashboardButton').addEventListener('click', () => { window.location.href = '/dashboard'; });
  document.querySelector('#logoutButton').addEventListener('click', async () => { try { await request('/api/auth/logout', { method: 'POST' }); } finally { window.location.href = '/login'; } });
  document.querySelector('#editProfileButton').addEventListener('click', () => { document.querySelector('#profileModal').hidden = false; menu.hidden = true; document.querySelector('#nameInput').value = currentUser.name; document.querySelector('#emailInput').value = currentUser.email; setAvatar(document.querySelector('#modalAvatar'), currentUser.avatar); });
  const modal = document.querySelector('#profileModal'); const closeModal = () => { modal.hidden = true; }; document.querySelector('#closeModal').addEventListener('click', closeModal); modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.querySelector('#avatarInput').addEventListener('change', async (event) => { try { setAvatar(document.querySelector('#modalAvatar'), await readAvatar(event.target.files[0])); } catch (error) { showMessage(document.querySelector('#profileMessage'), error.message); } });
  document.querySelector('#profileForm').addEventListener('submit', async (event) => { event.preventDefault(); try { const updated = await request('/api/auth/profile', { method: 'PATCH', body: JSON.stringify({ name: document.querySelector('#nameInput').value, avatar: document.querySelector('#modalAvatar').src.startsWith('data:') ? document.querySelector('#modalAvatar').src : currentUser.avatar }) }); currentUser = updated.user; document.querySelector('#accountName').textContent = currentUser.name; setAvatar(document.querySelector('#avatarImage'), currentUser.avatar); showMessage(document.querySelector('#profileMessage'), updated.message, true); } catch (error) { showMessage(document.querySelector('#profileMessage'), error.message); } });
}

if (document.querySelector('#searchForm')) setupStorefront();