import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// ✅ CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAWnsj9OnR-GLzMcCd6EbPGkGp-3ExGr9g",
  authDomain: "plannerapp-5c2c2.firebaseapp.com",
  projectId: "plannerapp-5c2c2",
  storageBucket: "plannerapp-5c2c2.firebasestorage.app",
  messagingSenderId: "848632796013",
  appId: "1:848632796013:web:fb32eb9d7658c4d10dc064",
  measurementId: "G-WPYF0ELQLH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ PERSISTENCE
let persistenceReady = setPersistence(auth, browserLocalPersistence);

// ✅ STATE (ONLY ADDED viewMode)
let tasks = [];
let user = null;
let unsubscribe = null;
let editingId = null;
let viewMode = "daily"; // ✅ NEW SAFE ADD

// ✅ PANEL ELEMENTS
let taskPanel, calendarContainer, panelDate, closePanel, cancelEditBtn;

// ✅ DOM READY
window.onload = () => {
  taskPanel = document.getElementById("taskPanel");
  calendarContainer = document.querySelector(".calendar-container");
  panelDate = document.getElementById("panelDate");
  closePanel = document.getElementById("closePanel");
  cancelEditBtn = document.getElementById("cancelEditBtn");

 closePanel.onclick = () => {
  editingId = null;

  taskPanel.classList.remove("active");
  calendarContainer.classList.remove("shrink");

  clearInputs();

  panelDate.innerText = "Add Task";
  cancelEditBtn.style.display = "none";
};

  cancelEditBtn.onclick = () => {
    editingId = null;
    cancelEditBtn.style.display = "none";

    clearInputs();
    panelDate.innerText = "Add Task";
  };

  // ✅ reset panel title
  panelDate.innerText = "Add Task";
};

// ✅ CACHE

let selectedDate = new Date().toISOString().split("T")[0];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ✅ THEME (UNCHANGED)
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};

// ✅ LOGIN
loginBtn.onclick = async () => {
  await persistenceReady;
  await signInWithPopup(auth, new GoogleAuthProvider());
};

// ✅ LOGOUT
logoutBtn.onclick = async () => await signOut(auth);

// ✅ AUTH
onAuthStateChanged(auth, (u) => {

  if (unsubscribe) unsubscribe();

  if (u) {
    user = u;

    console.log(user.uid);

    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
    userInfo.innerHTML = `<i class="fas fa-user-circle"></i> ${user.email}`;


   
const q = query(
  collection(db, "users", user.uid, "tasks"),
  orderBy("date"),
  orderBy("time")
);

unsubscribe = onSnapshot(q, snap => {

  tasks = [];

  snap.forEach(d => {
    const data = d.data();
    tasks.push({ id: d.id, ...data });
  });

  render();
});


  } else {
    user = null;
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    userInfo.innerHTML = `<i class="fas fa-user-circle"></i> Not logged in`;


    render();
  }
});

// ✅ ADD / EDIT (ONLY SAFE CATEGORY ADD)
addBtn.onclick = async () => {

  if (!user) return alert("Login first");

  const task = {
    title: taskTitle.value,
    time: taskTime.value,
    priority: taskPriority.value,
    category: (taskCategory && taskCategory.value) || "General", // ✅ SAFE ADD
    repeat: taskRepeat.value,
    location: taskLocation.value,
    description: taskDescription.value,
    date: selectedDate,
    completed: false,
  
  };

  if (!task.title) return;

  if (editingId) {
    await updateDoc(doc(db, "users", user.uid, "tasks", editingId), task);
    editingId = null;
    cancelEditBtn.style.display = "none";
  } else {
    await addDoc(collection(db, "users", user.uid, "tasks"), task);
  }

  clearInputs();
};

function clearInputs() {
  taskTitle.value = "";
  taskTime.value = "";
  taskLocation.value = "";
  taskDescription.value = "";
}

// ✅ VIEW SWITCH (SAFE ADD)
window.setView = (mode) => {
  viewMode = mode;
  render();
};

// ✅ FILTER (ORIGINAL + YEAR SUPPORT)
function shouldShowTask(task) {

  if (viewMode === "yearly") {
    return new Date(task.date).getFullYear() === currentYear;
  }

  if (task.date === selectedDate) return true;
  if (task.repeat === "daily") return true;

  if (task.repeat === "weekly") {
    return new Date(task.date).getDay() === new Date(selectedDate).getDay();
  }

  if (task.repeat === "monthly") {
    return new Date(task.date).getDate() === new Date(selectedDate).getDate();
  }

  return false;
}

// ✅ CALENDAR (UNCHANGED)
function renderCalendar() {

  calendar.innerHTML = "";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";

  const title = document.createElement("strong");
  title.innerText = new Date(currentYear, currentMonth)
    .toLocaleString('default', { month: "long", year: "numeric" });

  const prev = document.createElement("button");
  prev.innerText = "◀";

  const next = document.createElement("button");
  next.innerText = "▶";

  header.append(prev, title, next);
  calendar.appendChild(header);

  const week = document.createElement("div");
  week.className = "calendar-grid";

  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
    const el = document.createElement("div");
    el.innerText = d;
    el.style.textAlign = "center";
    el.style.fontWeight = "bold";
    week.appendChild(el);
  });

  calendar.appendChild(week);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const start = new Date(currentYear, currentMonth, 1).getDay();
  const days = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < start; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let i = 1; i <= days; i++) {

    const dateStr = new Date(currentYear, currentMonth, i)
      .toISOString().split("T")[0];

    const cell = document.createElement("div");
    cell.className = "day";

    const num = document.createElement("div");
    num.innerText = i;
    cell.appendChild(num);

    const dayTasks = tasks.filter(t => t.date === dateStr);

if (dayTasks.length > 0) {

  const total = dayTasks.length;

  const lowCount =
    dayTasks.filter(t => t.priority === "Low").length;

  const mediumCount =
    dayTasks.filter(t => t.priority === "Medium").length;

  const highCount =
    dayTasks.filter(t => t.priority === "High").length;

  const band = document.createElement("div");
  band.className = "task-band";

  if (lowCount > 0) {
    const low = document.createElement("div");
    low.className = "band-low";
    low.style.width = `${(lowCount / total) * 100}%`;
    band.appendChild(low);
  }

  if (mediumCount > 0) {
    const medium = document.createElement("div");
    medium.className = "band-medium";
    medium.style.width = `${(mediumCount / total) * 100}%`;
    band.appendChild(medium);
  }

  if (highCount > 0) {
    const high = document.createElement("div");
    high.className = "band-high";
    high.style.width = `${(highCount / total) * 100}%`;
    band.appendChild(high);
  }

  cell.appendChild(band);
}


    if (dateStr === selectedDate) {
      cell.classList.add("selected");
    }

    cell.onclick = () => {
      selectedDate = dateStr;
      taskPanel.classList.add("active");
      calendarContainer.classList.add("shrink");
      panelDate.innerText = "Add Task: " + dateStr;
      render();
    };

    grid.appendChild(cell);
  }

  calendar.appendChild(grid);

  prev.onclick = () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    render();
  };

  next.onclick = () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    render();
  };
}

// ✅ RENDER (EDIT BUTTON RESTORED ✅)
function render() {
  renderCalendar();

  taskList.innerHTML = "";

  const list = tasks.filter(t => shouldShowTask(t));

  list.forEach(t => {
    const li = document.createElement("li");

    li.classList.add(`priority-${t.priority}`);
    li.classList.add(`category-${t.category}`);


    if (t.completed) li.classList.add("completed");

    li.innerHTML = `
      <strong>${t.time || ""}</strong> ${t.title}<br>
      <span class="tag"> ${t.category || "General"}</span>
      📍 ${t.location || ""}<br>
      📝 ${t.description || ""}<br>

      <div class="task-actions">
  <button onclick="toggleTask('${t.id}', ${t.completed})">
    <i class="fas fa-check"></i>
  </button>
  <button onclick="editTask('${t.id}')">
    <i class="fas fa-pen"></i>
  </button>
  <button onclick="deleteTask('${t.id}')">
    <i class="fas fa-trash"></i>
  </button>
</div>
    `;

    taskList.appendChild(li);
  });
}

// ✅ FIX TOGGLE (✔)
window.toggleTask = async (id, completed) => {
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid, "tasks", id), {
    completed: !completed
  });
};

// ✅ FIX DELETE (🗑)
window.deleteTask = async (id) => {
  if (!user) return;
  await deleteDoc(doc(db, "users", user.uid, "tasks", id));
};

// ✅ FIX EDIT (✏️)
window.editTask = (id) => {
  const t = tasks.find(x => x.id === id);
  if (!t) return;

  editingId = id;

  taskTitle.value = t.title;
  taskTime.value = t.time;
  taskPriority.value = t.priority;
  taskRepeat.value = t.repeat;
  taskLocation.value = t.location;
  taskDescription.value = t.description;
  taskCategory.value = t.category || "Work";

  cancelEditBtn.style.display = "inline-block";

  // ✅ OPEN PANEL (IMPORTANT UX FIX)
  taskPanel.classList.add("active");
  calendarContainer.classList.add("shrink");
};


render();