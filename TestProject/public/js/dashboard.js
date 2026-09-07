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
  setTimeout(() => { element.hidden = true; }, 2800);
};

let currentUser = null;
let currentTab = 'overview';

// Format currency
const money = (v) => `$${Number(v || 0).toFixed(2)}`;

// Stat card generator
const statCard = (icon, label, value, subtext = '') => `
  <div class="stat-card">
    <div class="stat-card-top">
      <span class="stat-icon-wrap">${icon}</span>
      <span class="stat-label">${label}</span>
    </div>
    <strong class="stat-value">${value}</strong>
    ${subtext ? `<small class="stat-subtext">${subtext}</small>` : ''}
  </div>
`;

// Tab switching
function setupTabs() {
  const tabButtons = document.querySelectorAll('.dash-tab');
  const panes = {
    overview: document.querySelector('#paneOverview'),
    books: document.querySelector('#paneBooks'),
    orders: document.querySelector('#paneOrders'),
    users: document.querySelector('#paneUsers'),
    sellerRequests: document.querySelector('#paneSellerRequests')
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      currentTab = tab;
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      Object.keys(panes).forEach((k) => {
        if (panes[k]) {
          panes[k].hidden = k !== tab;
          panes[k].classList.toggle('active', k === tab);
        }
      });

      // Load specific tab data
      if (tab === 'books') loadBooksInventory();
      if (tab === 'orders') loadOrders();
      if (tab === 'users' && currentUser.role === 'admin') loadUsers();
      if (tab === 'sellerRequests' && currentUser.role === 'admin') loadSellerRequests();
    });
  });
}

// 1. Load Overview
async function loadOverview() {
  const statsContainer = document.querySelector('#dashboardStats');
  const recentTable = document.querySelector('#recentActivityTable');

  if (currentUser.role === 'admin') {
    const data = await request('/api/admin/overview');
    statsContainer.innerHTML = 
      statCard('💰', 'Gross Revenue', money(data.revenue), 'Total settled transactions') +
      statCard('👥', 'Total Users', data.users, 'Registered buyer & seller accounts') +
      statCard('📚', 'Active Titles', data.books, 'Curated book listings in database') +
      statCard('📦', 'Total Orders', data.orders, 'All recorded customer orders');

    // Recent users overview
    const usersData = await request('/api/admin/users');
    const recentUsers = (usersData.users || []).slice(0, 5);
    recentTable.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${recentUsers.map((u) => `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td>${u.email}</td>
              <td>${u.phone || '<i class="muted-dash">Unspecified</i>'}</td>
              <td><span class="role-pill role-${u.role}">${u.role.toUpperCase()}</span></td>
              <td><span class="status-pill ${u.isBanned ? 'status-banned' : 'status-active'}">${u.isBanned ? 'Suspended' : 'Active'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    const data = await request('/api/seller-dashboard');
    statsContainer.innerHTML = 
      statCard('📚', 'Your Catalog', data.totalProducts, 'Active book listings in your store') +
      statCard('📈', 'Copies Sold', data.totalSold, 'Total books shipped to readers') +
      statCard('💵', 'Store Revenue', money(data.totalRevenue), 'Total earnings from your book sales') +
      statCard('📦', 'Store Orders', data.orders.length, 'Orders containing your inventory');

    // Recent books overview
    const recentBooks = (data.books || []).slice(0, 5);
    recentTable.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Listing Price</th>
            <th>Stock Available</th>
            <th>Units Sold</th>
          </tr>
        </thead>
        <tbody>
          ${recentBooks.map((b) => `
            <tr>
              <td><strong>${b.title}</strong></td>
              <td>${money(b.price)}</td>
              <td><span class="stock-badge ${b.stock > 0 ? 'in-stock' : 'out-stock'}">${b.stock} copies</span></td>
              <td>${b.sold || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

// 2. Load Books Inventory
async function loadBooksInventory() {
  const container = document.querySelector('#booksInventoryTable');
  container.innerHTML = '<div class="table-loading">Loading inventory data...</div>';

  try {
    let list = [];
    if (currentUser.role === 'admin') {
      const res = await request('/api/books');
      list = res.books || [];
    } else {
      const res = await request('/api/seller-dashboard');
      list = res.books || [];
    }

    if (!list.length) {
      container.innerHTML = `
        <div class="empty-dash-state">
          <p>You currently have no books in your inventory.</p>
          <a href="/publish" class="button button-primary">Publish Your First Title →</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th style="width: 70px;">Cover</th>
            <th>Title & Author</th>
            <th>Category</th>
            <th>Price</th>
            <th>Inventory</th>
            <th>Sold</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((b) => `
            <tr>
              <td>
                <img class="table-book-thumb" src="${b.cover || '/css/avatar-placeholder.svg'}" alt="${b.title}">
              </td>
              <td>
                <strong>${b.title}</strong>
                <span class="table-subtext">${b.author || 'Unknown author'}</span>
              </td>
              <td>
                <span class="cat-pill">${b.category?.name || 'General'}</span>
              </td>
              <td><strong>${money(b.price)}</strong></td>
              <td>
                <span class="stock-badge ${b.stock > 5 ? 'in-stock' : b.stock > 0 ? 'low-stock' : 'out-stock'}">
                  ${b.stock > 0 ? `${b.stock} in stock` : 'Out of stock'}
                </span>
              </td>
              <td><strong>${b.sold || 0}</strong></td>
              <td style="text-align: right;">
                <button class="btn-table-delete" data-delete-book="${b._id}" title="Remove title">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Wire delete button
    container.querySelectorAll('[data-delete-book]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to remove this book listing?')) return;
        btn.disabled = true;
        try {
          await request(`/api/books/${btn.dataset.deleteBook}`, { method: 'DELETE' });
          toast('Listing deleted successfully.');
          loadBooksInventory();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<p class="form-message error">${err.message}</p>`;
  }
}

// 3. Load Orders Management
async function loadOrders() {
  const container = document.querySelector('#ordersManagementTable');
  container.innerHTML = '<div class="table-loading">Loading orders...</div>';

  try {
    const res = await request('/api/orders');
    const orders = res.orders || [];

    if (!orders.length) {
      container.innerHTML = '<div class="empty-dash-state"><p>No orders have been placed yet.</p></div>';
      return;
    }

    const statusOptions = [
      { key: 'pending', label: '⏳ Pending' },
      { key: 'confirmed', label: '✅ Confirmed' },
      { key: 'processing', label: '📦 Packing' },
      { key: 'shipped', label: '🚚 In Transit' },
      { key: 'delivered', label: '🎉 Delivered' },
      { key: 'cancelled', label: '❌ Cancelled' }
    ];

    container.innerHTML = `
      <table class="dash-table orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Recipient & Phone</th>
            <th>Shipping Address</th>
            <th>Items Ordered</th>
            <th>Total Amount</th>
            <th>Fulfillment Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((o) => `
            <tr>
              <td><span class="order-id-badge">${o.orderID}</span></td>
              <td>
                <strong>${o.shipping?.fullName || 'Customer'}</strong>
                <span class="table-phone">📞 ${o.shipping?.phone || 'Not provided'}</span>
              </td>
              <td>
                <span class="table-address">📍 ${o.shipping?.address || 'Pickup'}</span>
              </td>
              <td>
                <div class="order-items-compact">
                  ${(o.items || []).map((item) => `
                    <div class="order-item-line">
                      <span>• ${item.title}</span>
                      <small>× ${item.quantity} (${money(item.price)})</small>
                    </div>
                  `).join('')}
                </div>
              </td>
              <td><strong class="order-total-price">${money(o.total)}</strong></td>
              <td>
                <select class="order-status-select" data-order-id="${o._id}">
                  ${statusOptions.map((opt) => `
                    <option value="${opt.key}" ${o.status === opt.key ? 'selected' : ''}>${opt.label}</option>
                  `).join('')}
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Wire status select change
    container.querySelectorAll('.order-status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const orderId = sel.dataset.orderId;
        const newStatus = sel.value;
        try {
          await request(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          });
          toast('Order fulfillment status updated!');
        } catch (err) {
          alert(`Could not update order: ${err.message}`);
          loadOrders();
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<p class="form-message error">${err.message}</p>`;
  }
}

// 4. Load Users (Admin only)
async function loadUsers() {
  const container = document.querySelector('#usersManagementTable');
  container.innerHTML = '<div class="table-loading">Loading user accounts...</div>';

  try {
    const res = await request('/api/admin/users');
    const users = res.users || [];

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>User Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Role</th>
            <th>Account Status</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((u) => `
            <tr>
              <td><strong>${u.name}</strong></td>
              <td>${u.email}</td>
              <td>${u.phone ? `📞 ${u.phone}` : '<i class="muted-dash">Unspecified</i>'}</td>
              <td><span class="table-address">${u.address || '<i class="muted-dash">Unspecified</i>'}</span></td>
              <td>
                <span class="role-pill role-${u.role}">${u.role.toUpperCase()}</span>
                ${u.role === 'customer' ? `
                  <button class="btn-make-seller" data-promote-user="${u.userID}" title="Grant seller privileges">Make Seller</button>
                ` : ''}
              </td>
              <td>
                <span class="status-pill ${u.isBanned ? 'status-banned' : 'status-active'}">
                  ${u.isBanned ? 'Suspended' : 'Active'}
                </span>
              </td>
              <td style="text-align: right;">
                ${u.role !== 'admin' ? `
                  <button class="btn-table-ban ${u.isBanned ? 'is-unban' : ''}" data-ban-user="${u.userID}" data-current-ban="${u.isBanned}">
                    ${u.isBanned ? 'Unsuspend' : 'Suspend'}
                  </button>
                ` : '<span class="admin-protected-badge">Protected</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Ban toggle
    container.querySelectorAll('[data-ban-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const isBanned = btn.dataset.currentBan === 'true';
        if (!confirm(`Are you sure you want to ${isBanned ? 'unsuspend' : 'suspend'} this account?`)) return;
        btn.disabled = true;
        try {
          await request(`/api/admin/users/${btn.dataset.banUser}/ban`, {
            method: 'PATCH',
            body: JSON.stringify({ isBanned: !isBanned })
          });
          toast('User status updated successfully!');
          loadUsers();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
        }
      });
    });

    // Promote seller
    container.querySelectorAll('[data-promote-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Promote this user to verified Bookseller status?')) return;
        btn.disabled = true;
        try {
          await request(`/api/admin/users/${btn.dataset.promoteUser}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: 'seller' })
          });
          toast('User successfully promoted to Seller!');
          loadUsers();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<p class="form-message error">${err.message}</p>`;
  }
}

// 5. Load Seller Requests (Admin only)
async function loadSellerRequests() {
  const container = document.querySelector('#sellerRequestsTable');
  const countBadge = document.querySelector('#requestCount');
  const pendingBadge = document.querySelector('#pendingBadge');

  container.innerHTML = '<div class="table-loading">Loading application queue...</div>';

  try {
    const res = await request('/api/seller/requests?status=pending');
    const list = res.requests || [];

    countBadge.textContent = `${list.length} pending`;
    if (list.length > 0) {
      pendingBadge.textContent = list.length;
      pendingBadge.hidden = false;
    } else {
      pendingBadge.hidden = true;
    }

    if (!list.length) {
      container.innerHTML = '<div class="empty-dash-state"><p>No pending seller partner applications.</p></div>';
      return;
    }

    container.innerHTML = `
      <table class="dash-table">
        <thead>
          <tr>
            <th>Storefront Name</th>
            <th>Phone</th>
            <th>Dispatch Address</th>
            <th>Submitted</th>
            <th style="text-align: right;">Decision</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((req) => `
            <tr>
              <td>
                <strong>${req.storeName}</strong>
                ${req.description ? `<small class="table-subtext">${req.description}</small>` : ''}
              </td>
              <td>📞 ${req.phone}</td>
              <td>📍 ${req.address}</td>
              <td>${new Date(req.createdAt).toLocaleDateString('en-US')}</td>
              <td style="text-align: right;">
                <button class="btn-approve" data-review-id="${req._id}" data-decision="approved">Approve</button>
                <button class="btn-reject" data-review-id="${req._id}" data-decision="rejected">Reject</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.querySelectorAll('[data-review-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await request(`/api/seller/requests/${btn.dataset.reviewId}/review`, {
            method: 'PATCH',
            body: JSON.stringify({ status: btn.dataset.decision })
          });
          toast(`Application ${btn.dataset.decision === 'approved' ? 'approved' : 'rejected'}.`);
          loadSellerRequests();
        } catch (err) {
          alert(err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<p class="form-message error">${err.message}</p>`;
  }
}

// Main initialization
async function initDashboard() {
  try {
    const profileRes = await request('/api/auth/profile');
    currentUser = profileRes.user;

    if (currentUser.role !== 'admin' && currentUser.role !== 'seller') {
      alert('Your account does not have authorization to view the Dashboard.');
      window.location.href = '/';
      return;
    }

    // Set header info
    document.querySelector('#userRoleBadge').textContent = currentUser.role.toUpperCase();
    document.querySelector('#userRoleBadge').className = `dash-role-badge role-${currentUser.role}`;
    document.querySelector('#greetingTitle').textContent = `Welcome back, ${currentUser.name}`;

    if (currentUser.role === 'admin') {
      document.querySelector('#dashboardEyebrow').textContent = 'SYSTEM CONTROL CENTER';
      document.querySelector('#dashboardTitle').textContent = 'Administrator Command Center';
      document.querySelector('#tabUsersBtn').hidden = false;
      document.querySelector('#tabRequestsBtn').hidden = false;
    } else {
      document.querySelector('#dashboardEyebrow').textContent = 'SELLER COMMAND CENTER';
      document.querySelector('#dashboardTitle').textContent = 'Storefront Dashboard';
      document.querySelector('#tabUsersBtn').hidden = true;
      document.querySelector('#tabRequestsBtn').hidden = true;
    }

    // Logout
    document.querySelector('#dashLogoutBtn').addEventListener('click', async () => {
      try { await request('/api/auth/logout', { method: 'POST' }); }
      finally { window.location.href = '/login'; }
    });

    setupTabs();
    await loadOverview();
  } catch (err) {
    window.location.href = '/login';
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);