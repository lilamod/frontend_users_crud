const api = axios.create({
  baseURL: "https://backend-auth-api-h9gq.onrender.com",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && !config.url.includes("/login") && !config.url.includes("/signup")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const tableBody = document.getElementById("tableBody");
const formDialog = document.getElementById("formDialog");
const editDialog = document.getElementById("editDialog");
const viewDialog = document.getElementById("viewDialog");
const searchInput = document.getElementById("searchInput");

let currentEditUserId = null;

let searchTimeout;
if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchAndDisplayData(searchInput.value);
    }, 300);
  });
}

async function fetchAndDisplayData(search = "") {
  try {
    const res = await api.post("/users", { search });
    renderTable(res.data.data || []);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

function renderTable(users) {
  tableBody.innerHTML = "";
  users.forEach(user => {
    tableBody.innerHTML += `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${new Date(user.createdAt).toLocaleString()}</td>
        <td>
          <i class="fas fa-eye view" onclick="handleView('${user._id}')"></i>
          <i class="fas fa-edit update" onclick="handleUpdate('${user._id}')"></i>
          <i class="fas fa-trash delete" onclick="handleDelete('${user._id}')"></i>
        </td>
      </tr>`;
  });
}

async function validate(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await api.post("/login", { email, password });
  localStorage.setItem("token", res.data.token);
  window.location.href = "userTable.html";
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

document.addEventListener("DOMContentLoaded", () => fetchAndDisplayData());
