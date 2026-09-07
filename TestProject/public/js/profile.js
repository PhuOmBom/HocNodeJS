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

const toast = (message) => {
  const element = document.querySelector('#toast');
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  setTimeout(() => { element.hidden = true; }, 3200);
};

const fallbackAvatar = '/css/avatar-placeholder.svg';
const maxAvatarSize = 10 * 1024 * 1024;

let currentUser = null;
let currentAddresses = [];
let pendingAvatarBase64 = null;

function renderAddressBook() {
  const container = document.querySelector('#addressBookContainer');
  const countElem = document.querySelector('#bannerAddressCount');
  if (countElem) countElem.textContent = currentAddresses.length;

  if (!currentAddresses.length) {
    container.innerHTML = `
      <div class="empty-addresses-card">
        <span class="empty-icon">📍</span>
        <h4>No shipping addresses saved</h4>
        <p>Add your first delivery address so you can place orders seamlessly.</p>
        <button type="button" class="button button-secondary button-sm" id="emptyAddAddrBtn">+ Add Address</button>
      </div>
    `;
    container.querySelector('#emptyAddAddrBtn')?.addEventListener('click', () => {
      openAddressModal();
    });
    return;
  }

  const labelIcons = {
    'Home': '🏠',
    'Office / Work': '🏢',
    'Parents / Family': '👨‍👩‍👧',
    'Apartment / Dorm': '🏬',
    'Other': '📍'
  };

  container.innerHTML = currentAddresses.map((addr) => {
    const icon = labelIcons[addr.label] || '📍';
    return `
      <div class="address-book-card ${addr.isDefault ? 'is-default-card' : ''}">
        <div class="addr-card-top">
          <div class="addr-label-wrap">
            <span class="addr-chip-label">${icon} ${addr.label || 'Home'}</span>
            ${addr.isDefault ? '<span class="default-badge">⭐ Default Shipping Address</span>' : ''}
          </div>
          <div class="addr-card-actions">
            ${!addr.isDefault ? `
              <button type="button" class="button button-outline button-xs set-default-btn" data-id="${addr._id}">
                Set as Default
              </button>
            ` : ''}
            <button type="button" class="button button-ghost button-xs delete-addr-btn" data-id="${addr._id}" title="Delete address">
              🗑️ Delete
            </button>
          </div>
        </div>

        <div class="addr-card-body">
          <div class="addr-recipient">
            <strong>${addr.recipientName || currentUser.name}</strong>
            <span class="addr-phone">📞 ${addr.phone || 'No phone'}</span>
          </div>
          <p class="addr-full-text">${addr.address}</p>
        </div>
      </div>
    `;
  }).join('');

  // Wire buttons
  container.querySelectorAll('.set-default-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        const res = await request(`/api/users/addresses/${btn.dataset.id}/default`, { method: 'PATCH' });
        currentAddresses = res.addresses || [];
        renderAddressBook();
        toast('Default shipping address updated!');
      } catch (err) {
        toast(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });

  container.querySelectorAll('.delete-addr-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to remove this shipping address?')) return;
      btn.disabled = true;
      try {
        const res = await request(`/api/users/addresses/${btn.dataset.id}`, { method: 'DELETE' });
        currentAddresses = res.addresses || [];
        renderAddressBook();
        toast('Shipping address removed.');
      } catch (err) {
        toast(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function openAddressModal() {
  const modal = document.querySelector('#addressModal');
  const form = document.querySelector('#addressForm');
  const msg = document.querySelector('#addressFormMsg');
  msg.textContent = '';
  form.reset();

  document.querySelector('#modalRecipientName').value = currentUser ? currentUser.name : '';
  document.querySelector('#modalRecipientPhone').value = currentUser ? (currentUser.phone || '') : '';
  document.querySelector('#modalIsDefault').checked = currentAddresses.length === 0;

  modal.hidden = false;
}

function setupAddressModal() {
  const modal = document.querySelector('#addressModal');
  const closeBtn = document.querySelector('#closeAddressModal');
  const openBtn = document.querySelector('#openAddAddressModalBtn');
  const form = document.querySelector('#addressForm');
  const msg = document.querySelector('#addressFormMsg');
  const saveBtn = document.querySelector('#saveAddressBtn');

  openBtn?.addEventListener('click', openAddressModal);
  closeBtn?.addEventListener('click', () => { modal.hidden = true; });
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const label = document.querySelector('#addressLabelSelect').value;
    const recipientName = document.querySelector('#modalRecipientName').value.trim();
    const phone = document.querySelector('#modalRecipientPhone').value.trim();
    const address = document.querySelector('#modalFullAddress').value.trim();
    const isDefault = document.querySelector('#modalIsDefault').checked;

    if (!address) {
      msg.textContent = 'Please enter a valid street address.';
      msg.className = 'form-message error';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Address...';

    try {
      const res = await request('/api/users/addresses', {
        method: 'POST',
        body: JSON.stringify({ label, recipientName, phone, address, isDefault })
      });
      currentAddresses = res.addresses || [];
      renderAddressBook();
      modal.hidden = true;
      toast('Delivery address added successfully! 📦');
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-message error';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Shipping Address';
    }
  });
}

function setupProfileForm() {
  const form = document.querySelector('#profileDetailsForm');
  const msg = document.querySelector('#profileFormMsg');
  const saveBtn = document.querySelector('#saveProfileBtn');
  const avatarInput = document.querySelector('#avatarFileInput');
  const avatarImg = document.querySelector('#profileUserAvatar');

  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxAvatarSize) {
      toast('Avatar image must be under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      pendingAvatarBase64 = reader.result;
      avatarImg.src = pendingAvatarBase64;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.querySelector('#inputFullName').value.trim();
    const phone = document.querySelector('#inputPrimaryPhone').value.trim();

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Changes...';

    try {
      const payload = { name, phone };
      if (pendingAvatarBase64) payload.avatar = pendingAvatarBase64;

      const res = await request('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      currentUser = res.user;
      document.querySelector('#bannerUserName').textContent = currentUser.name;
      msg.textContent = 'Profile updated successfully!';
      msg.className = 'form-message success';
      toast('Profile saved successfully! ✨');
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-message error';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Profile Changes';
    }
  });
}

async function initProfilePage() {
  try {
    const res = await request('/api/auth/profile');
    currentUser = res.user;

    // Header & Banner details
    document.querySelector('#bannerUserName').textContent = currentUser.name;
    document.querySelector('#bannerUserEmail').textContent = currentUser.email;
    const roleBadge = document.querySelector('#bannerRoleBadge');
    roleBadge.textContent = currentUser.role.toUpperCase();
    if (currentUser.role === 'admin') roleBadge.classList.add('role-admin');
    else if (currentUser.role === 'seller') roleBadge.classList.add('role-seller');

    const avatarImg = document.querySelector('#profileUserAvatar');
    avatarImg.onerror = () => { avatarImg.src = fallbackAvatar; };
    avatarImg.src = currentUser.avatar || fallbackAvatar;

    if (currentUser.role === 'seller' || currentUser.role === 'admin') {
      document.querySelector('#topPublishBtn')?.removeAttribute('hidden');
      document.querySelector('#topDashboardBtn')?.removeAttribute('hidden');
      document.querySelector('#topPublishLink')?.removeAttribute('hidden');
      document.querySelector('#navDashboardBtn')?.removeAttribute('hidden');
    }

    const roleSub = document.querySelector('#profileRoleSubtitle');
    if (roleSub) {
      roleSub.textContent = currentUser.role.toUpperCase();
      roleSub.className = `brand-subtitle dash-role-badge role-${currentUser.role}`;
    }

    // Populate inputs
    document.querySelector('#inputFullName').value = currentUser.name;
    document.querySelector('#inputEmailDisabled').value = currentUser.email;
    document.querySelector('#inputPrimaryPhone').value = currentUser.phone || '';

    // Load addresses
    currentAddresses = currentUser.shippingAddresses || [];
    renderAddressBook();

    setupProfileForm();
    setupAddressModal();

    document.querySelector('#logoutBtn').addEventListener('click', async () => {
      try { await request('/api/auth/logout', { method: 'POST' }); }
      finally { window.location.href = '/login'; }
    });
  } catch (err) {
    window.location.href = '/login';
  }
}

document.addEventListener('DOMContentLoaded', initProfilePage);
