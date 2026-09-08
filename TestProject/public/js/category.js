// Dedicated Category / Genre Page JavaScript (BookOnl Marketplace)

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const fallbackAvatar = '/css/avatar-placeholder.svg';

const toast = (message) => {
  const element = document.querySelector('#toast');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  setTimeout(() => { element.hidden = true; }, 3200);
};

let currentUser = null;
let currentCategory = null;
let allCategories = [];
let categoryBooks = [];
let filteredBooks = [];
let cart = null;

// Determine category ID from URL query ?id=... or pathname /category/:id
function getRequestedCategoryId() {
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get('id');
  if (queryId) return queryId;

  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'category') {
    return parts[1];
  }
  return null;
}

// 1. Fetch Auth State & Initialize User Controls
async function initAuth() {
  try {
    const data = await request('/api/auth/me');
    currentUser = data.user;

    const accountName = document.querySelector('#accountName');
    const authLinks = document.querySelector('#authLinks');
    const userLinks = document.querySelector('#userLinks');
    const avatar = document.querySelector('#avatarImage');
    const navPublishBtn = document.querySelector('#navPublishBtn');
    const navDashboardBtn = document.querySelector('#navDashboardBtn');

    if (currentUser) {
      if (accountName) accountName.textContent = currentUser.name || 'My Account';
      if (authLinks) authLinks.hidden = true;
      if (userLinks) userLinks.hidden = false;
      if (avatar && currentUser.avatar) avatar.src = currentUser.avatar;

      if (['seller', 'admin'].includes(currentUser.role)) {
        if (navPublishBtn) navPublishBtn.hidden = false;
        if (navDashboardBtn) navDashboardBtn.hidden = false;
      }
    }
  } catch (err) {
    currentUser = null;
  }
}

// Account Menu Toggle
const accountButton = document.querySelector('#accountButton');
const accountDropdown = document.querySelector('#accountDropdown');
if (accountButton && accountDropdown) {
  accountButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = accountDropdown.hidden;
    accountDropdown.hidden = !isExpanded;
    accountButton.setAttribute('aria-expanded', String(isExpanded));
  });

  document.addEventListener('click', (e) => {
    if (!accountDropdown.contains(e.target) && e.target !== accountButton) {
      accountDropdown.hidden = true;
      accountButton.setAttribute('aria-expanded', 'false');
    }
  });
}

// Logout Action
document.querySelector('#logoutButton')?.addEventListener('click', async () => {
  try {
    await request('/api/auth/logout', { method: 'POST' });
    toast('Signed out successfully.');
    setTimeout(() => { window.location.reload(); }, 600);
  } catch (err) {
    toast(err.message || 'Logout failed.');
  }
});

// Cart Controls
const cartDrawer = document.querySelector('#cartDrawer');
const cartBackdrop = document.querySelector('#cartBackdrop');

function openCartDrawer() {
  if (cartDrawer) cartDrawer.hidden = false;
  if (cartBackdrop) cartBackdrop.hidden = false;
  loadCart();
}

function closeCartDrawer() {
  if (cartDrawer) cartDrawer.hidden = true;
  if (cartBackdrop) cartBackdrop.hidden = true;
}

document.querySelector('#cartButton')?.addEventListener('click', openCartDrawer);
document.querySelector('#closeCartDrawer')?.addEventListener('click', closeCartDrawer);
cartBackdrop?.addEventListener('click', closeCartDrawer);

document.querySelector('#openCheckoutButton')?.addEventListener('click', () => {
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }
  const items = (cart?.items || []).filter((item) => item && item.bookId);
  if (!items.length) {
    toast('Your cart is empty! Please add books before checkout.');
    return;
  }
  window.location.href = '/?checkout=true';
});

async function loadCart() {
  try {
    const data = await request('/api/cart');
    cart = data.cart || { items: [] };
    renderCart();
  } catch (err) {
    cart = { items: [] };
    renderCart();
  }
}

function renderCart() {
  const badge = document.querySelector('#cartCount');
  const list = document.querySelector('#cartItemsList');
  const totalSummary = document.querySelector('#cartTotalSummary');
  if (!badge) return;

  const rawItems = cart?.items || [];
  const items = rawItems.filter((item) => item && item.bookId);
  const count = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  badge.textContent = count;

  if (list) {
    if (!items.length) {
      list.innerHTML = `
        <div class="empty-cart-view">
          <div class="empty-cart-icon-wrap">🛒</div>
          <h3>Your Cart is Empty</h3>
          <p>Looks like you haven't added any books to your bag yet.</p>
          <button type="button" class="button button-outline button-sm" onclick="closeCartDrawer()">Start Browsing</button>
        </div>
      `;
    } else {
      list.innerHTML = items.map((item) => {
        const book = item.bookId || {};
        const cover = book.cover || (book.images && book.images[0]) || fallbackAvatar;
        const price = book.price ?? item.price ?? 0;
        const bId = book._id || item.bookId;

        return `
          <div class="cart-item-row" data-book-id="${bId}">
            <img src="${cover}" alt="${book.title || 'Book'}" class="cart-item-thumb" onerror="this.onerror=null; this.src='/css/avatar-placeholder.svg';">
            <div class="cart-item-meta">
              <a href="/book-detail?id=${bId}" class="cart-item-title">${book.title || 'Book Item'}</a>
              <div class="cart-item-price-line">
                <strong class="cart-item-price">${money(price)}</strong>
                <small class="cart-item-multiplier">× ${item.quantity} = ${money(price * item.quantity)}</small>
              </div>
              <div class="cart-qty-controls">
                <div class="cart-qty-stepper">
                  <button type="button" class="cart-qty-btn decrease" data-book-id="${bId}" aria-label="Decrease quantity">−</button>
                  <span class="cart-qty-num">${item.quantity}</span>
                  <button type="button" class="cart-qty-btn increase" data-book-id="${bId}" aria-label="Increase quantity">+</button>
                </div>
                <button type="button" class="cart-remove-link" data-book-id="${bId}">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      list.querySelectorAll('.cart-qty-btn.decrease').forEach((btn) => {
        btn.onclick = async () => {
          const bId = btn.dataset.bookId;
          const itm = items.find((x) => (x.bookId?._id || x.bookId).toString() === bId);
          if (!itm) return;
          const newQty = itm.quantity - 1;
          await updateCartQty(bId, newQty);
        };
      });

      list.querySelectorAll('.cart-qty-btn.increase').forEach((btn) => {
        btn.onclick = async () => {
          const bId = btn.dataset.bookId;
          const itm = items.find((x) => (x.bookId?._id || x.bookId).toString() === bId);
          if (!itm) return;
          const newQty = itm.quantity + 1;
          await updateCartQty(bId, newQty);
        };
      });

      list.querySelectorAll('.cart-remove-link').forEach((btn) => {
        btn.onclick = async () => {
          await updateCartQty(btn.dataset.bookId, 0);
        };
      });
    }
  }

  if (totalSummary) {
    const totalCost = items.reduce((sum, item) => {
      const p = item.bookId?.price ?? item.price ?? 0;
      return sum + p * item.quantity;
    }, 0);
    totalSummary.textContent = money(totalCost);
  }
}

async function updateCartQty(bookId, quantity) {
  try {
    const data = await request('/api/cart/items', {
      method: 'PUT',
      body: JSON.stringify({ bookId, quantity })
    });
    cart = data.cart;
    renderCart();
  } catch (err) {
    toast(err.message);
  }
}

async function addToCart(bookId, event) {
  if (event) event.stopPropagation();
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }
  try {
    const data = await request('/api/cart/items', {
      method: 'POST',
      body: JSON.stringify({ bookId, quantity: 1 })
    });
    cart = data.cart;
    renderCart();
    toast('Added book to your cart!');
    if (cartDrawer) cartDrawer.hidden = false;
  } catch (err) {
    toast(err.message || 'Failed to add to cart.');
  }
}

// 2. Render Genre Header & Breadcrumb
function renderGenreHero(category, books) {
  const pageTitle = document.querySelector('#categoryPageTitle');
  const breadcrumb = document.querySelector('#categoryBreadcrumbName');
  const heroTitle = document.querySelector('#genreHeroTitle');
  const heroDesc = document.querySelector('#genreHeroDesc');
  const bookCount = document.querySelector('#genreBookCount');
  const avgRating = document.querySelector('#genreAvgRating');

  const title = category?.name || 'Curated Books';
  if (pageTitle) pageTitle.textContent = `${title} | BookOnl Marketplace`;
  if (breadcrumb) breadcrumb.textContent = title;
  if (heroTitle) heroTitle.textContent = title;
  if (heroDesc) heroDesc.textContent = category?.description || `Discover hand-picked bestsellers, classic releases and trending hits in ${title}.`;
  if (bookCount) bookCount.textContent = books.length;

  if (avgRating && books.length) {
    const sum = books.reduce((acc, b) => acc + (b.rating || 4.8), 0);
    avgRating.textContent = (sum / books.length).toFixed(1);
  }
}

// 3. Render Quick Category Switcher Pills
function renderCategoryPills(categories, activeCatId) {
  const container = document.querySelector('#categoryPillList');
  if (!container) return;

  container.innerHTML = `
    <button type="button" class="cat-pill-item" onclick="window.location.href='/'">🏠 Storefront</button>
    ${categories.map((cat) => `
      <button type="button" class="cat-pill-item ${cat._id === activeCatId ? 'active' : ''}" data-cat-id="${cat._id}">
        ${cat.name}
      </button>
    `).join('')}
  `;

  container.querySelectorAll('.cat-pill-item[data-cat-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.catId;
      if (targetId !== activeCatId) {
        window.history.pushState({}, '', `/category?id=${targetId}`);
        switchCategory(targetId);
      }
    });
  });
}

// 4. Render Anime/Book Card Grid (Styled like Image 4)
function renderAnimeBookGrid(books) {
  const grid = document.querySelector('#genreBooksGrid');
  const countLabel = document.querySelector('#resultsCount');
  if (!grid) return;

  if (countLabel) {
    countLabel.textContent = `Showing ${books.length} title${books.length === 1 ? '' : 's'}`;
  }

  if (!books.length) {
    grid.innerHTML = `
      <div class="empty-genre-box">
        <span class="empty-icon">📚</span>
        <h3>No books found matching your criteria</h3>
        <p>Try clearing your search keyword or browse another genre above.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = books.map((book) => {
    const cover = book.cover || (book.images && book.images[0]) || fallbackAvatar;
    const ratingScore = Number(book.rating || 4.8).toFixed(1);
    
    // Tag on top right: Tập / Sold count / Hot
    let cornerTag = 'HOT';
    if (book.sold > 0) {
      cornerTag = `BÁN ${book.sold}`;
    } else if (book.publishedYear) {
      cornerTag = `${book.publishedYear}`;
    }

    const viewsCount = (book.sold ? book.sold * 12 + 1800 : 2500).toLocaleString();

    return `
      <article class="anime-book-card" data-book-id="${book._id}" title="View details: ${book.title}">
        <!-- Cover Art Frame -->
        <div class="anime-cover-frame">
          <img src="${cover}" alt="${book.title}" loading="lazy" onerror="this.onerror=null; this.src='/css/avatar-placeholder.svg';">
          
          <!-- Top Left Rating Badge (Like Image 4) -->
          <div class="badge-star-rating" title="Rating ${ratingScore} / 5.0">
            <span class="star-icon">⭐</span>
            <span class="score-val">${ratingScore}</span>
          </div>

          <!-- Top Right Corner Badge (Like Image 4) -->
          <div class="badge-corner-tag">
            <span>${cornerTag}</span>
          </div>

          <!-- Quick hover overlay button -->
          <div class="card-quick-overlay">
            <button type="button" class="quick-add-btn" data-book-id="${book._id}">
              + Add to Cart
            </button>
          </div>
        </div>

        <!-- Book Meta -->
        <div class="anime-card-meta">
          <h3 class="anime-card-title" title="${book.title}">${book.title}</h3>
          <div class="anime-card-sub">
            <span class="view-count" title="Sales: ${book.sold || 0}">Lượt xem: ${viewsCount}</span>
            <span class="card-price">${money(book.price)}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Wire click events
  grid.querySelectorAll('.anime-book-card').forEach((card) => {
    card.onclick = (e) => {
      if (e.target.closest('.quick-add-btn')) return;
      const bId = card.dataset.bookId;
      if (bId) {
        window.location.href = `/book-detail?id=${bId}`;
      }
    };
  });

  grid.querySelectorAll('.quick-add-btn').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.bookId, e);
    };
  });
}

// 5. Apply In-Genre Search & Sorting
function applyFiltersAndSort() {
  const searchTerm = document.querySelector('#genreSearchInput')?.value.trim().toLowerCase() || '';
  const sortMode = document.querySelector('#sortSelect')?.value || 'bestselling';

  let list = [...categoryBooks];

  // In-category search filter
  if (searchTerm) {
    list = list.filter((b) =>
      b.title.toLowerCase().includes(searchTerm) ||
      (b.author && b.author.toLowerCase().includes(searchTerm)) ||
      (b.description && b.description.toLowerCase().includes(searchTerm))
    );
  }

  // Sort logic
  if (sortMode === 'bestselling') {
    list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  } else if (sortMode === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortMode === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (sortMode === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (sortMode === 'newest') {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortMode === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  filteredBooks = list;
  renderAnimeBookGrid(filteredBooks);
}

// 6. Search execution & dynamic category switching
async function performSearch(queryTerm, genresParam) {
  const grid = document.querySelector('#genreBooksGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="grid-loading">
        <div class="spinner"></div>
        <p>Searching book catalog...</p>
      </div>
    `;
  }

  const pageTitle = document.querySelector('#categoryPageTitle');
  const breadcrumb = document.querySelector('#categoryBreadcrumbName');
  const heroTitle = document.querySelector('#genreHeroTitle');
  const heroDesc = document.querySelector('#genreHeroDesc');
  const bookCount = document.querySelector('#genreBookCount');
  const avgRating = document.querySelector('#genreAvgRating');

  const titleText = queryTerm ? `Search: "${queryTerm}"` : (genresParam ? `Filtered: ${genresParam}` : 'Explore All Books');
  if (pageTitle) pageTitle.textContent = `${titleText} | BookOnl Marketplace`;
  if (breadcrumb) breadcrumb.textContent = 'Search & Explore';
  if (heroTitle) heroTitle.textContent = titleText;
  
  let descText = 'Showing matching results';
  if (queryTerm) descText += ` for keyword "${queryTerm}"`;
  if (genresParam) descText += ` in genre(s): ${genresParam}`;
  if (heroDesc) heroDesc.textContent = descText + '.';

  renderCategoryPills(allCategories, null);

  try {
    const params = new URLSearchParams();
    if (queryTerm) params.set('search', queryTerm);
    if (genresParam) params.set('genres', genresParam);
    
    const bookData = await request(`/api/books?${params.toString()}`);
    categoryBooks = bookData.books || [];
    if (bookCount) bookCount.textContent = categoryBooks.length;
    if (avgRating && categoryBooks.length) {
      const sum = categoryBooks.reduce((acc, b) => acc + (b.rating || 4.8), 0);
      avgRating.textContent = (sum / categoryBooks.length).toFixed(1);
    }
    applyFiltersAndSort();
  } catch (err) {
    if (grid) {
      grid.innerHTML = `<div class="empty-genre-box"><p>Failed to load search results: ${err.message}</p></div>`;
    }
  }
}

async function switchCategory(categoryId) {
  const grid = document.querySelector('#genreBooksGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="grid-loading">
        <div class="spinner"></div>
        <p>Loading genre collection...</p>
      </div>
    `;
  }

  currentCategory = allCategories.find((c) => c._id === categoryId) || null;
  renderCategoryPills(allCategories, categoryId);

  try {
    const bookData = await request(`/api/books?category=${categoryId}`);
    categoryBooks = bookData.books || [];
    renderGenreHero(currentCategory, categoryBooks);
    applyFiltersAndSort();
  } catch (err) {
    if (grid) {
      grid.innerHTML = `<div class="empty-genre-box"><p>Failed to load books: ${err.message}</p></div>`;
    }
  }
}

// 7. Initial Page Load
async function initCategoryPage() {
  await Promise.all([initAuth(), loadCart()]);

  // Load categories
  try {
    const catData = await request('/api/categories');
    allCategories = catData.categories || [];
  } catch (err) {
    console.error('Failed to load categories:', err);
    allCategories = [];
  }

  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q') || urlParams.get('search') || '';
  const genres = urlParams.get('genres') || urlParams.get('categories') || '';
  const isSearchPath = window.location.pathname.startsWith('/search');

  if (isSearchPath || q || genres) {
    await performSearch(q, genres);
  } else {
    let catId = getRequestedCategoryId();
    if (!catId && allCategories.length > 0) {
      catId = allCategories[0]._id;
    }
    if (catId) {
      await switchCategory(catId);
    }
  }

  // Setup search & sort events
  document.querySelector('#genreSearchInput')?.addEventListener('input', applyFiltersAndSort);
  document.querySelector('#sortSelect')?.addEventListener('change', applyFiltersAndSort);

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const pQ = params.get('q') || params.get('search');
    const pG = params.get('genres') || params.get('categories');
    if (window.location.pathname.startsWith('/search') || pQ || pG) {
      performSearch(pQ || '', pG || '');
    } else {
      const newId = getRequestedCategoryId() || (allCategories[0] && allCategories[0]._id);
      if (newId) switchCategory(newId);
    }
  });
}

initCategoryPage();
