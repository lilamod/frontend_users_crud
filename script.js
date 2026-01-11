

const api = axios.create({
  bbaseURL:"https://backend-auth-api-h9gq.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (
    token &&
    !config.url.includes("/login") &&
    !config.url.includes("/signup")
  ) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const tableBody = document.getElementById('tableBody');
const formDialog = document.getElementById('formDialog');
const openFormButton = document.getElementById('openFormButton');
const closeFormButton = document.getElementById('closeFormButton');

openFormButton.addEventListener('click', () => formDialog.showModal());
closeFormButton.addEventListener('click', () => formDialog.close());

const viewDialog = document.getElementById("viewDialog");
const closeViewButton = document.getElementById("closeViewButton");

closeViewButton.addEventListener("click", () => viewDialog.close());

const editDialog = document.getElementById("editDialog");
const closeUpdateButton = document.getElementById("closeUpdateButton");

closeUpdateButton.addEventListener("click", () => editDialog.close());

let currentEditUserId = null;

async function fetchAndDisplayData() {

    try {
        const searchInput = document.getElementById("searchInput");
        if(searchInput) {
            let searchTimeout;
            searchInput.addEventListener("input", () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async() => {
                    console.log(searchInput.value)
                const res = await api.post("/users", {search: searchInput.value}); 
                    renderTable(res.data.data || []);
                }, 300);
            });

        }
            const res = await api.post("/users", {search: searchInput.value}); 
            console.log(res.data.data   )
            renderTable(res.data.data || []);

    } catch (err) {
        console.error("Error fetching users:", err);
    }
}

function renderTable(users) {
    tableBody.innerHTML = ""; 

    users.forEach(user => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${new Date(user.createdAt).toLocaleString("en-GB").replace(",", "")}</td>
            <td>
                <i class="fas fa-eye action-icon view" onclick="handleView('${user._id}')"></i>
                <i class="fas fa-edit action-icon update" onclick="handleUpdate('${user._id}')"></i>
                <i class="fas fa-trash-alt action-icon delete" onclick="handleDelete('${user._id}')"></i>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

async function handleView(id) {
    viewDialog.showModal();
     const res = await api.get(`/user/${id}`);
    const data = res.data;
    if(data.user) {
        const user = data.user;
        document.getElementById("viewName").value = user.name;
       document.getElementById("viewEmail").value = user.email;
       document.getElementById("viewCreatedAt").value = new Date(user.createdAt).toLocaleString("en-GB").replace(",", "");
    }
 }

 async function updateUser() {
    const name = document.getElementById("edit_name").value;
    const email = document.getElementById("edit_email").value;
    const password = document.getElementById("edit_password").value;

    if (!currentEditUserId) {
        console.error("User ID not found");
        return;
    }

    try {
        await api.put(`/user/${currentEditUserId}`, {
            name,
            email,
            password
        });

        editDialog.close();
        fetchAndDisplayData()
        console.log("User updated:", res.data);

    } catch (error) {
        console.error(error.response?.data || error.message);
    }
}

async function handleUpdate(id) {
    currentEditUserId = id; 
    editDialog.showModal();

    const userdata = await api.get(`/user/${id}`);
    const data = userdata.data;

    if (data.user) {
        const user = data.user;
        document.getElementById("edit_name").value = user.name;
        document.getElementById("edit_email").value = user.email;
    }
}


function handleDelete(id) {
    if(confirm("Delete user " + id + "?")) alert("Deleted user: " + id);
     api.delete(`/user/${id}`);
     fetchAndDisplayData()
}

async function createUser() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
       const res = await api.post("/signup", {
                    name,
                    email,
                    password,
                });       

        if(res.ok) {
            alert("User created successfully!");
            fetchAndDisplayData(); 
            formDialog.close();
        }
    } catch (err) {
        console.error("Error creating user:", err);
    }
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayData);

async function validate(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (email && password) {
    const res = await api.post("/login", { email, password });
    const data = await res.data;
        if(!res) {
           return alert(data.msg)
        }
    localStorage.setItem("token", data.token);
    window.location.href = "userTable.html";
  } else {
    alert("Sorry, your username or password was incorrect. Please try again.");
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});


// const searchInput = document.getElementById("searchInput");

// // Trigger search with debounce
// let searchTimeout;
// searchInput.addEventListener("input", () => {
//     clearTimeout(searchTimeout);
//     searchTimeout = setTimeout(() => {
//         searchUsers(searchInput.value);
//     }, 300); // wait 300ms after typing stops
// });

// // Fetch filtered users from backend
// async function searchUsers(query) {
//     try {
//         const res = await api.post("/users", { search: query }); 
//         console.log(res.data.data   )
//         // Assumes backend accepts POST /users/search with { search: "term" }
//         renderTable(res.data.data || []);
//     } catch (err) {
//         console.error("Error searching users:", err);
//     }
// }
