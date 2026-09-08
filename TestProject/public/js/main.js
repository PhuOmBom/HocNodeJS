const request = async (url, options = {}) => {
  const response = await fetch(url, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

const fallbackAvatar = '/css/avatar-placeholder.svg';
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const showMessage = (element, message, success = false) => {
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${success ? 'success' : 'error'}`;
};

const toast = (message) => {
  const element = document.querySelector('#toast');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  setTimeout(() => { element.hidden = true; }, 3200);
};

const setAvatar = (element, value) => {
  if (!element) return;
  element.onerror = () => {
    element.onerror = null;
    element.src = fallbackAvatar;
  };
  element.src = value || fallbackAvatar;
};

// Auth forms (Login & Register)
async function submitAuthForm(form, endpoint, successUrl) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#formMessage');
    const submitButton = form.querySelector('.auth-submit, .button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = endpoint === 'login' ? 'Signing in...' : 'Creating account...';
    }

    try {
      const payload = Object.fromEntries(new FormData(form));
      const data = await request(`/api/auth/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showMessage(message, data.message || (endpoint === 'login' ? 'Signed in successfully!' : 'Account created successfully!'), true);
      setTimeout(() => { window.location.href = successUrl; }, 500);
    } catch (error) {
      showMessage(message, error.message);
      message.focus();
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = endpoint === 'login' ? 'Sign in' : 'Create account';
      }
    }
  });
}

if (document.querySelector('#loginForm')) submitAuthForm(document.querySelector('#loginForm'), 'login', '/');
if (document.querySelector('#registerForm')) submitAuthForm(document.querySelector('#registerForm'), 'register', '/login');

// Password toggle
document.querySelectorAll('[data-password-toggle]').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const input = document.querySelector(`#${toggle.dataset.passwordToggle}`);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.textContent = isPassword ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(isPassword));
  });
});

// Top announcement ticker with dynamic marketing stimulus questions
function initAnnouncementTicker() {
  const ticker = document.querySelector('#announcementTicker');
  const badge = document.querySelector('#tickerBadge');
  const text = document.querySelector('#tickerText');
  if (!ticker || !badge || !text) return;

  const messages = [
    {
      badge: 'FLASH SALE',
      badgeColor: 'var(--accent)',
      html: '✨ Enjoy Free Standard Shipping on all orders over $35 | Code: <strong>READ2026</strong>'
    },
    {
      badge: 'CAREER BOOST',
      badgeColor: '#10b981',
      html: '💡 Looking for a breakthrough? Master Web Dev, Python & AI with 20% off bestselling guides!'
    },
    {
      badge: 'WEALTH MINDSET',
      badgeColor: '#f59e0b',
      html: '📈 Struggling to grow your finances? Discover Wall Street’s top investment & business playbooks!'
    },
    {
      badge: 'INNER PEACE',
      badgeColor: '#8b5cf6',
      html: '🌱 Feeling overwhelmed or facing tough hurdles? Find balance with curated Personal Growth reads!'
    },
    {
      badge: 'READING ESCAPE',
      badgeColor: '#ec4899',
      html: '📚 Need an escape from daily routine? Dive into gripping Manga, Light Novels & Sci-Fi adventures!'
    },
    {
      badge: 'TIMELESS WISDOM',
      badgeColor: '#0ea5e9',
      html: '🎯 Seeking life answers & clarity? Explore great classic philosophy, psychology & history essentials!'
    }
  ];

  let currentIndex = 0;
  let isPaused = false;

  ticker.addEventListener('mouseenter', () => { isPaused = true; });
  ticker.addEventListener('mouseleave', () => { isPaused = false; });

  setInterval(() => {
    if (isPaused) return;
    ticker.classList.remove('ticker-anim-in');
    ticker.classList.add('ticker-anim-out');

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      const current = messages[currentIndex];
      badge.textContent = current.badge;
      badge.style.backgroundColor = current.badgeColor;
      text.innerHTML = current.html;

      ticker.classList.remove('ticker-anim-out');
      ticker.classList.add('ticker-anim-in');
    }, 380);
  }, 3600);
}
initAnnouncementTicker();

let currentUser = null;
let allBooks = [];
let allCategories = [];
let topCategories = [];
let cart = null;
let activeCategoryFilter = null;
let customPriceFilter = { min: null, max: null };

function bookCard(book) {
  const cover = book.cover || (book.images && book.images[0]) || fallbackAvatar;
  const categoryName = book.category?.name || 'Literature';
  const hasDiscount = book.originalPrice && book.originalPrice > book.price;
  const discountPct = hasDiscount ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100) : 0;

  return `
    <article class="book-card" data-book-id="${book._id}" title="Click to view details for ${book.title}">
      <div class="cover-frame">
        <img src="${cover}" alt="${book.title}" loading="lazy" onerror="this.onerror=null; this.src='/css/avatar-placeholder.svg';">
        <span class="book-badge">${book.sold > 0 ? `Sold ${book.sold}` : 'New Arrival'}</span>
        ${hasDiscount ? `<span class="discount-pill">-${discountPct}%</span>` : ''}
      </div>
      <div class="book-info">
        <span class="book-genre-chip">${categoryName}</span>
        <h3 title="${book.title}">${book.title}</h3>
        <p title="${book.author}">${book.author || 'Author'}</p>
        <div class="book-meta">
          <div class="price-box">
            <strong>${money(book.price)}</strong>
            ${hasDiscount ? `<del>${money(book.originalPrice)}</del>` : ''}
          </div>
          <span>${book.stock > 0 ? `${book.stock} available` : '<span class="out-text">Out of stock</span>'}</span>
        </div>
        <button class="add-cart" data-book-id="${book._id}" ${book.stock < 1 ? 'disabled' : ''}>
          ${book.stock > 0 ? '+ Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </article>
  `;
}

function renderRail(element, list) {
  if (!element) return;
  element.innerHTML = list.length
    ? list.slice(0, 18).map(bookCard).join('')
    : '<p class="empty-state">No books currently match this selection.</p>';
}

function wireBookButtons() {
  document.querySelectorAll('.book-card').forEach((card) => {
    card.onclick = (e) => {
      if (e.target.closest('.add-cart')) return;
      const bookId = card.dataset.bookId;
      if (bookId) {
        window.location.href = `/book-detail?id=${bookId}`;
      }
    };
  });

  document.querySelectorAll('.add-cart').forEach((button) => {
    button.onclick = (e) => {
      e.stopPropagation();
      addToCart(button.dataset.bookId);
    };
  });
}

// Compute filtered books based on Category AND Custom Price Range
function getFilteredBooks() {
  let list = [...allBooks];

  if (activeCategoryFilter) {
    list = list.filter((b) => b.category?._id === activeCategoryFilter.id || b.category === activeCategoryFilter.id);
  }

  if (customPriceFilter.min !== null) {
    list = list.filter((b) => Number(b.price) >= customPriceFilter.min);
  }
  if (customPriceFilter.max !== null) {
    list = list.filter((b) => Number(b.price) <= customPriceFilter.max);
  }

  return list;
}

function applyFilters(toastMessage = true) {
  const filtered = getFilteredBooks();
  renderRail(document.querySelector('#bestSellerRail'), filtered);
  renderRail(document.querySelector('#newArrivalRail'), [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  wireBookButtons();

  const banner = document.querySelector('#filterBanner');
  const label = document.querySelector('#filterLabelName');
  const sidebarReset = document.querySelector('#sidebarClearCategoryBtn');
  const resetPriceBtn = document.querySelector('#resetPriceFilterBtn');

  const isPriceFiltered = customPriceFilter.min !== null || customPriceFilter.max !== null;

  if (activeCategoryFilter || isPriceFiltered) {
    let filterDescription = [];
    if (activeCategoryFilter) filterDescription.push(activeCategoryFilter.name);
    if (isPriceFiltered) {
      if (customPriceFilter.min !== null && customPriceFilter.max !== null) {
        filterDescription.push(`$${customPriceFilter.min} – $${customPriceFilter.max}`);
      } else if (customPriceFilter.min !== null) {
        filterDescription.push(`≥ $${customPriceFilter.min}`);
      } else {
        filterDescription.push(`≤ $${customPriceFilter.max}`);
      }
    }
    if (banner && label) {
      label.textContent = filterDescription.join(' • ');
      banner.hidden = false;
    }
    if (sidebarReset) sidebarReset.hidden = false;
    if (resetPriceBtn) resetPriceBtn.hidden = !isPriceFiltered;
  } else {
    if (banner) banner.hidden = true;
    if (sidebarReset) sidebarReset.hidden = true;
    if (resetPriceBtn) resetPriceBtn.hidden = true;
  }

  if (toastMessage && activeCategoryFilter) {
    toast(`Filtering by genre: ${activeCategoryFilter.name}`);
  }
}

// Filter by category
function filterByCategory(categoryId, categoryName) {
  activeCategoryFilter = { id: categoryId, name: categoryName };

  // Update pills
  document.querySelectorAll('.cat-pill-item').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.catId === categoryId);
  });

  // Update sidebar category items
  document.querySelectorAll('.sidebar-cat-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.catId === categoryId);
  });

  applyFilters();

  const targetSection = document.querySelector('#bestsellers');
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function applyCustomPriceFilter(isInteractive = false) {
  const minInput = document.querySelector('#minPriceInput');
  const maxInput = document.querySelector('#maxPriceInput');
  const hint = document.querySelector('#priceFilterHint');
  const resetBtn = document.querySelector('#resetPriceFilterBtn');

  const minStr = minInput?.value.trim() ?? '';
  const maxStr = maxInput?.value.trim() ?? '';

  let minVal = minStr !== '' && !isNaN(minStr) ? parseFloat(minStr) : null;
  let maxVal = maxStr !== '' && !isNaN(maxStr) ? parseFloat(maxStr) : null;

  if (minVal !== null && minVal < 0) {
    if (hint) {
      hint.textContent = 'Min price cannot be negative.';
      hint.classList.add('error');
    }
    return;
  }

  if (minVal !== null && maxVal !== null && minVal > maxVal) {
    if (hint) {
      hint.textContent = 'Min price cannot exceed Max price.';
      hint.classList.add('error');
    }
    return;
  }

  if (hint) {
    hint.textContent = '';
    hint.classList.remove('error');
  }

  customPriceFilter.min = minVal;
  customPriceFilter.max = maxVal;

  const isFiltered = minVal !== null || maxVal !== null;
  if (resetBtn) resetBtn.hidden = !isFiltered;

  applyFilters(false);

  if (!isInteractive && isFiltered) {
    const desc = (minVal !== null && maxVal !== null)
      ? `$${minVal} – $${maxVal}`
      : minVal !== null ? `from $${minVal}` : `up to $${maxVal}`;
    toast(`Filtering books by price: ${desc}`);
  }
}

function resetCustomPriceFilter(triggerApply = true) {
  customPriceFilter = { min: null, max: null };
  const minInput = document.querySelector('#minPriceInput');
  const maxInput = document.querySelector('#maxPriceInput');
  const slider = document.querySelector('#priceRangeSlider');
  const sliderVal = document.querySelector('#sliderValueDisplay');
  const hint = document.querySelector('#priceFilterHint');
  const resetBtn = document.querySelector('#resetPriceFilterBtn');

  if (minInput) minInput.value = '';
  if (maxInput) maxInput.value = '';
  if (slider) {
    slider.value = slider.max || 60;
    if (sliderVal) sliderVal.textContent = `Max: $${slider.value}`;
  }
  if (hint) {
    hint.textContent = '';
    hint.classList.remove('error');
  }
  if (resetBtn) resetBtn.hidden = true;

  if (triggerApply) {
    applyFilters(false);
    toast('Price filter reset.');
  }
}

function clearCategoryFilter() {
  activeCategoryFilter = null;
  resetCustomPriceFilter(false);

  document.querySelectorAll('.cat-pill-item').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.catId === 'all');
  });

  document.querySelectorAll('.sidebar-cat-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  applyFilters(false);
  toast('Filters reset to all books.');
}

// 1. Setup Hero 3D Books with Top Selling Categories in real-time
async function setupHeroTopBooks() {
  try {
    const res = await request('/api/categories/top-selling');
    topCategories = res.categories || [];

    const bookConfigs = [
      { elemId: '#heroBook1', nameId: '#heroCatName1', countId: '#heroCatCount1', defaultName: 'Fiction & Novels' },
      { elemId: '#heroBook2', nameId: '#heroCatName2', countId: '#heroCatCount2', defaultName: 'Japanese Manga' },
      { elemId: '#heroBook3', nameId: '#heroCatName3', countId: '#heroCatCount3', defaultName: 'Business & Finance' }
    ];

    bookConfigs.forEach((cfg, index) => {
      const cat = topCategories[index];
      const elem = document.querySelector(cfg.elemId);
      const nameElem = document.querySelector(cfg.nameId);
      const countElem = document.querySelector(cfg.countId);

      if (cat && elem) {
        elem.dataset.categoryId = cat._id;
        elem.dataset.categoryName = cat.name;
        if (nameElem) nameElem.textContent = cat.name;
        if (countElem) {
          countElem.textContent = cat.totalSold > 0 ? `${cat.totalSold} copies sold` : (cat.bookCount > 0 ? `${cat.bookCount} titles` : 'Explore collection');
        }

        elem.onclick = () => {
          window.location.href = `/category?id=${cat._id}`;
        };
      } else if (elem && nameElem) {
        nameElem.textContent = cfg.defaultName;
      }
    });
  } catch (err) {
    console.warn('Hero top books error:', err);
  }
}

// 2. Setup Quick Category Pills
function setupQuickCategoryBar(categories) {
  const container = document.querySelector('#categoryPillList');
  if (!container) return;

  container.innerHTML = `
    <button type="button" class="cat-pill-item active" data-cat-id="all">✨ All Genres</button>
    ${categories.map((c) => `
      <button type="button" class="cat-pill-item" data-cat-id="${c._id}">${c.name}</button>
    `).join('')}
  `;

  container.querySelectorAll('.cat-pill-item').forEach((pill) => {
    pill.addEventListener('click', () => {
      const catId = pill.dataset.catId;
      if (catId === 'all') {
        clearCategoryFilter();
      } else {
        window.location.href = `/category?id=${catId}`;
      }
    });
  });
}

// 3. Setup Left Sidebar Category Tree & Price Filters
function setupLeftSidebar(categories, books) {
  const container = document.querySelector('#sidebarCategoryList');
  if (!container) return;

  // Count books per category
  const countMap = {};
  books.forEach((b) => {
    const cId = b.category?._id || b.category;
    if (cId) countMap[cId] = (countMap[cId] || 0) + 1;
  });

  container.innerHTML = categories.map((c) => {
    const count = countMap[c._id] || 0;
    return `
      <button type="button" class="sidebar-cat-btn" data-cat-id="${c._id}">
        <span class="sidebar-cat-name">${c.name}</span>
        <span class="sidebar-cat-count">${count}</span>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.sidebar-cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.catId;
      if (catId) {
        window.location.href = `/category?id=${catId}`;
      }
    });
  });

  // Custom Price Filter wiring
  const applyBtn = document.querySelector('#applyPriceFilterBtn');
  const minInput = document.querySelector('#minPriceInput');
  const maxInput = document.querySelector('#maxPriceInput');
  const slider = document.querySelector('#priceRangeSlider');
  const sliderVal = document.querySelector('#sliderValueDisplay');
  const resetPriceBtn = document.querySelector('#resetPriceFilterBtn');

  if (allBooks.length && slider) {
    const maxBookPrice = Math.ceil(Math.max(...allBooks.map((b) => b.price || 0), 40));
    slider.max = maxBookPrice;
    if (customPriceFilter.max === null) {
      slider.value = maxBookPrice;
      if (sliderVal) sliderVal.textContent = `Max: $${maxBookPrice}`;
    }
  }

  applyBtn?.addEventListener('click', () => applyCustomPriceFilter(false));

  [minInput, maxInput].forEach((inp) => {
    inp?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustomPriceFilter(false);
      }
    });
  });

  resetPriceBtn?.addEventListener('click', () => resetCustomPriceFilter(true));

  if (slider) {
    slider.addEventListener('input', () => {
      if (maxInput) maxInput.value = slider.value;
      if (sliderVal) sliderVal.textContent = `Max: $${slider.value}`;
      applyCustomPriceFilter(true);
    });
  }

  if (maxInput && slider) {
    maxInput.addEventListener('input', () => {
      const val = parseFloat(maxInput.value);
      if (!isNaN(val) && val >= parseFloat(slider.min) && val <= parseFloat(slider.max)) {
        slider.value = val;
        if (sliderVal) sliderVal.textContent = `Max: $${val}`;
      }
    });
  }

  // Reset button in sidebar
  document.querySelector('#sidebarClearCategoryBtn')?.addEventListener('click', clearCategoryFilter);
}

// 4. Load catalog
async function loadCatalog(search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const [bookData, categoryData] = await Promise.all([
    request(`/api/books${query}`),
    request('/api/categories')
  ]);

  allBooks = bookData.books || [];
  allCategories = categoryData.categories || [];

  setupQuickCategoryBar(allCategories);
  setupLeftSidebar(allCategories, allBooks);
  applyFilters(false);

  // Render category sections
  const catSection = document.querySelector('#categorySections');
  if (catSection) {
    catSection.innerHTML = allCategories.map((category) => {
      const categoryBooks = allBooks.filter((book) => book.category?._id === category._id || book.category === category._id);
      return `
        <section class="category-row">
          <div class="section-heading">
            <div>
              <h2>${category.name}</h2>
              ${category.description ? `<p class="category-desc">${category.description}</p>` : ''}
            </div>
            <button class="text-link view-cat-btn" data-category-id="${category._id}" data-category-name="${category.name}">Browse All →</button>
          </div>
          <div class="book-rail">
            ${categoryBooks.length
              ? categoryBooks.slice(0, 15).map(bookCard).join('')
              : '<p class="empty-state">No books currently listed in this category. Be the first to publish one!</p>'
            }
          </div>
        </section>
      `;
    }).join('') || '<p class="empty-state">Category rows will appear as sellers add titles.</p>';

    catSection.querySelectorAll('.view-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.categoryId;
        if (catId) {
          window.location.href = `/category?id=${catId}`;
        }
      });
    });
  }

  wireBookButtons();
}

// 5. Cart management
function openCartDrawer() {
  const drawer = document.querySelector('#cartDrawer');
  const backdrop = document.querySelector('#cartBackdrop');
  if (drawer) drawer.hidden = false;
  if (backdrop) backdrop.hidden = false;
  loadCart();
}

function closeCartDrawer() {
  const drawer = document.querySelector('#cartDrawer');
  const backdrop = document.querySelector('#cartBackdrop');
  if (drawer) drawer.hidden = true;
  if (backdrop) backdrop.hidden = true;
}

async function addToCart(bookId) {
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }
  try {
    const res = await request('/api/cart/items', { method: 'POST', body: JSON.stringify({ bookId, quantity: 1 }) });
    cart = res.cart;
    renderCart();
    toast('Book added to your shopping cart! 📖');
    openCartDrawer();
  } catch (error) {
    toast(error.message);
  }
}

async function loadCart() {
  try {
    const res = await request('/api/cart');
    cart = res.cart || { items: [] };
    renderCart();
  } catch (error) {
    cart = { items: [] };
    renderCart();
  }
}

function renderCart() {
  const rawItems = cart?.items || [];
  const items = rawItems.filter((item) => item && item.bookId);
  const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const countBadge = document.querySelector('#cartCount');
  if (countBadge) countBadge.textContent = count;

  const container = document.querySelector('#cartItems');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-cart-view">
        <div class="empty-cart-icon-wrap">🛒</div>
        <h3>Your Cart is Empty</h3>
        <p>Looks like you haven't added any books to your bag yet.</p>
        <button type="button" class="button button-outline button-sm" id="cartStartBrowsing">Start Browsing</button>
      </div>
    `;
    const browseBtn = container.querySelector('#cartStartBrowsing');
    if (browseBtn) browseBtn.onclick = closeCartDrawer;
    const totalEl = document.querySelector('#cartTotal');
    if (totalEl) totalEl.textContent = money(0);
    return;
  }

  container.innerHTML = items.map((item) => {
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
              <button type="button" class="cart-qty-btn cart-dec-btn" data-book-id="${bId}" aria-label="Decrease quantity">−</button>
              <span class="cart-qty-num">${item.quantity}</span>
              <button type="button" class="cart-qty-btn cart-inc-btn" data-book-id="${bId}" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-remove-link" data-book-id="${bId}">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const total = items.reduce((sum, item) => {
    const p = item.bookId?.price ?? item.price ?? 0;
    return sum + (p * item.quantity);
  }, 0);
  const totalEl = document.querySelector('#cartTotal');
  if (totalEl) totalEl.textContent = money(total);

  // Stepper events
  container.querySelectorAll('.cart-dec-btn').forEach((btn) => {
    btn.onclick = async () => {
      const bId = btn.dataset.bookId;
      const itm = items.find((i) => (i.bookId?._id || i.bookId).toString() === bId);
      if (!itm) return;
      try {
        const res = await request(`/api/cart/items/${bId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: itm.quantity - 1 })
        });
        cart = res.cart;
        renderCart();
      } catch (err) {
        toast(err.message);
      }
    };
  });

  container.querySelectorAll('.cart-inc-btn').forEach((btn) => {
    btn.onclick = async () => {
      const bId = btn.dataset.bookId;
      const itm = items.find((i) => (i.bookId?._id || i.bookId).toString() === bId);
      if (!itm) return;
      try {
        const res = await request(`/api/cart/items/${bId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity: itm.quantity + 1 })
        });
        cart = res.cart;
        renderCart();
      } catch (err) {
        toast(err.message);
      }
    };
  });

  container.querySelectorAll('.cart-remove-link').forEach((btn) => {
    btn.onclick = async () => {
      const bId = btn.dataset.bookId;
      try {
        const res = await request(`/api/cart/items/${bId}`, {
          method: 'DELETE'
        });
        cart = res.cart;
        renderCart();
        toast('Item removed from cart.');
      } catch (err) {
        toast(err.message);
      }
    };
  });
}

// 6. Account & Profile setup
async function setupAccount() {
  try {
    currentUser = (await request('/api/auth/profile')).user;
    document.querySelector('#accountName').textContent = currentUser.name;
    setAvatar(document.querySelector('#avatarImage'), currentUser.avatar);

    const infoElem = document.querySelector('#menuUserInfo');
    if (infoElem) {
      infoElem.innerHTML = `
        <strong>${currentUser.name}</strong>
        <small>${currentUser.email}</small>
        <span class="role-badge role-${currentUser.role}">${currentUser.role.toUpperCase()}</span>
      `;
    }

    const isSellerOrAdmin = currentUser.role === 'seller' || currentUser.role === 'admin';
    const isCustomer = currentUser.role === 'customer' || currentUser.role === 'user';

    if (document.querySelector('#navDashboardBtn')) document.querySelector('#navDashboardBtn').hidden = !isSellerOrAdmin;
    document.querySelector('#navPublishBtn').hidden = !isSellerOrAdmin;
    document.querySelector('#studioButton').hidden = !isSellerOrAdmin;
    document.querySelector('#dashboardButton').hidden = !isSellerOrAdmin;
    document.querySelector('#sellerButton').hidden = !isCustomer;

    document.querySelector('#editProfileButton').hidden = false;
    document.querySelector('#ordersButton').hidden = false;
    document.querySelector('#logoutButton').hidden = false;

    await loadCart();
  } catch (error) {
    currentUser = null;
    document.querySelector('#accountName').textContent = 'Sign in';
    document.querySelector('#accountMenu').hidden = true;
    if (document.querySelector('#navDashboardBtn')) document.querySelector('#navDashboardBtn').hidden = true;
    document.querySelector('#navPublishBtn').hidden = true;
    document.querySelector('#editProfileButton').hidden = true;
    document.querySelector('#ordersButton').hidden = true;
    document.querySelector('#studioButton').hidden = true;
    document.querySelector('#dashboardButton').hidden = true;
    document.querySelector('#sellerButton').hidden = true;
    document.querySelector('#logoutButton').hidden = true;
  }
}

// 7. Checkout Modal
function openCheckoutModal() {
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  const items = cart?.items || [];
  if (!items.length) {
    toast('Your cart is empty! Please add books before checkout.');
    return;
  }

  document.querySelector('#cartDrawer').hidden = true;
  const modal = document.querySelector('#checkoutModal');
  modal.hidden = false;

  document.querySelector('#checkoutFullName').value = currentUser.name || '';
  document.querySelector('#checkoutPhone').value = currentUser.phone || '';
  document.querySelector('#checkoutAddress').value = currentUser.address || '';

  const total = items.reduce((sum, item) => sum + (item.bookId.price * item.quantity), 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  document.querySelector('#checkoutItemCount').textContent = `${totalCount} copies`;
  document.querySelector('#checkoutTotalAmount').textContent = money(total);

  // Saved addresses
  const savedList = document.querySelector('#savedAddressesList');
  const addresses = currentUser.shippingAddresses || [];

  const labelIcons = {
    'Home': '🏠',
    'Office / Work': '🏢',
    'Parents / Family': '👨‍👩‍👧',
    'Apartment / Dorm': '🏬',
    'Other': '📍'
  };

  if (addresses.length > 0) {
    const defaultIndex = addresses.findIndex(a => a.isDefault);
    const selectedIndex = defaultIndex !== -1 ? defaultIndex : 0;
    const selectedAddr = addresses[selectedIndex];

    document.querySelector('#checkoutFullName').value = selectedAddr.recipientName || currentUser.name || '';
    document.querySelector('#checkoutPhone').value = selectedAddr.phone || currentUser.phone || '';
    document.querySelector('#checkoutAddress').value = selectedAddr.address || '';

    savedList.innerHTML = addresses.map((addr, idx) => {
      const icon = labelIcons[addr.label] || '📍';
      const isChecked = idx === selectedIndex;
      return `
        <label class="checkout-address-option ${isChecked ? 'is-selected' : ''}" data-idx="${idx}">
          <input type="radio" name="checkoutAddressChoice" value="${idx}" ${isChecked ? 'checked' : ''}>
          <div class="checkout-address-info">
            <strong>${icon} ${addr.label || 'Address'} ${addr.isDefault ? '<span class="default-badge" style="font-size:9px; padding:1px 6px;">Default</span>' : ''} — ${addr.recipientName || currentUser.name} (📞 ${addr.phone || currentUser.phone || 'No phone'})</strong>
            <p>${addr.address}</p>
          </div>
        </label>
      `;
    }).join('') + `
      <label class="checkout-address-option" data-idx="custom">
        <input type="radio" name="checkoutAddressChoice" value="custom">
        <div class="checkout-address-info">
          <strong>➕ Deliver to a new address</strong>
          <p>Specify a different shipping destination and recipient below</p>
        </div>
      </label>
    `;

    savedList.querySelectorAll('input[name="checkoutAddressChoice"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        savedList.querySelectorAll('.checkout-address-option').forEach(el => el.classList.remove('is-selected'));
        radio.closest('.checkout-address-option').classList.add('is-selected');

        if (radio.value === 'custom') {
          document.querySelector('#checkoutFullName').value = currentUser.name || '';
          document.querySelector('#checkoutPhone').value = currentUser.phone || '';
          document.querySelector('#checkoutAddress').value = '';
          document.querySelector('#checkoutAddress').focus();
        } else {
          const chosen = addresses[Number(radio.value)];
          if (chosen) {
            document.querySelector('#checkoutFullName').value = chosen.recipientName || currentUser.name || '';
            document.querySelector('#checkoutPhone').value = chosen.phone || currentUser.phone || '';
            document.querySelector('#checkoutAddress').value = chosen.address || '';
          }
        }
      });
    });
  } else {
    savedList.innerHTML = '';
    document.querySelector('#checkoutFullName').value = currentUser.name || '';
    document.querySelector('#checkoutPhone').value = currentUser.phone || '';
    document.querySelector('#checkoutAddress').value = currentUser.address || '';
  }
}

function setupCheckout() {
  const checkoutBtn = document.querySelector('#checkoutButton');
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);

  const modal = document.querySelector('#checkoutModal');
  const closeBtn = document.querySelector('#closeCheckoutModal');
  if (closeBtn) closeBtn.addEventListener('click', () => { modal.hidden = true; });
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.hidden = true;
    });
  }

  const form = document.querySelector('#checkoutForm');
  const submitBtn = document.querySelector('#confirmOrderBtn');
  const msg = document.querySelector('#checkoutMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.querySelector('#checkoutFullName').value.trim();
    const phone = document.querySelector('#checkoutPhone').value.trim();
    const address = document.querySelector('#checkoutAddress').value.trim();

    if (!fullName || !phone || !address) {
      showMessage(msg, 'Please provide your Full Name, Contact Phone, and Shipping Address.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-inline"></span> Placing order...';

    try {
      const res = await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          shipping: { fullName, phone, address },
          paymentMethod: 'cod'
        })
      });

      modal.hidden = true;
      cart = null;
      renderCart();
      toast(`🎉 Order placed successfully! Order ID: ${res.order.orderID}`);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm & Place Order';
    } catch (err) {
      showMessage(msg, err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Confirm & Place Order';
    }
  });
}

// 8. Orders history right sidebar drawer
async function openOrdersDrawer() {
  const drawer = document.querySelector('#ordersDrawer');
  const backdrop = document.querySelector('#ordersBackdrop');
  const container = document.querySelector('#userOrdersList');
  if (!drawer || !container) return;

  drawer.hidden = false;
  if (backdrop) backdrop.hidden = false;
  container.innerHTML = '<p class="table-loading">Loading your order records...</p>';

  try {
    // Specifically fetch the current user's personal purchases
    const res = await request('/api/orders/my-orders');
    const orders = res.orders || [];

    if (!orders.length) {
      container.innerHTML = `
        <div class="empty-cart-view">
          <span class="empty-icon">📦</span>
          <h4>No orders yet</h4>
          <p>You have not placed any book orders yet.</p>
          <a href="#bestsellers" class="button button-primary button-sm" onclick="document.querySelector('#ordersDrawer').hidden=true; if(document.querySelector('#ordersBackdrop')) document.querySelector('#ordersBackdrop').hidden=true;">Shop Bestsellers</a>
        </div>
      `;
      return;
    }

    const statusMap = {
      pending: { label: 'Pending', color: 'status-pending' },
      confirmed: { label: 'Confirmed', color: 'status-confirmed' },
      processing: { label: 'Packing', color: 'status-processing' },
      shipped: { label: 'In Transit', color: 'status-shipped' },
      delivered: { label: 'Delivered', color: 'status-delivered' },
      cancelled: { label: 'Cancelled', color: 'status-cancelled' }
    };

    container.innerHTML = orders.map((o) => {
      const st = statusMap[o.status] || { label: o.status, color: '' };
      return `
        <div class="user-order-card">
          <div class="user-order-head">
            <div>
              <strong>Order: ${o.orderID}</strong>
              <small>${new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(o.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <span class="status-pill ${st.color}">${st.label}</span>
          </div>
          <div class="user-order-items">
            ${(o.items || []).map((i) => `
              <div class="user-order-item-row">
                <span>${i.title} × ${i.quantity}</span>
                <strong>${money(i.subtotal)}</strong>
              </div>
            `).join('')}
          </div>
          <div class="user-order-shipping-info">
            <span>📍 Ship to: ${o.shipping?.fullName ? `${o.shipping.fullName} — ` : ''}${o.shipping?.address || 'Pickup'} (📞 ${o.shipping?.phone || ''})</span>
            <div class="user-order-total">
              <span>Order Total:</span>
              <strong>${money(o.total)}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="form-message error">${err.message}</p>`;
  }
}

// 9. Seller application modal
function setupSellerRequestModal() {
  const modal = document.querySelector('#sellerModal');
  const btn = document.querySelector('#sellerButton');
  const closeBtn = document.querySelector('#closeSellerModal');
  const form = document.querySelector('#sellerRequestForm');
  const msg = document.querySelector('#sellerRequestMessage');

  if (btn) btn.addEventListener('click', () => { modal.hidden = false; document.querySelector('#accountMenu').hidden = true; });
  if (closeBtn) closeBtn.addEventListener('click', () => { modal.hidden = true; });
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      try {
        await request('/api/seller/request', { method: 'POST', body: JSON.stringify(payload) });
        modal.hidden = true;
        toast('Application submitted! Our curation team will review shortly.');
      } catch (err) {
        showMessage(msg, err.message);
      }
    });
  }
}

// 10. Storefront Initialization
function setupStorefront() {
  loadCatalog().catch((error) => {
    document.querySelector('#bestSellerRail').innerHTML = `<p class="empty-state">${error.message}</p>`;
  });
  
  setupHeroTopBooks();
  setupAccount().then(() => {
    if (new URLSearchParams(window.location.search).get('checkout') === 'true') {
      if (!currentUser) {
        window.location.href = '/login';
      } else {
        setTimeout(() => openCheckoutModal(), 200);
      }
    }
  });
  setupCheckout();
  setupSellerRequestModal();

  document.querySelector('#clearFilterBtn')?.addEventListener('click', clearCategoryFilter);
  document.querySelector('#viewAllBooksBtn')?.addEventListener('click', clearCategoryFilter);

  // Cart
  document.querySelector('#cartButton')?.addEventListener('click', openCartDrawer);
  document.querySelector('#closeCart')?.addEventListener('click', closeCartDrawer);
  document.querySelector('#cartBackdrop')?.addEventListener('click', closeCartDrawer);

  // Account dropdown
  const menu = document.querySelector('#accountMenu');
  const accountButton = document.querySelector('#accountButton');
  accountButton.addEventListener('click', () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    menu.hidden = !menu.hidden;
    accountButton.setAttribute('aria-expanded', String(!menu.hidden));
  });

  document.addEventListener('click', (e) => {
    if (!accountButton.contains(e.target) && !menu.contains(e.target)) {
      menu.hidden = true;
    }
  });

  document.querySelector('#studioButton')?.addEventListener('click', () => { window.location.href = '/publish'; });
  document.querySelector('#dashboardButton')?.addEventListener('click', () => { window.location.href = '/dashboard'; });
  
  // Navigate to dedicated profile page
  document.querySelector('#editProfileButton')?.addEventListener('click', () => {
    menu.hidden = true;
    window.location.href = '/profile';
  });

  // Open right sidebar orders drawer
  document.querySelector('#ordersButton')?.addEventListener('click', () => {
    menu.hidden = true;
    openOrdersDrawer();
  });

  const ordersDrawer = document.querySelector('#ordersDrawer');
  const ordersBackdrop = document.querySelector('#ordersBackdrop');
  const closeOrdersDrawer = () => {
    if (ordersDrawer) ordersDrawer.hidden = true;
    if (ordersBackdrop) ordersBackdrop.hidden = true;
  };
  document.querySelector('#closeOrdersDrawer')?.addEventListener('click', closeOrdersDrawer);
  ordersBackdrop?.addEventListener('click', closeOrdersDrawer);

  document.querySelector('#logoutButton').addEventListener('click', async () => {
    try { await request('/api/auth/logout', { method: 'POST' }); }
    finally { window.location.href = '/login'; }
  });
}

if (document.querySelector('#searchForm')) setupStorefront();