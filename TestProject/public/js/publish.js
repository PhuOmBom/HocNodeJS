const request = async (url, options = {}) => {
  const response = await fetch(url, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed.');
  return data;
};

const toast = (message) => {
  const element = document.querySelector('#toast');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  setTimeout(() => { element.hidden = true; }, 3000);
};

let allCategories = [];
let selectedCategories = new Map();
let uploadedImages = [];
const maxImageSize = 10 * 1024 * 1024; // 10MB

function encodeImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size >= maxImageSize) {
      reject(new Error(`File ${file.name} exceeds the maximum 10MB limit.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function updateLivePreview() {
  const title = document.querySelector('#inputTitle').value.trim() || 'Your Book Title Here';
  const author = document.querySelector('#inputAuthor').value.trim() || 'Author Name';
  const price = Number(document.querySelector('#inputPrice').value) || 0;
  const originalPrice = Number(document.querySelector('#inputOriginalPrice').value) || 0;
  const stock = document.querySelector('#inputStock').value !== '' ? Number(document.querySelector('#inputStock').value) : 0;

  document.querySelector('#previewTitle').textContent = title;
  document.querySelector('#previewAuthor').textContent = author;
  document.querySelector('#previewPrice').textContent = `$${price.toFixed(2)}`;
  document.querySelector('#previewStock').textContent = stock > 0 ? `${stock} in stock` : 'Out of stock';

  const previewChipsContainer = document.querySelector('#previewCatChipsList');
  if (previewChipsContainer) {
    if (selectedCategories.size > 0) {
      previewChipsContainer.innerHTML = Array.from(selectedCategories.values()).map((c) => `
        <span class="preview-cat-chip has-cat">${c.name}</span>
      `).join('');
    } else {
      previewChipsContainer.innerHTML = '<span class="preview-cat-chip">Category Unselected</span>';
    }
  }

  const oldPriceElem = document.querySelector('#previewOldPrice');
  const discountTag = document.querySelector('#previewDiscountTag');
  const discountIndicator = document.querySelector('#discountIndicator');
  const discountValue = document.querySelector('#discountValue');

  if (originalPrice > price && price > 0) {
    const pct = Math.round(((originalPrice - price) / originalPrice) * 100);
    oldPriceElem.textContent = `$${originalPrice.toFixed(2)}`;
    oldPriceElem.hidden = false;
    discountTag.textContent = `-${pct}%`;
    discountTag.hidden = false;
    if (discountIndicator && discountValue) {
      discountValue.textContent = `${pct}% ($${(originalPrice - price).toFixed(2)})`;
      discountIndicator.hidden = false;
    }
  } else {
    oldPriceElem.hidden = true;
    discountTag.hidden = true;
    if (discountIndicator) discountIndicator.hidden = true;
  }

  const coverElem = document.querySelector('#previewCover');
  if (uploadedImages.length > 0) {
    coverElem.src = uploadedImages[0];
  } else {
    coverElem.src = '/css/avatar-placeholder.svg';
  }
}

function renderGalleryPreview() {
  const container = document.querySelector('#imageGalleryPreview');
  container.innerHTML = uploadedImages.map((src, index) => `
    <div class="gallery-thumb-item ${index === 0 ? 'is-cover' : ''}">
      <img src="${src}" alt="Artwork ${index + 1}">
      <div class="thumb-badge">${index === 0 ? 'Cover' : `#${index + 1}`}</div>
      <button type="button" class="remove-thumb-btn" data-remove-index="${index}" title="Remove image">✕</button>
      ${index > 0 ? `<button type="button" class="set-cover-btn" data-cover-index="${index}" title="Set as primary cover">Set Cover</button>` : ''}
    </div>
  `).join('');

  container.querySelectorAll('[data-remove-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.removeIndex);
      uploadedImages.splice(idx, 1);
      renderGalleryPreview();
      updateLivePreview();
    });
  });

  container.querySelectorAll('[data-cover-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.coverIndex);
      const [chosen] = uploadedImages.splice(idx, 1);
      uploadedImages.unshift(chosen);
      renderGalleryPreview();
      updateLivePreview();
    });
  });
}

async function handleFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  const invalid = files.find((f) => !f.type.startsWith('image/'));
  if (invalid) throw new Error('Only valid image files (PNG, JPG, WEBP) are supported.');
  const total = files.reduce((sum, f) => sum + f.size, 0);
  if (total >= 14 * 1024 * 1024) throw new Error('Total image size must be under 14MB.');

  const encoded = await Promise.all(files.map(encodeImage));
  uploadedImages = [...uploadedImages, ...encoded];
  renderGalleryPreview();
  updateLivePreview();
}

// Category picker logic
function setupCategoryPicker() {
  const searchInput = document.querySelector('#categorySearchInput');
  const dropdown = document.querySelector('#categoryDropdownList');
  const chipsWrap = document.querySelector('#selectedCategoriesWrap');
  const chipsList = document.querySelector('#selectedCategoryChips');
  const counter = document.querySelector('#selectedCatCounter');
  const clearAllBtn = document.querySelector('#clearAllCategoriesBtn');
  const clearBtn = document.querySelector('#clearCategoryBtn');
  const pillsContainer = document.querySelector('#quickCategoryPills');

  // Popular genres
  const popularPillNames = ['Japanese Manga', 'Fiction & Novels', 'Business & Finance', 'Self-Help & Personal Growth', 'Mystery & Thriller', 'Light Novels', 'Computer Science & AI'];
  const popularCategories = allCategories.filter((c) => popularPillNames.includes(c.name));

  function renderPills() {
    pillsContainer.innerHTML = '<span class="pill-label">Popular genres:</span>' + popularCategories.map((c) => {
      const isSelected = selectedCategories.has(c._id);
      return `
        <button type="button" class="category-pill-btn ${isSelected ? 'active' : ''}" data-pill-id="${c._id}">
          ${isSelected ? '✓ ' : ''}${c.name}
        </button>
      `;
    }).join('');

    pillsContainer.querySelectorAll('.category-pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = allCategories.find((c) => c._id === btn.dataset.pillId);
        if (cat) toggleCategory(cat);
      });
    });
  }

  function renderSelectedChips() {
    if (selectedCategories.size === 0) {
      chipsWrap.hidden = true;
      counter.textContent = '0 selected';
      counter.classList.remove('has-count');
    } else {
      chipsWrap.hidden = false;
      counter.textContent = `${selectedCategories.size} selected`;
      counter.classList.add('has-count');
      chipsList.innerHTML = Array.from(selectedCategories.values()).map((c) => `
        <span class="selected-cat-chip">
          <span class="chip-icon">🏷️</span>
          <span class="chip-name">${c.name}</span>
          <button type="button" class="remove-cat-chip-btn" data-remove-id="${c._id}" title="Remove ${c.name}">✕</button>
        </span>
      `).join('');

      chipsList.querySelectorAll('.remove-cat-chip-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cat = selectedCategories.get(btn.dataset.removeId);
          if (cat) toggleCategory(cat);
        });
      });
    }
  }

  function toggleCategory(cat) {
    if (selectedCategories.has(cat._id)) {
      selectedCategories.delete(cat._id);
    } else {
      selectedCategories.set(cat._id, cat);
    }
    renderPills();
    renderSelectedChips();
    renderDropdown(allCategories, searchInput.value.trim());
    updateLivePreview();
  }

  clearAllBtn.addEventListener('click', () => {
    selectedCategories.clear();
    renderPills();
    renderSelectedChips();
    renderDropdown(allCategories, searchInput.value.trim());
    updateLivePreview();
  });

  function renderDropdown(list, query = '') {
    if (!list.length) {
      dropdown.innerHTML = `<div class="cat-dropdown-empty">No genres matching "<strong>${query}</strong>"</div>`;
      dropdown.hidden = false;
      return;
    }
    dropdown.innerHTML = list.map((cat) => {
      const isSelected = selectedCategories.has(cat._id);
      let displayName = cat.name;
      if (query) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        displayName = cat.name.replace(regex, '<mark>$1</mark>');
      }
      return `
        <div class="cat-option-item ${isSelected ? 'is-selected' : ''}" data-cat-id="${cat._id}">
          <div class="cat-option-main">
            <strong>${isSelected ? '✓ ' : ''}${displayName}</strong>
            ${cat.description ? `<small>${cat.description}</small>` : ''}
          </div>
          <span class="cat-select-arrow">${isSelected ? 'Added' : '+ Add'}</span>
        </div>
      `;
    }).join('');

    dropdown.querySelectorAll('.cat-option-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const cat = allCategories.find((c) => c._id === item.dataset.catId);
        if (cat) toggleCategory(cat);
      });
    });
    dropdown.hidden = false;
  }

  searchInput.addEventListener('focus', () => {
    renderDropdown(allCategories, searchInput.value.trim());
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    clearBtn.hidden = !q;
    const filtered = allCategories.filter((cat) => cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q)));
    renderDropdown(filtered, q);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.hidden = true;
    renderDropdown(allCategories);
    searchInput.focus();
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.hidden = true;
    }
  });

  // Initial render of pills & chips
  renderPills();
  renderSelectedChips();
}

// Wire inputs
function setupLiveInputs() {
  ['inputTitle', 'inputAuthor', 'inputPrice', 'inputOriginalPrice', 'inputStock'].forEach((id) => {
    document.querySelector(`#${id}`)?.addEventListener('input', updateLivePreview);
  });

  const desc = document.querySelector('#inputDescription');
  const descCount = document.querySelector('#descCharCount');
  if (desc && descCount) {
    desc.addEventListener('input', () => {
      descCount.textContent = desc.value.length;
    });
  }

  // Dropzone
  const dropzone = document.querySelector('#imageDropzone');
  const fileInput = document.querySelector('#bookImagesInput');
  const msg = document.querySelector('#publishFormMessage');

  fileInput.addEventListener('change', async () => {
    try {
      await handleFiles(fileInput.files);
      msg.textContent = '';
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-message error';
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragging');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragging');
    });
  });

  dropzone.addEventListener('drop', async (e) => {
    try {
      await handleFiles(e.dataTransfer.files);
      msg.textContent = '';
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-message error';
    }
  });
}

// Form submit
function setupFormSubmit() {
  const form = document.querySelector('#publishForm');
  const submitBtn = document.querySelector('#submitPublishBtn');
  const msg = document.querySelector('#publishFormMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectedCategories.size === 0) {
      msg.textContent = 'Please select at least one genre category for the book listing.';
      msg.className = 'form-message error';
      document.querySelector('#categorySearchInput').focus();
      return;
    }

    if (!uploadedImages.length) {
      msg.textContent = 'Please upload at least one book cover artwork.';
      msg.className = 'form-message error';
      document.querySelector('#imageDropzone').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);
    payload.price = Number(payload.price);
    if (payload.originalPrice) payload.originalPrice = Number(payload.originalPrice);
    payload.stock = Number(payload.stock);
    payload.cover = uploadedImages[0];
    payload.images = uploadedImages;

    const catIds = Array.from(selectedCategories.keys());
    payload.categories = catIds;
    payload.category = catIds[0];

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-inline"></span> Publishing book...';

    try {
      await request('/api/books', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      msg.textContent = 'Listing published successfully! Redirecting...';
      msg.className = 'form-message success';
      toast('Book published successfully! 📚');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 900);
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-message error';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-text">Publish Book Listing</span>';
    }
  });
}

async function initPublishStudio() {
  try {
    const profileRes = await request('/api/auth/profile');
    const user = profileRes.user;
    if (user.role !== 'seller' && user.role !== 'admin') {
      alert('Only verified Sellers or Administrators have access to publish books.');
      window.location.href = '/';
      return;
    }

    // Load categories
    const catRes = await request('/api/categories');
    allCategories = catRes.categories || [];

    setupCategoryPicker();
    setupLiveInputs();
    setupFormSubmit();
    updateLivePreview();

    document.querySelector('#studioLogoutBtn')?.addEventListener('click', async () => {
      try { await request('/api/auth/logout', { method: 'POST' }); }
      finally { window.location.href = '/login'; }
    });
  } catch (err) {
    window.location.href = '/login';
  }
}

document.addEventListener('DOMContentLoaded', initPublishStudio);
