// Reusable Search Bar with Multi-Genre Filter Dropdown
(function() {
  let categories = [];
  let selectedGenres = new Set();

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      categories = data.categories || [];
    } catch (e) {
      categories = [];
    }
  }

  function renderGenrePills(container, onSelectionChange) {
    if (!container) return;
    container.innerHTML = categories.map(c => {
      const isSelected = selectedGenres.has(c.name);
      return `
        <button type="button" class="search-genre-pill ${isSelected ? 'is-selected' : ''}" data-genre="${c.name}">
          <span class="pill-check">${isSelected ? '✓' : '+'}</span>
          <span class="pill-name">${c.name}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.search-genre-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const genre = btn.dataset.genre;
        if (selectedGenres.has(genre)) {
          selectedGenres.delete(genre);
        } else {
          selectedGenres.add(genre);
        }
        renderGenrePills(container, onSelectionChange);
        if (onSelectionChange) onSelectionChange(Array.from(selectedGenres));
      });
    });
  }

  function executeSearch(input) {
    const keyword = (input ? input.value : '').trim();
    const genresList = Array.from(selectedGenres);
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (genresList.length > 0) params.set('genres', genresList.join(','));

    // Navigate to dedicated search page
    window.location.href = '/search?' + params.toString();
  }

  async function initSearchComponent() {
    const searchForm = document.querySelector('#searchForm');
    const searchInput = document.querySelector('#searchInput');
    const searchDropdown = document.querySelector('#searchGenreDropdown');
    const genrePillGrid = document.querySelector('#genrePillGrid');
    const badge = document.querySelector('#searchGenreBadge');
    const countText = document.querySelector('#genreSelectedCount');
    const selectAllBtn = document.querySelector('#genreSelectAllBtn');
    const clearBtn = document.querySelector('#genreClearBtn');
    const applyBtn = document.querySelector('#applySearchBtn');

    if (!searchForm || !searchInput) return;

    await loadCategories();

    // Read current query params to pre-fill search bar
    const urlParams = new URLSearchParams(window.location.search);
    const currentQ = urlParams.get('q') || urlParams.get('search') || '';
    const currentGenres = urlParams.get('genres') || urlParams.get('categories') || '';

    if (currentQ && searchInput) {
      searchInput.value = currentQ;
    }
    if (currentGenres) {
      currentGenres.split(',').map(s => s.trim()).filter(Boolean).forEach(g => selectedGenres.add(g));
    }

    const updateBadge = () => {
      const count = selectedGenres.size;
      if (badge) {
        badge.hidden = count === 0;
        badge.textContent = `${count} genre${count > 1 ? 's' : ''}`;
      }
      if (countText) {
        countText.textContent = `(${count} selected)`;
      }
    };

    updateBadge();

    const refreshPills = () => {
      renderGenrePills(genrePillGrid, () => {
        updateBadge();
      });
    };

    refreshPills();

    // Open dropdown on focus / click
    searchInput.addEventListener('focus', () => {
      if (searchDropdown) searchDropdown.hidden = false;
    });

    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
      if (searchDropdown) searchDropdown.hidden = false;
    });

    if (searchDropdown) {
      searchDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (searchDropdown && !searchDropdown.contains(e.target) && e.target !== searchInput) {
        searchDropdown.hidden = true;
      }
    });

    // Select All
    selectAllBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      categories.forEach(c => selectedGenres.add(c.name));
      refreshPills();
      updateBadge();
    });

    // Clear
    clearBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      selectedGenres.clear();
      refreshPills();
      updateBadge();
    });

    // Search trigger: Enter key inside input
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch(searchInput);
      }
    });

    // Form submit
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSearch(searchInput);
    });

    // Apply button inside dropdown
    applyBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      executeSearch(searchInput);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchComponent);
  } else {
    initSearchComponent();
  }
})();
