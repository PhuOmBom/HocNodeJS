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

const fallbackAvatar = '/css/avatar-placeholder.svg';
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const toast = (message) => {
  const element = document.querySelector('#toast');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  setTimeout(() => { element.hidden = true; }, 3200);
};

let currentUser = null;
let currentBook = null;
let cart = null;

function getBookId() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('id')) return params.get('id');
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'book' && parts[1]) return parts[1];
  return null;
}

// User Session & Navigation
async function initSession() {
  const accountName = document.querySelector('#accountName');
  const avatarImage = document.querySelector('#avatarImage');
  const accountButton = document.querySelector('#accountButton');
  const accountMenu = document.querySelector('#accountMenu');
  const logoutButton = document.querySelector('#logoutButton');
  const ordersButton = document.querySelector('#ordersButton');
  const dashboardButton = document.querySelector('#dashboardButton');
  const navPublishBtn = document.querySelector('#navPublishBtn');
  const navDashboardBtn = document.querySelector('#navDashboardBtn');
  const menuUserInfo = document.querySelector('#menuUserInfo');

  try {
    const data = await request('/api/auth/me');
    currentUser = data.user;

    if (currentUser) {
      if (accountName) accountName.textContent = currentUser.name.split(' ')[0] || currentUser.name;
      if (avatarImage && currentUser.avatar) avatarImage.src = currentUser.avatar;

      if (menuUserInfo) {
        menuUserInfo.innerHTML = `
          <strong>${currentUser.name}</strong>
          <small>${currentUser.email}</small>
          <span class="role-badge role-${currentUser.role}">${currentUser.role.toUpperCase()}</span>
        `;
      }

      if (logoutButton) logoutButton.hidden = false;
      if (ordersButton) ordersButton.hidden = false;

      if (currentUser.role === 'seller' || currentUser.role === 'admin') {
        if (navPublishBtn) navPublishBtn.hidden = false;
        if (navDashboardBtn) navDashboardBtn.hidden = false;
        if (dashboardButton) dashboardButton.hidden = false;
      }
    }
  } catch {
    currentUser = null;
    if (accountButton) {
      accountButton.onclick = () => { window.location.href = '/login'; };
    }
  }

  if (accountButton && currentUser) {
    accountButton.onclick = (e) => {
      e.stopPropagation();
      accountMenu.hidden = !accountMenu.hidden;
    };
    document.addEventListener('click', () => {
      if (accountMenu) accountMenu.hidden = true;
    });
  }

  if (logoutButton) {
    logoutButton.onclick = async () => {
      await request('/api/auth/logout', { method: 'POST' }).catch(() => {});
      window.location.reload();
    };
  }

  if (ordersButton) {
    ordersButton.onclick = () => {
      if (accountMenu) accountMenu.hidden = true;
      openOrdersDrawer();
    };
  }
}

// Cart Management
async function loadCart() {
  try {
    const data = await request('/api/cart');
    cart = data.cart;
    updateCartUI();
  } catch {
    cart = { items: [] };
    updateCartUI();
  }
}

function updateCartUI() {
  const countBadge = document.querySelector('#cartCount');
  const itemsContainer = document.querySelector('#cartItems');
  const totalAmountElem = document.querySelector('#cartTotalAmount');

  const rawItems = cart?.items || [];
  const items = rawItems.filter((item) => item && item.bookId);

  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  if (countBadge) countBadge.textContent = totalItems;

  const totalCost = items.reduce((sum, item) => {
    const p = item.bookId?.price ?? item.price ?? 0;
    return sum + p * item.quantity;
  }, 0);

  if (totalAmountElem) totalAmountElem.textContent = money(totalCost);

  if (itemsContainer) {
    if (!items.length) {
      itemsContainer.innerHTML = `
        <div class="empty-cart-view">
          <div class="empty-cart-icon-wrap">🛒</div>
          <h3>Your Cart is Empty</h3>
          <p>Looks like you haven't added any books to your bag yet.</p>
          <button type="button" class="button button-outline button-sm" onclick="closeCartDrawer()">Start Browsing</button>
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = items.map((item) => {
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

    wireCartControls();
  }
}

function wireCartControls() {
  document.querySelectorAll('.cart-qty-btn.decrease').forEach((btn) => {
    btn.onclick = async () => {
      const bId = btn.dataset.bookId;
      const itm = cart.items.find((i) => (i.bookId?._id || i.bookId).toString() === bId);
      if (itm && itm.quantity > 1) {
        await request(`/api/cart/items/${bId}`, { method: 'PATCH', body: JSON.stringify({ quantity: itm.quantity - 1 }) });
      } else {
        await request(`/api/cart/items/${bId}`, { method: 'DELETE' });
      }
      loadCart();
    };
  });

  document.querySelectorAll('.cart-qty-btn.increase').forEach((btn) => {
    btn.onclick = async () => {
      const bId = btn.dataset.bookId;
      const itm = cart.items.find((i) => (i.bookId?._id || i.bookId).toString() === bId);
      if (itm) {
        await request(`/api/cart/items/${bId}`, { method: 'PATCH', body: JSON.stringify({ quantity: itm.quantity + 1 }) });
        loadCart();
      }
    };
  });

  document.querySelectorAll('.cart-remove-link').forEach((btn) => {
    btn.onclick = async () => {
      await request(`/api/cart/items/${btn.dataset.bookId}`, { method: 'DELETE' });
      loadCart();
    };
  });
}

function openCartDrawer() {
  document.querySelector('#cartDrawer').hidden = false;
  document.querySelector('#cartBackdrop').hidden = false;
}

function closeCartDrawer() {
  document.querySelector('#cartDrawer').hidden = true;
  document.querySelector('#cartBackdrop').hidden = true;
}

// User Orders Drawer
async function openOrdersDrawer() {
  const drawer = document.querySelector('#ordersDrawer');
  const backdrop = document.querySelector('#ordersBackdrop');
  const list = document.querySelector('#userOrdersList');

  drawer.hidden = false;
  backdrop.hidden = false;
  list.innerHTML = '<p class="muted" style="padding:20px; text-align:center;">Loading purchase history...</p>';

  try {
    const res = await request('/api/orders/my');
    const orders = res.orders || [];

    if (!orders.length) {
      list.innerHTML = '<p class="empty-state" style="padding:40px 20px; text-align:center; color:var(--muted);">You haven\'t placed any orders yet.</p>';
      return;
    }

    list.innerHTML = orders.map((o) => `
      <article class="order-card-compact" style="border:1px solid var(--line); border-radius:8px; padding:14px; margin-bottom:12px; background:#fff;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="font-size:13px;">Order #${o._id.slice(-6).toUpperCase()}</strong>
          <span class="role-badge" style="background:var(--mint);">${(o.status || 'pending').toUpperCase()}</span>
        </div>
        <small class="muted" style="display:block; margin-bottom:8px;">${new Date(o.createdAt).toLocaleDateString()} • Total: <strong style="color:var(--ink);">${money(o.total)}</strong></small>
        <div style="font-size:12px; line-height:1.5;">
          ${o.items.map((it) => `<div>• ${it.title} (×${it.quantity}) - ${money(it.price)}</div>`).join('')}
        </div>
      </article>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p class="form-message error">${err.message}</p>`;
  }
}

// Main Book Detail Loader
async function loadBookDetail() {
  const bookId = getBookId();
  if (!bookId) {
    document.querySelector('#detailLoading').hidden = true;
    document.querySelector('#detailError').hidden = false;
    return;
  }

  try {
    const data = await request(`/api/books/${bookId}`);
    currentBook = data.book;

    if (!currentBook) {
      document.querySelector('#detailLoading').hidden = true;
      document.querySelector('#detailError').hidden = false;
      return;
    }

    renderBookDetail(currentBook);
    loadRelatedBooks(currentBook);
  } catch (err) {
    console.error('Failed to load book:', err);
    document.querySelector('#detailLoading').hidden = true;
    document.querySelector('#detailError').hidden = false;
  }
}

function renderBookDetail(book) {
  document.querySelector('#detailLoading').hidden = true;
  document.querySelector('#detailContent').hidden = false;

  // Title & Metadata
  document.title = `${book.title} | BookOnl Marketplace`;
  document.querySelector('#pageTitle').textContent = `${book.title} by ${book.author} | BookOnl`;

  // Breadcrumbs
  const categoryName = book.category?.name || 'Literature';
  const categoryId = book.category?._id || book.category;
  const breadcrumbGenre = document.querySelector('#breadcrumbGenre');
  breadcrumbGenre.textContent = categoryName;
  breadcrumbGenre.href = `/category?id=${categoryId}`;
  document.querySelector('#breadcrumbTitle').textContent = book.title;

  // Media
  const coverUrl = book.cover || (book.images && book.images[0]) || fallbackAvatar;
  const coverImg = document.querySelector('#detailCoverImg');
  coverImg.src = coverUrl;
  coverImg.alt = book.title;

  // Category Badge
  const catBadge = document.querySelector('#detailCategoryBadge');
  catBadge.textContent = categoryName;
  catBadge.href = `/category?id=${categoryId}`;

  // Title & Author
  document.querySelector('#detailTitle').textContent = book.title;
  document.querySelector('#detailAuthor').textContent = book.author || 'Unknown Author';

  // Rating & Sold
  document.querySelector('#detailRating').textContent = Number(book.rating || 4.8).toFixed(1);
  document.querySelector('#detailReviewCount').textContent = `(${book.reviewCount || 120} reviews)`;
  document.querySelector('#detailSoldTag').textContent = book.sold > 0 ? `Sold ${book.sold}` : 'New Release';

  // Prices
  const priceElem = document.querySelector('#detailPriceNow');
  priceElem.textContent = money(book.price);

  const origElem = document.querySelector('#detailPriceOriginal');
  const discountElem = document.querySelector('#detailDiscountTag');

  if (book.originalPrice && book.originalPrice > book.price) {
    origElem.textContent = money(book.originalPrice);
    origElem.hidden = false;
    const pct = Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100);
    discountElem.textContent = `-${pct}%`;
    discountElem.hidden = false;
  } else {
    origElem.hidden = true;
    discountElem.hidden = true;
  }

  // Stock Status
  const stockDot = document.querySelector('#stockDot');
  const stockText = document.querySelector('#stockStatusText');
  const addCartBtn = document.querySelector('#detailAddCartBtn');
  const buyNowBtn = document.querySelector('#detailBuyNowBtn');
  const qtyInput = document.querySelector('#qtyInput');

  if (book.stock > 0) {
    stockDot.className = 'stock-dot in-stock';
    stockText.textContent = `In Stock (${book.stock} copies available)`;
    addCartBtn.disabled = false;
    buyNowBtn.disabled = false;
    qtyInput.max = book.stock;
  } else {
    stockDot.className = 'stock-dot out-of-stock';
    stockText.textContent = 'Currently Out of Stock';
    addCartBtn.disabled = true;
    buyNowBtn.disabled = true;
    qtyInput.disabled = true;
  }

  // Description
  document.querySelector('#detailDescription').textContent = book.description || 'No detailed synopsis provided for this book.';

  // Specifications
  document.querySelector('#specFormat').textContent = book.format || 'Paperback';
  document.querySelector('#specPublisher').textContent = book.publisher || 'Publishing House';
  document.querySelector('#specYear').textContent = book.publishedYear || 'N/A';
  document.querySelector('#specPages').textContent = book.pages ? `${book.pages} pages` : 'N/A';
  document.querySelector('#specIsbn').textContent = book.isbn || 'N/A';
  document.querySelector('#specLanguage').textContent = book.language || 'English';
  document.querySelector('#specSeller').textContent = 'BookOnl Flagship Bookstore';

  // Setup Buttons
  setupDetailActions(book);
}

function setupDetailActions(book) {
  const qtyInput = document.querySelector('#qtyInput');
  const qtyMinusBtn = document.querySelector('#qtyMinusBtn');
  const qtyPlusBtn = document.querySelector('#qtyPlusBtn');
  const addCartBtn = document.querySelector('#detailAddCartBtn');
  const buyNowBtn = document.querySelector('#detailBuyNowBtn');

  qtyMinusBtn.onclick = () => {
    let val = parseInt(qtyInput.value, 10) || 1;
    if (val > 1) qtyInput.value = val - 1;
  };

  qtyPlusBtn.onclick = () => {
    let val = parseInt(qtyInput.value, 10) || 1;
    const max = book.stock || 99;
    if (val < max) qtyInput.value = val + 1;
  };

  addCartBtn.onclick = async () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    const qty = parseInt(qtyInput.value, 10) || 1;
    addCartBtn.disabled = true;
    addCartBtn.textContent = 'Adding...';

    try {
      await request('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ bookId: book._id, quantity: qty })
      });
      await loadCart();
      toast(`Added ${qty} × "${book.title}" to cart!`);
      openCartDrawer();
    } catch (err) {
      toast(err.message || 'Could not add to cart.');
    } finally {
      addCartBtn.disabled = false;
      addCartBtn.textContent = '🛒 Add to Cart';
    }
  };

  buyNowBtn.onclick = async () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    const qty = parseInt(qtyInput.value, 10) || 1;
    buyNowBtn.disabled = true;
    buyNowBtn.textContent = 'Processing...';

    try {
      await request('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ bookId: book._id, quantity: qty })
      });
      await loadCart();
      openCheckoutModal();
    } catch (err) {
      toast(err.message || 'Error processing purchase.');
    } finally {
      buyNowBtn.disabled = false;
      buyNowBtn.textContent = '⚡ Buy Now';
    }
  };

  // Tabs switching
  document.querySelectorAll('.detail-tab-btn').forEach((tabBtn) => {
    tabBtn.onclick = () => {
      document.querySelectorAll('.detail-tab-btn').forEach((b) => b.classList.remove('active'));
      tabBtn.classList.add('active');

      const target = tabBtn.dataset.tab;
      document.querySelector('#tabSynopsis').hidden = target !== 'synopsis';
      document.querySelector('#tabSpecs').hidden = target !== 'specs';
    };
  });
}

// Load Related Books in same genre
async function loadRelatedBooks(book) {
  const categoryId = book.category?._id || book.category;
  if (!categoryId) return;

  try {
    const data = await request(`/api/books?category=${categoryId}`);
    const related = (data.books || []).filter((b) => b._id !== book._id);

    if (related.length > 0) {
      const section = document.querySelector('#relatedSection');
      const rail = document.querySelector('#relatedBooksRail');
      const genreTitle = document.querySelector('#relatedGenreTitle');

      genreTitle.textContent = `More in ${book.category?.name || 'this Genre'}`;
      section.hidden = false;

      rail.innerHTML = related.slice(0, 10).map((b) => {
        const cover = b.cover || (b.images && b.images[0]) || fallbackAvatar;
        const catName = b.category?.name || 'Book';
        const hasDiscount = b.originalPrice && b.originalPrice > b.price;
        const discountPct = hasDiscount ? Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100) : 0;

        return `
          <article class="book-card" data-book-id="${b._id}" title="View details for ${b.title}">
            <div class="cover-frame">
              <img src="${cover}" alt="${b.title}" loading="lazy" onerror="this.onerror=null; this.src='/css/avatar-placeholder.svg';">
              <span class="book-badge">${b.sold > 0 ? `Sold ${b.sold}` : 'Popular'}</span>
              ${hasDiscount ? `<span class="discount-pill">-${discountPct}%</span>` : ''}
            </div>
            <div class="book-info">
              <span class="book-genre-chip">${catName}</span>
              <h3 title="${b.title}">${b.title}</h3>
              <p title="${b.author}">${b.author || 'Author'}</p>
              <div class="book-meta">
                <div class="price-box">
                  <strong>${money(b.price)}</strong>
                  ${hasDiscount ? `<del>${money(b.originalPrice)}</del>` : ''}
                </div>
                <span>${b.stock > 0 ? `${b.stock} available` : '<span class="out-text">Out of stock</span>'}</span>
              </div>
              <button class="add-cart" data-book-id="${b._id}" ${b.stock < 1 ? 'disabled' : ''}>
                ${b.stock > 0 ? '+ Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </article>
        `;
      }).join('');

      // Wire buttons for related books
      rail.querySelectorAll('.book-card').forEach((card) => {
        card.onclick = (e) => {
          if (e.target.closest('.add-cart')) return;
          const id = card.dataset.bookId;
          if (id) window.location.href = `/book-detail?id=${id}`;
        };
      });

      rail.querySelectorAll('.add-cart').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          if (!currentUser) {
            window.location.href = '/login';
            return;
          }
          const bId = btn.dataset.bookId;
          try {
            await request('/api/cart/items', { method: 'POST', body: JSON.stringify({ bookId: bId, quantity: 1 }) });
            await loadCart();
            toast('Added to cart!');
            openCartDrawer();
          } catch (err) {
            toast(err.message || 'Could not add to cart.');
          }
        };
      });
    }
  } catch (err) {
    console.warn('Could not load related books:', err);
  }
}

// Checkout Modal
function openCheckoutModal() {
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }
  closeCartDrawer();
  const modal = document.querySelector('#checkoutModal');
  const totalAmountElem = document.querySelector('#checkoutTotalAmount');
  const message = document.querySelector('#checkoutMessage');

  if (message) message.textContent = '';
  modal.hidden = false;

  const total = cart?.items?.reduce((sum, item) => {
    const p = item.bookId?.price ?? item.price ?? 0;
    return sum + p * item.quantity;
  }, 0) || 0;

  if (totalAmountElem) totalAmountElem.textContent = money(total);

  if (currentUser) {
    const nameInput = document.querySelector('#checkoutRecipientName');
    const phoneInput = document.querySelector('#checkoutPhone');
    const addressInput = document.querySelector('#checkoutAddress');

    if (nameInput && !nameInput.value) nameInput.value = currentUser.name || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone || '';
    if (addressInput && !addressInput.value) addressInput.value = currentUser.address || '';
  }
}

function setupModals() {
  document.querySelector('#cartButton')?.addEventListener('click', openCartDrawer);
  document.querySelector('#closeCart')?.addEventListener('click', closeCartDrawer);
  document.querySelector('#cartBackdrop')?.addEventListener('click', closeCartDrawer);

  document.querySelector('#checkoutButton')?.addEventListener('click', openCheckoutModal);
  document.querySelector('#closeCheckoutModal')?.addEventListener('click', () => {
    document.querySelector('#checkoutModal').hidden = true;
  });

  document.querySelector('#closeOrdersDrawer')?.addEventListener('click', () => {
    document.querySelector('#ordersDrawer').hidden = true;
    document.querySelector('#ordersBackdrop').hidden = true;
  });
  document.querySelector('#ordersBackdrop')?.addEventListener('click', () => {
    document.querySelector('#ordersDrawer').hidden = true;
    document.querySelector('#ordersBackdrop').hidden = true;
  });

  // Checkout submit
  const checkoutForm = document.querySelector('#checkoutOrderForm');
  if (checkoutForm) {
    checkoutForm.onsubmit = async (e) => {
      e.preventDefault();
      const message = document.querySelector('#checkoutMessage');
      const submitBtn = document.querySelector('#confirmOrderBtn');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Placing Order...';

      try {
        const formData = new FormData(checkoutForm);
        const shipping = {
          name: formData.get('name'),
          phone: formData.get('phone'),
          address: formData.get('address')
        };

        const res = await request('/api/orders', {
          method: 'POST',
          body: JSON.stringify({ shipping, paymentMethod: 'cod' })
        });

        toast('🎉 Order placed successfully!');
        document.querySelector('#checkoutModal').hidden = true;
        await loadCart();
        openOrdersDrawer();
      } catch (err) {
        if (message) {
          message.textContent = err.message || 'Failed to place order.';
          message.className = 'form-message error';
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Place Order';
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initSession();
  loadCart();
  setupModals();
  loadBookDetail();
});
