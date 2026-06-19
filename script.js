/* ================================================================
   ===== SCRIPT.JS - ROUTE LEDGER PRO =====
   ================================================================ */

// ===== FIREBASE INITIALIZATION =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAhyzHtfO8WEzFvWvyuVzRRmkEcPhbGQng",
  authDomain: "route-ledger-51260.firebaseapp.com",
  databaseURL: "https://route-ledger-51260-default-rtdb.firebaseio.com",
  projectId: "route-ledger-51260",
  storageBucket: "route-ledger-51260.firebasestorage.app",
  messagingSenderId: "687773386374",
  appId: "1:687773386374:web:fdd4b7f9cebf5dbc3c7307"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
console.log("🔥 Firebase initialized!");

let currentUserId = null;
let isSyncing = false;
let syncEnabled = true;

// ===== FIREBASE SYNC FUNCTIONS =====

function initSync() {
  console.log("☁️ Initializing Firebase sync...");
  
  signInAnonymously(auth)
    .then((userCredential) => {
      currentUserId = userCredential.user.uid;
      console.log("✅ Firebase connected! User ID:", currentUserId.substring(0, 8) + "...");
      updateSyncStatusUI(true);
      loadDataFromCloud();
    })
    .catch((error) => {
      console.error("❌ Firebase error:", error);
      syncEnabled = false;
      updateSyncStatusUI(false);
      showToast("📡 Offline mode - Data saved locally", "warning");
    });
}

function loadDataFromCloud() {
  if (!currentUserId) return;
  
  const userRef = ref(db, `users/${currentUserId}/data`);
  
  onValue(userRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log("☁️ Cloud data found, merging...");
      mergeCloudData(data);
    } else {
      console.log("📤 No cloud data, uploading local...");
      uploadToCloud();
    }
  }, (error) => {
    console.error("❌ Error loading cloud data:", error);
  });
}

function uploadToCloud() {
  if (!currentUserId || !syncEnabled) return;
  
  const data = getCurrentData();
  const userRef = ref(db, `users/${currentUserId}/data`);
  
  set(userRef, data)
    .then(() => {
      console.log("☁️ Data uploaded to cloud!");
      updateSyncStatusUI(true);
    })
    .catch((error) => {
      console.error("❌ Upload failed:", error);
      updateSyncStatusUI(false);
    });
}

function getCurrentData() {
  return {
    income: parseFloat(localStorage.getItem("income")) || 0,
    expenses: parseFloat(localStorage.getItem("expenses")) || 0,
    monthlyFee: parseFloat(localStorage.getItem("monthlyFee")) || 1800,
    passengers: JSON.parse(localStorage.getItem("passengers")) || [],
    incomeHistory: JSON.parse(localStorage.getItem("incomeHistory")) || [],
    expenseHistory: JSON.parse(localStorage.getItem("expenseHistory")) || [],
    passengerNotes: JSON.parse(localStorage.getItem("passengerNotes")) || {},
    monthlyTarget: parseFloat(localStorage.getItem("monthlyTarget")) || 15000,
    budgetLimit: parseFloat(localStorage.getItem("budgetLimit")) || 8000,
    defaultDueDay: localStorage.getItem("defaultDueDay") || "15",
    autoReminders: localStorage.getItem("autoReminders") || "enabled",
    reminderDays: parseInt(localStorage.getItem("reminderDays")) || 3,
    autoReset: localStorage.getItem("autoReset") || "enabled",
    lastUpdated: new Date().toISOString(),
    version: "2.0"
  };
}

function mergeCloudData(cloudData) {
  if (!cloudData) return;
  
  const cloudTime = cloudData.lastUpdated ? new Date(cloudData.lastUpdated) : new Date(0);
  const localTime = localStorage.getItem("lastLocalUpdate") ? new Date(localStorage.getItem("lastLocalUpdate")) : new Date(0);
  
  if (localTime > cloudTime && localStorage.getItem("income") !== null) {
    console.log("📱 Local data is newer, uploading...");
    uploadToCloud();
    return;
  }
  
  console.log("☁️ Merging cloud data...");
  
  if (cloudData.income !== undefined) localStorage.setItem("income", cloudData.income);
  if (cloudData.expenses !== undefined) localStorage.setItem("expenses", cloudData.expenses);
  if (cloudData.monthlyFee !== undefined) localStorage.setItem("monthlyFee", cloudData.monthlyFee);
  if (cloudData.passengers) localStorage.setItem("passengers", JSON.stringify(cloudData.passengers));
  if (cloudData.incomeHistory) localStorage.setItem("incomeHistory", JSON.stringify(cloudData.incomeHistory));
  if (cloudData.expenseHistory) localStorage.setItem("expenseHistory", JSON.stringify(cloudData.expenseHistory));
  if (cloudData.passengerNotes) localStorage.setItem("passengerNotes", JSON.stringify(cloudData.passengerNotes));
  if (cloudData.monthlyTarget) localStorage.setItem("monthlyTarget", cloudData.monthlyTarget);
  if (cloudData.budgetLimit) localStorage.setItem("budgetLimit", cloudData.budgetLimit);
  if (cloudData.defaultDueDay) localStorage.setItem("defaultDueDay", cloudData.defaultDueDay);
  if (cloudData.autoReminders) localStorage.setItem("autoReminders", cloudData.autoReminders);
  if (cloudData.reminderDays) localStorage.setItem("reminderDays", cloudData.reminderDays);
  if (cloudData.autoReset) localStorage.setItem("autoReset", cloudData.autoReset);
  
  localStorage.setItem("lastLocalUpdate", new Date().toISOString());
  
  if (typeof updateUI === 'function') {
    updateUI();
  }
  
  showToast("☁️ Synced from cloud!", "success");
  updateSyncStatusUI(true);
}

function autoSync() {
  if (isSyncing || !syncEnabled || !currentUserId) return;
  
  isSyncing = true;
  localStorage.setItem("lastLocalUpdate", new Date().toISOString());
  
  clearTimeout(window.syncTimeout);
  window.syncTimeout = setTimeout(() => {
    uploadToCloud();
    isSyncing = false;
  }, 2000);
}

function updateSyncStatusUI(connected) {
  const statusEl = document.getElementById("syncStatus");
  const timeEl = document.getElementById("lastSyncTime");
  
  if (statusEl) {
    if (connected && currentUserId) {
      statusEl.textContent = "☁️ Online";
      statusEl.style.color = "var(--color-green)";
      statusEl.style.borderColor = "var(--color-green)";
    } else {
      statusEl.textContent = "📡 Offline";
      statusEl.style.color = "var(--text-muted)";
      statusEl.style.borderColor = "var(--border-color)";
    }
  }
  
  if (timeEl && connected) {
    timeEl.textContent = new Date().toLocaleString();
  }
}

function forceSync() {
  if (!currentUserId) {
    showToast("📡 Not connected to cloud", "warning");
    return;
  }
  
  showToast("☁️ Syncing...", "info");
  uploadToCloud();
  loadDataFromCloud();
}

// ================================================================
// 1. DATA STATE
// ================================================================

let income = localStorage.getItem("income") ? parseFloat(localStorage.getItem("income")) : 0;
let expenses = localStorage.getItem("expenses") ? parseFloat(localStorage.getItem("expenses")) : 0;
let incomeHistory = JSON.parse(localStorage.getItem("incomeHistory")) || [];
let expenseHistory = JSON.parse(localStorage.getItem("expenseHistory")) || [];
let passengers = JSON.parse(localStorage.getItem("passengers")) || [];

passengers = passengers.map(passenger => {
  if (typeof passenger === "string") {
    return { name: passenger, status: "Waiting" };
  }
  return passenger;
});

let monthlyFee = localStorage.getItem("monthlyFee") ? parseFloat(localStorage.getItem("monthlyFee")) : 1800;
let currentMonth = localStorage.getItem("currentMonth") || "";
let currentYear = localStorage.getItem("currentYear") || "";

// ================================================================
// 2. MONTH TRACKING & AUTO-RESET
// ================================================================

function checkMonthReset() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  
  const displayEl = document.getElementById("currentMonthDisplay");
  if (displayEl) displayEl.textContent = monthNames[thisMonth] + " " + thisYear;
  
  if (currentMonth !== "" && currentYear !== "") {
    if (currentMonth != thisMonth || currentYear != thisYear) {
      console.log(`🔄 New month detected! Resetting passengers...`);
      
      passengers.forEach(passenger => {
        passenger.status = "Waiting";
      });
      
      currentMonth = thisMonth;
      currentYear = thisYear;
      localStorage.setItem("currentMonth", currentMonth);
      localStorage.setItem("currentYear", currentYear);
      
      saveData();
      updateUI();
      showToast(`📅 New month started! All passengers reset to Waiting.`, "warning");
      return true;
    }
  } else {
    currentMonth = thisMonth;
    currentYear = thisYear;
    localStorage.setItem("currentMonth", currentMonth);
    localStorage.setItem("currentYear", currentYear);
  }
  return false;
}

function forceNewMonth() {
  if (confirm("⚠️ Start a new month? This will reset all passengers to Waiting.")) {
    const now = new Date();
    currentMonth = now.getMonth();
    currentYear = now.getFullYear();
    
    passengers.forEach(passenger => {
      passenger.status = "Waiting";
    });
    
    saveData();
    updateUI();
    showToast("📅 New month started manually!", "success");
  }
}

// ================================================================
// 3. DATA PERSISTENCE
// ================================================================

function saveData() {
  localStorage.setItem("income", income);
  localStorage.setItem("expenses", expenses);
  localStorage.setItem("incomeHistory", JSON.stringify(incomeHistory));
  localStorage.setItem("expenseHistory", JSON.stringify(expenseHistory));
  localStorage.setItem("passengers", JSON.stringify(passengers));
  localStorage.setItem("monthlyFee", monthlyFee);
  localStorage.setItem("currentMonth", currentMonth);
  localStorage.setItem("currentYear", currentYear);
  autoSync();
}

// ================================================================
// 4. TOAST NOTIFICATIONS
// ================================================================

function showToast(message, type = "info") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b"
  };
  
  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️"
  };
  
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.borderLeftColor = colors[type] || colors.info;
  toast.innerHTML = `${icons[type] || "ℹ️"} ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ================================================================
// 5. SETTINGS
// ================================================================

function saveMonthlyFee() {
  const input = document.getElementById("monthlyFee");
  if (!input) return;
  
  const value = parseFloat(input.value);
  if (!isNaN(value) && value > 0) {
    monthlyFee = value;
    saveData();
    updateUI();
    showToast("Monthly fee updated to R" + monthlyFee, "success");
  } else {
    showToast("Please enter a valid amount", "error");
  }
}

// ================================================================
// 6. RENDER FUNCTIONS
// ================================================================

function renderHistory() {
  const incomeList = document.getElementById("incomeHistory");
  const expenseList = document.getElementById("expenseHistory");
  const incomeCount = document.getElementById("incomeCount");
  const expenseCount = document.getElementById("expenseCount");

  if (incomeList) {
    incomeList.innerHTML = "";
    if (incomeHistory.length === 0) {
      incomeList.innerHTML = '<li style="color:#64748b;text-align:center;padding:20px;">No income recorded yet</li>';
    } else {
      incomeHistory.slice().reverse().forEach(item => {
        const li = document.createElement("li");
        const date = new Date(item.date).toLocaleDateString();
        li.innerHTML = `
          <span>
            <span class="history-date">${date}</span>
            <strong>${item.source}</strong> · ${item.name}
          </span>
          <span class="history-amount positive">+R${item.amount.toFixed(2)}</span>
        `;
        incomeList.appendChild(li);
      });
    }
    if (incomeCount) incomeCount.textContent = `${incomeHistory.length} entries`;
  }

  if (expenseList) {
    expenseList.innerHTML = "";
    if (expenseHistory.length === 0) {
      expenseList.innerHTML = '<li style="color:#64748b;text-align:center;padding:20px;">No expenses recorded yet</li>';
    } else {
      expenseHistory.slice().reverse().forEach(item => {
        const li = document.createElement("li");
        const date = new Date(item.date).toLocaleDateString();
        li.innerHTML = `
          <span>
            <span class="history-date">${date}</span>
            <strong>${item.category}</strong>
          </span>
          <span class="history-amount negative">-R${item.amount.toFixed(2)}</span>
        `;
        expenseList.appendChild(li);
      });
    }
    if (expenseCount) expenseCount.textContent = `${expenseHistory.length} entries`;
  }
}

let selectedPassengers = new Set();
let currentModalPassenger = null;
let passengerNotes = JSON.parse(localStorage.getItem("passengerNotes")) || {};

function renderPassengers() {
  const list = document.getElementById("passengerList");
  if (!list) return;
  list.innerHTML = "";

  if (passengers.length === 0) {
    list.innerHTML = '<li style="text-align:center;color:#64748b;padding:20px;">No passengers added yet</li>';
    updatePassengerStats(0, 0, 0, 0);
    updatePassengerRanking();
    checkOverduePassengers();
    return;
  }

  let paid = 0, partial = 0, waiting = 0;

  passengers.forEach((passenger, index) => {
    const paidAmount = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paidAmount);
    const isSelected = selectedPassengers.has(index);
    const isOverdue = isPassengerOverdue(passenger.name);
    const note = passengerNotes[passenger.name] || "";
    const dueDate = getPassengerDueDate(passenger.name);

    let status = "Waiting";
    let icon = "🔴";
    let statusColor = "#ef4444";
    
    if (paidAmount >= monthlyFee) {
      status = "Paid";
      icon = "🟢";
      statusColor = "#10b981";
      paid++;
    } else if (paidAmount > 0) {
      status = "Partial";
      icon = "🟡";
      statusColor = "#f59e0b";
      partial++;
    } else {
      waiting++;
    }

    const li = document.createElement("li");
    li.style.borderLeft = isOverdue ? '3px solid #ef4444' : '3px solid transparent';
    
    li.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <input type="checkbox" class="passenger-checkbox" 
               ${isSelected ? 'checked' : ''} 
               onchange="togglePassengerSelection(${index})" />
        <div style="flex:1;cursor:pointer;" onclick="openPassengerModal(${index})">
          <strong>${icon} ${passenger.name}</strong>
          ${isOverdue ? ' <span style="font-size:11px;background:#ef4444;color:white;padding:1px 8px;border-radius:10px;">⚠️ Overdue</span>' : ''}
          <div class="passenger-detail">Monthly Fee: <span>R${monthlyFee}</span></div>
          <div class="passenger-detail">Paid: <span>R${paidAmount.toFixed(2)}</span></div>
          <div class="passenger-detail">Outstanding: <span>R${outstanding.toFixed(2)}</span></div>
          <div class="passenger-detail">Due: <span>${dueDate.toLocaleDateString()}</span></div>
          <div class="passenger-detail">Status: <span style="color:${statusColor};font-weight:600;">${status}</span></div>
          ${note ? `<div class="passenger-detail" style="font-size:12px;color:var(--text-muted);margin-top:4px;">📝 ${note}</div>` : ''}
        </div>
        <button onclick="deletePassenger(${index})" style="margin-top:0;width:auto;padding:4px 12px;background:var(--color-red);color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    list.appendChild(li);
  });

  updatePassengerStats(passengers.length, paid, partial, waiting);
  updateSelectedCount();
  updatePassengerRanking();
  checkOverduePassengers();
}

function updatePassengerStats(total, paid, partial, waiting) {
  document.getElementById("totalPassengers").textContent = total;
  document.getElementById("paidCount").textContent = paid;
  document.getElementById("partialCount").textContent = partial;
  document.getElementById("waitingCount").textContent = waiting;
  updatePassengerRanking();
}

function renderPassengerDropdown() {
  const select = document.getElementById("passengerName");
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Passenger</option>';
  passengers.forEach(passenger => {
    const option = document.createElement("option");
    option.value = passenger.name;
    option.textContent = passenger.name;
    select.appendChild(option);
  });
}

function updateDashboardStats() {
  const expected = passengers.length * monthlyFee;
  let collected = 0;
  let paidCount = 0;

  passengers.forEach(passenger => {
    const paid = getPassengerPaidThisMonth(passenger.name);
    collected += paid;
    if (paid >= monthlyFee) paidCount++;
  });

  const outstanding = Math.max(0, expected - collected);

  document.getElementById("expectedAmount").innerText = "R" + expected.toFixed(2);
  document.getElementById("collectedAmount").innerText = "R" + collected.toFixed(2);
  document.getElementById("outstandingAmount").innerText = "R" + outstanding.toFixed(2);
  document.getElementById("paidPassengers").innerText = paidCount + " / " + passengers.length;
}

function updateReports() {
  let passengerIncome = 0, deliveryIncome = 0, otherIncome = 0;
  
  incomeHistory.forEach(item => {
    if (item.source === "Passenger") passengerIncome += item.amount;
    else if (item.source === "Delivery") deliveryIncome += item.amount;
    else otherIncome += item.amount;
  });

  const totalIncome = passengerIncome + deliveryIncome + otherIncome;
  const profit = totalIncome - expenses;

  const reportIds = [
    "reportPassengerIncome", "reportDeliveryIncome", "reportOtherIncome",
    "reportTotalIncome", "reportExpenses", "reportProfit"
  ];
  const reportValues = [
    passengerIncome, deliveryIncome, otherIncome,
    totalIncome, expenses, profit
  ];

  reportIds.forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.innerText = "R" + reportValues[index].toFixed(2);
  });
}

function updateUI() {
  document.getElementById("income").innerText = "R" + income.toFixed(2);
  document.getElementById("expenses").innerText = "R" + expenses.toFixed(2);
  document.getElementById("balance").innerText = "R" + (income - expenses).toFixed(2);
  
  renderHistory();
  renderPassengers();
  renderPassengerDropdown();
  updateDashboardStats();
  updateReports();
  initCharts();
  updateSmartFinance();
  updateAdvancedAnalytics();
  updateReportSummary();
  updatePercentageChanges();

  const feeInput = document.getElementById("monthlyFee");
  if (feeInput) feeInput.value = monthlyFee;
}

// ================================================================
// 7. PASSENGER OPERATIONS
// ================================================================

function addPassenger() {
  const input = document.getElementById("newPassenger");
  if (!input) return;
  
  const name = input.value.trim();
  if (name !== "") {
    passengers.push({ name: name, status: "Waiting" });
    saveData();
    renderPassengers();
    renderPassengerDropdown();
    input.value = "";
    showToast(`Passenger "${name}" added successfully!`, "success");
  } else {
    showToast("Please enter a passenger name", "error");
  }
}

function deletePassenger(index) {
  if (index >= 0 && index < passengers.length) {
    const name = passengers[index].name;
    if (confirm(`Remove passenger "${name}"?`)) {
      passengers.splice(index, 1);
      saveData();
      renderPassengers();
      renderPassengerDropdown();
      showToast(`Passenger removed`, "info");
    }
  }
}

function resetPassengerStatuses() {
  if (confirm("Start a new month and reset all passengers to Waiting?")) {
    passengers.forEach(passenger => { passenger.status = "Waiting"; });
    saveData();
    renderPassengers();
    showToast("Month reset successfully!", "success");
  }
}

function getPassengerPaidThisMonth(name) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let total = 0;
  
  incomeHistory.forEach(item => {
    if (item.name !== name) return;
    const paymentDate = new Date(item.date);
    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
      total += item.amount;
    }
  });
  return total;
}

// ================================================================
// 8. FINANCIAL OPERATIONS
// ================================================================

function addIncome() {
  const sourceSelect = document.getElementById("incomeSource");
  const passengerSelect = document.getElementById("passengerName");
  const descriptionInput = document.getElementById("incomeDescription");
  const amountInput = document.getElementById("incomeInput");
  
  if (!sourceSelect || !amountInput) return;
  
  const source = sourceSelect.value;
  let name = "";
  
  if (source === "Passenger") {
    if (!passengerSelect) return;
    name = passengerSelect.value;
  } else {
    if (!descriptionInput) return;
    name = descriptionInput.value;
  }
  
  const value = parseFloat(amountInput.value);

  if (name.trim() !== "" && !isNaN(value) && value > 0) {
    income += value;
    incomeHistory.push({
      source: source,
      name: name,
      amount: value,
      date: new Date().toISOString()
    });

    const passenger = passengers.find(p => p.name === name);
    if (passenger) passenger.status = "Paid";

    saveData();
    updateUI();
    amountInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    showToast(`R${value.toFixed(2)} added as income!`, "success");
  } else {
    showToast("Please enter valid details", "error");
  }
}

function addExpense() {
  const categorySelect = document.getElementById("expenseCategory");
  const descriptionInput = document.getElementById("expenseDescription");
  const amountInput = document.getElementById("expenseInput");
  
  if (!categorySelect || !amountInput) return;
  
  let category = categorySelect.value;
  if (category === "Other") {
    if (!descriptionInput) return;
    category = descriptionInput.value;
  }
  
  const value = parseFloat(amountInput.value);

  if (category.trim() !== "" && !isNaN(value) && value > 0) {
    expenses += value;
    expenseHistory.push({
      category: category,
      amount: value,
      date: new Date().toISOString()
    });
    saveData();
    updateUI();
    amountInput.value = "";
    if (descriptionInput) descriptionInput.value = "";
    showToast(`R${value.toFixed(2)} added as expense!`, "info");
  } else {
    showToast("Please enter valid details", "error");
  }
}

// ================================================================
// 9. UI HELPERS
// ================================================================

function toggleIncomeFields() {
  const source = document.getElementById("incomeSource");
  const passengerGroup = document.getElementById("passengerGroup");
  const descriptionGroup = document.getElementById("descriptionGroup");
  
  if (!source || !passengerGroup || !descriptionGroup) return;
  
  if (source.value === "Passenger") {
    passengerGroup.style.display = "block";
    descriptionGroup.style.display = "none";
  } else {
    passengerGroup.style.display = "none";
    descriptionGroup.style.display = "block";
  }
}

function toggleExpenseField() {
  const category = document.getElementById("expenseCategory");
  const descriptionGroup = document.getElementById("expenseDescriptionGroup");
  
  if (!category || !descriptionGroup) return;
  descriptionGroup.style.display = category.value === "Other" ? "block" : "none";
}

// ================================================================
// 10. TAB NAVIGATION
// ================================================================

function showTab(tabId) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.remove("active-tab"));
  
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => item.classList.remove("active"));
  
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) selectedTab.classList.add("active-tab");
  
  const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (activeNav) activeNav.classList.add("active");
}

// ================================================================
// 11. DATA MANAGEMENT
// ================================================================

function clearDemoData() {
  if (confirm("Delete all income and expense history? Passengers and settings will stay.")) {
    income = 0;
    expenses = 0;
    incomeHistory = [];
    expenseHistory = [];
    saveData();
    updateUI();
    showToast("Demo data cleared successfully!", "info");
  }
}

function exportBackup() {
  const data = { 
    income, 
    expenses, 
    passengers, 
    incomeHistory, 
    expenseHistory, 
    monthlyFee 
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "route-ledger-backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Backup exported!", "success");
}

function importBackup() {
  const fileInput = document.getElementById("backupFile");
  if (!fileInput) return;
  
  const file = fileInput.files[0];
  if (!file) {
    showToast("Please select a backup file first.", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);
      income = data.income || 0;
      expenses = data.expenses || 0;
      passengers = data.passengers || [];
      incomeHistory = data.incomeHistory || [];
      expenseHistory = data.expenseHistory || [];
      monthlyFee = data.monthlyFee || 1800;
      saveData();
      updateUI();
      fileInput.value = "";
      showToast("Backup imported successfully!", "success");
    } catch {
      showToast("Invalid backup file.", "error");
    }
  };
  reader.readAsText(file);
}

// ================================================================
// 12. APP INITIALIZATION
// ================================================================

function initApp() {
  console.log("🚀 Route Ledger Pro initializing...");
  
  checkMonthReset();
  
  showTab("dashboard");
  updateUI();
  toggleIncomeFields();
  toggleExpenseField();
  loadTheme();
  loadReminderSettings();

  updateSyncStatus();
  checkCloudBackup();
  
  setInterval(() => {
    if (navigator.onLine) {
      autoSyncOnClose();
      updateSyncStatus();
    }
  }, 300000);
  
  setTimeout(() => {
    checkOverdueOnLoad();
  }, 3000);
  
  requestNotificationPermission();
  checkOverduePassengers();
  
  console.log("✅ Route Ledger Pro initialized successfully!");
  console.log("📊 Current Month:", new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
  console.log("📊 Data loaded:", { 
    income, 
    expenses, 
    passengers: passengers.length, 
    monthlyFee,
    totalEntries: incomeHistory.length + expenseHistory.length
  });
}

// ================================================================
// 13. CHARTS
// ================================================================

let incomeExpenseChart = null;
let incomeBreakdownChart = null;

function initCharts() {
  const incomeExpenseCanvas = document.getElementById('incomeExpenseChart');
  const incomeBreakdownCanvas = document.getElementById('incomeBreakdownChart');
  
  if (!incomeExpenseCanvas || !incomeBreakdownCanvas) return;
  
  if (incomeExpenseChart) incomeExpenseChart.destroy();
  if (incomeBreakdownChart) incomeBreakdownChart.destroy();
  
  const months = getLast6Months();
  const incomeData = getMonthlyIncome(months);
  const expenseData = getMonthlyExpenses(months);
  
  const ctx1 = incomeExpenseCanvas.getContext('2d');
  incomeExpenseChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { size: 12 }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#64748b',
            callback: function(value) { return 'R' + value; }
          },
          grid: { color: 'rgba(30, 41, 59, 0.5)' }
        },
        x: {
          ticks: {
            color: '#64748b'
          },
          grid: { display: false }
        }
      }
    }
  });
  
  const breakdown = getIncomeBreakdown();
  const ctx2 = incomeBreakdownCanvas.getContext('2d');
  incomeBreakdownChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Passenger', 'Delivery', 'Other'],
      datasets: [{
        data: [breakdown.passenger, breakdown.delivery, breakdown.other],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { size: 12 },
            padding: 16
          }
        }
      }
    }
  });
}

function getLast6Months() {
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthNames[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2));
  }
  return months;
}

function getMonthlyIncome(months) {
  const data = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = (now.getMonth() - i + 12) % 12;
    const year = now.getFullYear() - (i > now.getMonth() ? 1 : 0);
    let total = 0;
    
    incomeHistory.forEach(item => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        total += item.amount;
      }
    });
    data.push(total);
  }
  return data;
}

function getMonthlyExpenses(months) {
  const data = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = (now.getMonth() - i + 12) % 12;
    const year = now.getFullYear() - (i > now.getMonth() ? 1 : 0);
    let total = 0;
    
    expenseHistory.forEach(item => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        total += item.amount;
      }
    });
    data.push(total);
  }
  return data;
}

// ================================================================
// 14. THEME TOGGLE
// ================================================================

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (newTheme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }
  
  if (typeof initCharts === 'function') {
    setTimeout(initCharts, 100);
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (savedTheme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }
}

function getIncomeBreakdown() {
  let passenger = 0, delivery = 0, other = 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      if (item.source === 'Passenger') passenger += item.amount;
      else if (item.source === 'Delivery') delivery += item.amount;
      else other += item.amount;
    }
  });
  
  return { passenger, delivery, other };
}

// ================================================================
// 15. SMART FINANCE
// ================================================================

let monthlyTarget = localStorage.getItem("monthlyTarget") ? parseFloat(localStorage.getItem("monthlyTarget")) : 15000;
let budgetLimit = localStorage.getItem("budgetLimit") ? parseFloat(localStorage.getItem("budgetLimit")) : 8000;

function saveMonthlyTarget() {
  const input = document.getElementById("monthlyTargetInput");
  if (!input) return;
  
  const value = parseFloat(input.value);
  if (!isNaN(value) && value > 0) {
    monthlyTarget = value;
    localStorage.setItem("monthlyTarget", monthlyTarget);
    updateUI();
    showToast(`Monthly target set to R${monthlyTarget.toFixed(2)}`, "success");
    input.value = "";
  } else {
    showToast("Please enter a valid target amount", "error");
  }
}

function saveBudget() {
  const input = document.getElementById("budgetInput");
  if (!input) return;
  
  const value = parseFloat(input.value);
  if (!isNaN(value) && value > 0) {
    budgetLimit = value;
    localStorage.setItem("budgetLimit", budgetLimit);
    updateUI();
    showToast(`Budget set to R${budgetLimit.toFixed(2)}`, "success");
    input.value = "";
  } else {
    showToast("Please enter a valid budget amount", "error");
  }
}

function saveFinanceSettings() {
  const targetInput = document.getElementById("settingsMonthlyTarget");
  const budgetInput = document.getElementById("settingsBudget");
  
  if (targetInput) {
    const target = parseFloat(targetInput.value);
    if (!isNaN(target) && target > 0) {
      monthlyTarget = target;
      localStorage.setItem("monthlyTarget", monthlyTarget);
    }
  }
  
  if (budgetInput) {
    const budget = parseFloat(budgetInput.value);
    if (!isNaN(budget) && budget > 0) {
      budgetLimit = budget;
      localStorage.setItem("budgetLimit", budgetLimit);
    }
  }
  
  updateUI();
  showToast("Finance settings saved!", "success");
}

function updateSmartFinance() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      monthlyIncome += item.amount;
    }
  });
  
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      monthlyExpenses += item.amount;
    }
  });
  
  const netProfit = monthlyIncome - monthlyExpenses;
  const profitMargin = monthlyIncome > 0 ? (netProfit / monthlyIncome) * 100 : 0;
  
  document.getElementById("netProfit").innerText = "R" + netProfit.toFixed(2);
  document.getElementById("profitMargin").innerText = profitMargin.toFixed(1) + "%";
  
  const breakEven = monthlyExpenses;
  document.getElementById("breakEven").innerText = "R" + breakEven.toFixed(2);
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysPassed = Math.min(now.getDate(), daysInMonth);
  const dailyAverage = daysPassed > 0 ? monthlyIncome / daysPassed : 0;
  document.getElementById("dailyAverage").innerText = "R" + dailyAverage.toFixed(2);
  
  const targetProgress = monthlyTarget > 0 ? Math.min(100, (monthlyIncome / monthlyTarget) * 100) : 0;
  document.getElementById("targetProgress").innerText = targetProgress.toFixed(0) + "%";
  document.getElementById("targetCollected").innerText = monthlyIncome.toFixed(0);
  document.getElementById("monthlyTarget").innerText = monthlyTarget.toFixed(0);
  
  const targetBar = document.getElementById("targetProgressBar");
  if (targetBar) {
    targetBar.style.width = targetProgress + "%";
    targetBar.className = "progress-bar";
    if (targetProgress >= 100) {
      targetBar.style.background = "linear-gradient(90deg, var(--color-green), #10b981)";
    } else if (targetProgress >= 75) {
      targetBar.style.background = "linear-gradient(90deg, var(--color-cyan), var(--color-green))";
    } else if (targetProgress >= 50) {
      targetBar.style.background = "linear-gradient(90deg, var(--color-yellow), var(--color-cyan))";
    } else {
      targetBar.style.background = "linear-gradient(90deg, var(--color-red), var(--color-yellow))";
    }
  }
  
  const budgetUsed = budgetLimit > 0 ? Math.min(100, (monthlyExpenses / budgetLimit) * 100) : 0;
  document.getElementById("budgetUsed").innerText = budgetUsed.toFixed(0) + "%";
  document.getElementById("budgetSpent").innerText = monthlyExpenses.toFixed(0);
  document.getElementById("budgetLimit").innerText = budgetLimit.toFixed(0);
  
  const budgetBar = document.getElementById("budgetProgressBar");
  if (budgetBar) {
    budgetBar.style.width = budgetUsed + "%";
    budgetBar.className = "progress-bar";
    if (budgetUsed >= 90) {
      budgetBar.className = "progress-bar danger";
    } else if (budgetUsed >= 75) {
      budgetBar.className = "progress-bar warning";
    }
  }
  
  const alertEl = document.getElementById("budgetAlert");
  if (alertEl) {
    if (budgetUsed >= 90) {
      alertEl.style.display = "block";
      alertEl.style.background = "rgba(239, 68, 68, 0.15)";
      alertEl.style.color = "var(--color-red)";
      alertEl.style.border = "1px solid rgba(239, 68, 68, 0.2)";
      alertEl.innerHTML = "⚠️ <strong>Budget Alert!</strong> You've used " + budgetUsed.toFixed(0) + "% of your monthly budget!";
    } else if (budgetUsed >= 75) {
      alertEl.style.display = "block";
      alertEl.style.background = "rgba(245, 158, 11, 0.15)";
      alertEl.style.color = "var(--color-yellow)";
      alertEl.style.border = "1px solid rgba(245, 158, 11, 0.2)";
      alertEl.innerHTML = "⚠️ <strong>Heads up!</strong> You've used " + budgetUsed.toFixed(0) + "% of your budget.";
    } else {
      alertEl.style.display = "none";
    }
  }
  
  const settingsTarget = document.getElementById("settingsMonthlyTarget");
  const settingsBudget = document.getElementById("settingsBudget");
  if (settingsTarget) settingsTarget.value = monthlyTarget;
  if (settingsBudget) settingsBudget.value = budgetLimit;
  
  if (targetProgress >= 100 && !localStorage.getItem("targetAchieved_" + currentMonth + "_" + currentYear)) {
    localStorage.setItem("targetAchieved_" + currentMonth + "_" + currentYear, "true");
    showToast("🎉 CONGRATULATIONS! You've achieved your monthly target of R" + monthlyTarget.toFixed(0) + "!", "success");
  }
}

// ================================================================
// 16. PASSENGER SELECTION & BATCH ACTIONS
// ================================================================

function togglePassengerSelection(index) {
  if (selectedPassengers.has(index)) {
    selectedPassengers.delete(index);
  } else {
    selectedPassengers.add(index);
  }
  updateSelectedCount();
}

function selectAllPassengers() {
  passengers.forEach((_, index) => {
    selectedPassengers.add(index);
  });
  renderPassengers();
  showToast(`Selected ${passengers.length} passengers`, "info");
}

function deselectAllPassengers() {
  selectedPassengers.clear();
  renderPassengers();
  showToast("All passengers deselected", "info");
}

function updateSelectedCount() {
  const el = document.getElementById("selectedCount");
  if (el) {
    el.textContent = `${selectedPassengers.size} selected`;
  }
}

function markSelectedPaid() {
  if (selectedPassengers.size === 0) {
    showToast("Please select at least one passenger", "error");
    return;
  }
  
  if (!confirm(`Mark ${selectedPassengers.size} passenger(s) as paid?`)) return;
  
  let count = 0;
  selectedPassengers.forEach(index => {
    if (index < passengers.length) {
      const passenger = passengers[index];
      const paidAmount = getPassengerPaidThisMonth(passenger.name);
      
      if (paidAmount < monthlyFee) {
        const remaining = monthlyFee - paidAmount;
        income += remaining;
        incomeHistory.push({
          source: "Passenger",
          name: passenger.name,
          amount: remaining,
          date: new Date().toISOString()
        });
        passenger.status = "Paid";
        count++;
      }
    }
  });
  
  selectedPassengers.clear();
  saveData();
  updateUI();
  showToast(`✅ ${count} passenger(s) marked as paid!`, "success");
}

function exportPassengerData() {
  if (passengers.length === 0) {
    showToast("No passengers to export", "error");
    return;
  }
  
  let csv = "Passenger,Monthly Fee,Paid This Month,Outstanding,Status\n";
  
  passengers.forEach(passenger => {
    const paid = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paid);
    let status = "Waiting";
    if (paid >= monthlyFee) status = "Paid";
    else if (paid > 0) status = "Partial";
    
    csv += `${passenger.name},${monthlyFee},${paid.toFixed(2)},${outstanding.toFixed(2)},${status}\n`;
  });
  
  const totalExpected = passengers.length * monthlyFee;
  const totalCollected = passengers.reduce((sum, p) => sum + getPassengerPaidThisMonth(p.name), 0);
  csv += `\nTOTAL,,${totalCollected.toFixed(2)},${(totalExpected - totalCollected).toFixed(2)},`;
  
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `passenger-data-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("📊 Passenger data exported successfully!", "success");
}

// ================================================================
// 17. PASSENGER MODAL
// ================================================================

function openPassengerModal(index) {
  if (index < 0 || index >= passengers.length) return;
  
  const passenger = passengers[index];
  currentModalPassenger = index;
  const paidAmount = getPassengerPaidThisMonth(passenger.name);
  const outstanding = Math.max(0, monthlyFee - paidAmount);
  const isOverdue = isPassengerOverdue(passenger.name);
  const dueDate = getPassengerDueDate(passenger.name);
  const note = passengerNotes[passenger.name] || "";
  
  document.getElementById("modalPassengerName").textContent = passenger.name + (isOverdue ? " ⚠️ Overdue" : "");
  
  document.getElementById("modalMonthlyFee").textContent = "R" + monthlyFee.toFixed(2);
  document.getElementById("modalPaid").textContent = "R" + paidAmount.toFixed(2);
  document.getElementById("modalOutstanding").textContent = "R" + outstanding.toFixed(2);
  
  let status = "Waiting", statusColor = "#ef4444";
  if (paidAmount >= monthlyFee) {
    status = "✅ Paid";
    statusColor = "#10b981";
  } else if (paidAmount > 0) {
    status = "🟡 Partial";
    statusColor = "#f59e0b";
  }
  if (isOverdue) status += " (Overdue)";
  
  document.getElementById("modalStatus").textContent = status;
  document.getElementById("modalStatus").style.color = statusColor;
  
  const statsContainer = document.getElementById("modalStats");
  let dueInfo = document.getElementById("modalDueInfo");
  if (!dueInfo) {
    dueInfo = document.createElement('div');
    dueInfo.id = "modalDueInfo";
    dueInfo.style.cssText = `
      background: var(--bg-primary);
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      margin-bottom: 12px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
    `;
    statsContainer.parentNode.insertBefore(dueInfo, statsContainer.nextSibling);
  }
  dueInfo.innerHTML = `
    <span style="color:var(--text-secondary);">📅 Due Date:</span>
    <span style="font-weight:600;">${dueDate.toLocaleDateString()}</span>
  `;
  
  let noteContainer = document.getElementById("modalNoteContainer");
  if (!noteContainer) {
    noteContainer = document.createElement('div');
    noteContainer.id = "modalNoteContainer";
    noteContainer.style.cssText = "margin-top:12px;";
    noteContainer.innerHTML = `
      <label style="font-size:13px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:4px;">
        📝 Notes
      </label>
      <div style="display:flex;gap:8px;">
        <input id="modalNoteInput" type="text" placeholder="Add a note..." class="form-control" style="flex:1;" />
        <button onclick="savePassengerNote()" class="btn btn-primary" style="width:auto;padding:8px 16px;">
          <i class="fas fa-save"></i>
        </button>
      </div>
      <div id="modalNoteDisplay" style="margin-top:8px;font-size:13px;color:var(--text-secondary);"></div>
    `;
    statsContainer.parentNode.insertBefore(noteContainer, statsContainer.nextSibling);
  }
  
  const noteInput = document.getElementById("modalNoteInput");
  const noteDisplay = document.getElementById("modalNoteDisplay");
  if (noteInput) noteInput.value = note;
  if (noteDisplay) {
    noteDisplay.textContent = note ? "📝 " + note : "No notes";
    noteDisplay.style.color = note ? "var(--text-primary)" : "var(--text-muted)";
  }
  
  const historyList = document.getElementById("modalHistoryList");
  historyList.innerHTML = "";
  
  const payments = incomeHistory
    .filter(item => item.name === passenger.name)
    .reverse();
  
  if (payments.length === 0) {
    historyList.innerHTML = '<li style="color:var(--text-muted);text-align:center;padding:20px;">No payments recorded</li>';
  } else {
    payments.forEach(item => {
      const li = document.createElement("li");
      const date = new Date(item.date).toLocaleDateString();
      li.innerHTML = `
        <span>
          <span class="history-date">${date}</span>
          <span style="font-size:12px;color:var(--text-secondary);">${item.source}</span>
        </span>
        <span class="history-amount">+R${item.amount.toFixed(2)}</span>
      `;
      historyList.appendChild(li);
    });
  }
  
  document.getElementById("passengerModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePassengerModal() {
  document.getElementById("passengerModal").classList.remove("active");
  document.body.style.overflow = "";
  currentModalPassenger = null;
}

function markPassengerPaid() {
  if (currentModalPassenger === null) return;
  
  const passenger = passengers[currentModalPassenger];
  const paidAmount = getPassengerPaidThisMonth(passenger.name);
  const remaining = Math.max(0, monthlyFee - paidAmount);
  
  if (remaining <= 0) {
    showToast("This passenger is already fully paid!", "info");
    return;
  }
  
  income += remaining;
  incomeHistory.push({
    source: "Passenger",
    name: passenger.name,
    amount: remaining,
    date: new Date().toISOString()
  });
  passenger.status = "Paid";
  
  saveData();
  updateUI();
  closePassengerModal();
  showToast(`✅ ${passenger.name} marked as paid!`, "success");
}

function savePassengerNote() {
  if (currentModalPassenger === null) return;
  const passenger = passengers[currentModalPassenger];
  const noteInput = document.getElementById("modalNoteInput");
  if (!noteInput) return;
  
  const note = noteInput.value.trim();
  if (note) {
    passengerNotes[passenger.name] = note;
  } else {
    delete passengerNotes[passenger.name];
  }
  
  localStorage.setItem("passengerNotes", JSON.stringify(passengerNotes));
  
  const noteDisplay = document.getElementById("modalNoteDisplay");
  if (noteDisplay) {
    noteDisplay.textContent = note ? "📝 " + note : "No notes";
    noteDisplay.style.color = note ? "var(--text-primary)" : "var(--text-muted)";
  }
  
  renderPassengers();
  showToast("Note saved!", "success");
}

// ================================================================
// 18. PASSENGER RANKING
// ================================================================

function updatePassengerRanking() {
  const list = document.getElementById("passengerRanking");
  if (!list) return;
  
  if (passengers.length === 0) {
    list.innerHTML = '<li style="color:var(--text-muted);text-align:center;padding:20px;">Add passengers to see ranking</li>';
    return;
  }
  
  const ranking = passengers.map(passenger => {
    const paid = getPassengerPaidThisMonth(passenger.name);
    return { name: passenger.name, paid: paid };
  }).sort((a, b) => b.paid - a.paid);
  
  list.innerHTML = "";
  ranking.forEach((item, index) => {
    const li = document.createElement("li");
    let rankClass = "rank-other";
    let rankText = `#${index + 1}`;
    
    if (index === 0) {
      rankClass = "rank-1";
      rankText = "🥇";
    } else if (index === 1) {
      rankClass = "rank-2";
      rankText = "🥈";
    } else if (index === 2) {
      rankClass = "rank-3";
      rankText = "🥉";
    }
    
    li.innerHTML = `
      <span>
        <span class="rank-number ${rankClass}">${rankText}</span>
        <span class="rank-name">${item.name}</span>
      </span>
      <span class="rank-amount">R${item.paid.toFixed(2)}</span>
    `;
    list.appendChild(li);
  });
}

// ================================================================
// 19. ADVANCED ANALYTICS
// ================================================================

let expenseBreakdownChart = null;

function updateAdvancedAnalytics() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  updateMonthComparison(currentMonth, currentYear, monthNames);
  updateYearToDate(currentYear);
  updateExpenseBreakdownChart();
  updateBestWorstMonths();
  updateTrendsTable(currentMonth, currentYear, monthNames);
  updateGrowthRate(currentMonth, currentYear);
  updateAverageMonthlyIncome();
}

function updateMonthComparison(currentMonth, currentYear, monthNames) {
  let thisMonthIncome = 0;
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      thisMonthIncome += item.amount;
    }
  });
  
  let lastMonthIncome = 0;
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear = currentYear - 1;
  }
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
      lastMonthIncome += item.amount;
    }
  });
  
  let change = 0;
  let changeText = '0%';
  let changeClass = '';
  let changeLabel = 'vs last month';
  
  if (lastMonthIncome > 0) {
    change = ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
    changeText = (change > 0 ? '+' : '') + change.toFixed(1) + '%';
    changeClass = change >= 0 ? 'positive' : 'negative';
    changeLabel = change >= 0 ? '↑ vs last month' : '↓ vs last month';
  } else if (thisMonthIncome > 0) {
    changeText = '+100%';
    changeClass = 'positive';
    changeLabel = '↑ vs last month';
  }
  
  document.getElementById('thisMonthIncome').textContent = 'R' + thisMonthIncome.toFixed(2);
  document.getElementById('lastMonthIncome').textContent = 'R' + lastMonthIncome.toFixed(2);
  
  const changeEl = document.getElementById('incomeChange');
  changeEl.textContent = changeText;
  changeEl.className = 'comparison-value ' + changeClass;
  
  document.getElementById('incomeChangeLabel').textContent = changeLabel;
}

function updateYearToDate(currentYear) {
  let totalIncome = 0;
  let totalExpenses = 0;
  let monthCount = 0;
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getFullYear() === currentYear) {
      totalIncome += item.amount;
      monthCount++;
    }
  });
  
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getFullYear() === currentYear) {
      totalExpenses += item.amount;
    }
  });
  
  const profit = totalIncome - totalExpenses;
  const avgMonthly = monthCount > 0 ? totalIncome / monthCount : 0;
  
  document.getElementById('ytdIncome').textContent = 'R' + totalIncome.toFixed(2);
  document.getElementById('ytdExpenses').textContent = 'R' + totalExpenses.toFixed(2);
  document.getElementById('ytdProfit').textContent = 'R' + profit.toFixed(2);
  document.getElementById('ytdAverage').textContent = 'R' + avgMonthly.toFixed(2);
}

function updateExpenseBreakdownChart() {
  const canvas = document.getElementById('expenseBreakdownChart');
  if (!canvas) return;
  
  const categories = {};
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      const category = item.category || 'Other';
      categories[category] = (categories[category] || 0) + item.amount;
    }
  });
  
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const labels = sortedCategories.map(c => c[0]);
  const data = sortedCategories.map(c => c[1]);
  const colors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
    '#ef4444', '#06b6d4', '#ec4899', '#f97316'
  ];
  
  if (expenseBreakdownChart) {
    expenseBreakdownChart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  expenseBreakdownChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.length > 0 ? labels : ['No Expenses'],
      datasets: [{
        data: data.length > 0 ? data : [1],
        backgroundColor: colors.slice(0, data.length || 1),
        borderColor: 'var(--bg-primary)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
  
  updateExpenseLegend(sortedCategories, colors);
}

function updateExpenseLegend(categories, colors) {
  const legend = document.getElementById('expenseLegend');
  if (!legend) return;
  
  legend.innerHTML = '';
  if (categories.length === 0) {
    legend.innerHTML = '<li style="color:var(--text-muted);text-align:center;grid-column:1/-1;">No expenses this month</li>';
    return;
  }
  
  categories.forEach(([category, amount], index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="legend-color" style="background:${colors[index % colors.length]}"></span>
      ${category}
      <span class="legend-amount">R${amount.toFixed(2)}</span>
    `;
    legend.appendChild(li);
  });
}

function updateBestWorstMonths() {
  const monthlyData = {};
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    monthlyData[key] = (monthlyData[key] || 0) + item.amount;
  });
  
  const months = Object.entries(monthlyData);
  
  if (months.length === 0) {
    document.getElementById('bestMonth').innerHTML = '<span style="color:var(--text-muted);font-size:13px;">No data yet</span>';
    document.getElementById('worstMonth').innerHTML = '<span style="color:var(--text-muted);font-size:13px;">No data yet</span>';
    return;
  }
  
  const sorted = months.sort((a, b) => b[1] - a[1]);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const formatMonth = (key) => {
    const parts = key.split('-');
    const year = parts[0];
    const month = parseInt(parts[1]) - 1;
    return monthNames[month] + ' ' + year;
  };
  
  document.getElementById('bestMonth').innerHTML = `
    <div class="month-info">
      <div class="month-name">${formatMonth(best[0])}</div>
      <div class="month-amount">R${best[1].toFixed(2)}</div>
    </div>
  `;
  
  document.getElementById('worstMonth').innerHTML = `
    <div class="month-info">
      <div class="month-name">${formatMonth(worst[0])}</div>
      <div class="month-amount">R${worst[1].toFixed(2)}</div>
    </div>
  `;
}

function updateTrendsTable(currentMonth, currentYear, monthNames) {
  const tbody = document.getElementById('trendsBody');
  if (!tbody) return;
  
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const month = (currentMonth - i + 12) % 12;
    const year = currentYear - (i > currentMonth ? 1 : 0);
    months.push({ month, year, name: monthNames[month] + ' ' + year });
  }
  
  let html = '';
  let hasData = false;
  
  months.forEach(({ month, year, name }) => {
    let income = 0;
    let expenses = 0;
    
    incomeHistory.forEach(item => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        income += item.amount;
      }
    });
    
    expenseHistory.forEach(item => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        expenses += item.amount;
      }
    });
    
    const profit = income - expenses;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    
    if (income > 0 || expenses > 0) hasData = true;
    
    html += `
      <tr>
        <td><strong>${name}</strong></td>
        <td class="positive">R${income.toFixed(2)}</td>
        <td class="negative">R${expenses.toFixed(2)}</td>
        <td class="${profit >= 0 ? 'positive' : 'negative'}">R${profit.toFixed(2)}</td>
        <td>${margin.toFixed(1)}%</td>
      </tr>
    `;
  });
  
  if (!hasData) {
    html = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px;">No data available</td></tr>';
  }
  
  tbody.innerHTML = html;
}

function updateGrowthRate(currentMonth, currentYear) {
  let recentTotal = 0;
  let previousTotal = 0;
  
  for (let i = 0; i < 3; i++) {
    const month = (currentMonth - i + 12) % 12;
    const year = currentYear - (i > currentMonth ? 1 : 0);
    
    incomeHistory.forEach(item => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        recentTotal += item.amount;
      }
    });
  }
  
  for (let i = 3; i < 6; i++) {
    const month = (currentMonth - i + 12) % 12;
    const year = currentYear - (i > currentMonth ? 1 : 0);
    
    incomeHistory.forEach(item => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        previousTotal += item.amount;
      }
    });
  }
  
  let growthRate = 0;
  if (previousTotal > 0) {
    growthRate = ((recentTotal - previousTotal) / previousTotal) * 100;
  } else if (recentTotal > 0) {
    growthRate = 100;
  }
  
  const el = document.getElementById('growthRate');
  if (el) {
    el.textContent = (growthRate >= 0 ? '+' : '') + growthRate.toFixed(1) + '%';
    el.style.color = growthRate >= 0 ? 'var(--color-green)' : 'var(--color-red)';
  }
}

function updateAverageMonthlyIncome() {
  const monthKeys = new Set();
  let totalIncome = 0;
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    const key = date.getFullYear() + '-' + date.getMonth();
    monthKeys.add(key);
    totalIncome += item.amount;
  });
  
  const avg = monthKeys.size > 0 ? totalIncome / monthKeys.size : 0;
  document.getElementById('avgMonthlyIncome').textContent = 'R' + avg.toFixed(2);
}

// ================================================================
// 20. REPORTS & EXPORT
// ================================================================

function generatePDF() {
  showToast("📄 Generating full report...", "info");
  
  const monthInput = document.getElementById('pdfReportMonth');
  let selectedDate = new Date();
  
  if (monthInput && monthInput.value) {
    const parts = monthInput.value.split('-');
    selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  }
  
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  const data = getFullMonthData(month, year);
  
  const reportContent = document.createElement('div');
  reportContent.id = 'reportContent';
  reportContent.style.cssText = `
    padding: 40px;
    background: white;
    font-family: 'Inter', Arial, sans-serif;
    max-width: 900px;
    margin: 0 auto;
    color: #0a0e17;
  `;
  
  let incomeDetailsHTML = '';
  if (data.incomeDetails.length > 0) {
    incomeDetailsHTML = data.incomeDetails.map(item => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">${item.date}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">${item.source}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">${item.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;font-weight:600;color:#10b981;">R${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');
  } else {
    incomeDetailsHTML = `<tr><td colspan="4" style="padding:12px;text-align:center;color:#94a3b8;">No income recorded</td></tr>`;
  }
  
  let expenseDetailsHTML = '';
  if (data.expenseDetails.length > 0) {
    expenseDetailsHTML = data.expenseDetails.map(item => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">${item.date}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">${item.category}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;font-weight:600;color:#ef4444;">R${item.amount.toFixed(2)}</td>
      </tr>
    `).join('');
  } else {
    expenseDetailsHTML = `<tr><td colspan="3" style="padding:12px;text-align:center;color:#94a3b8;">No expenses recorded</td></tr>`;
  }
  
  let passengerDetailsHTML = '';
  if (data.passengerDetails.length > 0) {
    passengerDetailsHTML = data.passengerDetails.map(p => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;">${p.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;">R${p.paid.toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:right;">R${p.outstanding.toFixed(2)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:13px;text-align:center;">
          <span style="background:${p.status === 'Paid' ? '#dcfce7' : p.status === 'Partial' ? '#fef3c7' : '#f1f5f9'};padding:2px 12px;border-radius:12px;font-size:12px;font-weight:500;color:${p.status === 'Paid' ? '#10b981' : p.status === 'Partial' ? '#f59e0b' : '#94a3b8'};">${p.status}</span>
        </td>
      </tr>
    `).join('');
  } else {
    passengerDetailsHTML = `<tr><td colspan="4" style="padding:12px;text-align:center;color:#94a3b8;">No passengers added</td></tr>`;
  }
  
  reportContent.innerHTML = `
    <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #10b981;padding-bottom:20px;">
      <h1 style="font-size:32px;color:#0a0e17;margin:0;">🚀 Route Ledger</h1>
      <p style="font-size:18px;color:#475569;margin:5px 0 0;">Business Finance Report</p>
      <p style="font-size:15px;color:#94a3b8;margin:5px 0 0;">${monthNames[month]} ${year}</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:8px;">Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:30px;">
      <div style="background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;border:1px solid #bbf7d0;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">Total Income</div>
        <div style="font-size:28px;font-weight:700;color:#10b981;">R${data.summary.income.toFixed(2)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${data.incomeDetails.length} transactions</div>
      </div>
      <div style="background:#fef2f2;padding:16px;border-radius:8px;text-align:center;border:1px solid #fecaca;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">Total Expenses</div>
        <div style="font-size:28px;font-weight:700;color:#ef4444;">R${data.summary.expenses.toFixed(2)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${data.expenseDetails.length} transactions</div>
      </div>
      <div style="background:${data.summary.profit >= 0 ? '#f0fdf4' : '#fef2f2'};padding:16px;border-radius:8px;text-align:center;border:1px solid ${data.summary.profit >= 0 ? '#bbf7d0' : '#fecaca'};">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">Net Profit</div>
        <div style="font-size:28px;font-weight:700;color:${data.summary.profit >= 0 ? '#10b981' : '#ef4444'};">R${data.summary.profit.toFixed(2)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">${data.summary.profit >= 0 ? '✅ Profitable' : '❌ Loss'}</div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:30px;">
      <div style="background:#f8fafc;padding:16px;border-radius:8px;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">Passengers</div>
        <div style="font-size:24px;font-weight:700;">${data.summary.passengerCount}</div>
        <div style="font-size:14px;color:#64748b;margin-top:4px;">
          <span style="color:#10b981;">${data.summary.paidCount} Paid</span> · 
          <span style="color:#f59e0b;">${data.summary.partialCount} Partial</span> · 
          <span style="color:#94a3b8;">${data.summary.waitingCount} Waiting</span>
        </div>
      </div>
      <div style="background:#f8fafc;padding:16px;border-radius:8px;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;">Collection Rate</div>
        <div style="font-size:24px;font-weight:700;color:${data.summary.collectionRate >= 80 ? '#10b981' : data.summary.collectionRate >= 50 ? '#f59e0b' : '#ef4444'};">${data.summary.collectionRate}%</div>
        <div style="font-size:14px;color:#64748b;margin-top:4px;">
          R${data.summary.collected.toFixed(2)} / R${data.summary.expected.toFixed(2)}
        </div>
      </div>
    </div>
    
    <div style="margin-bottom:30px;">
      <h3 style="font-size:16px;color:#0a0e17;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <span style="background:#10b981;color:white;padding:2px 10px;border-radius:4px;font-size:12px;">${data.incomeDetails.length}</span>
        Income Details
      </h3>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead style="background:#f1f5f9;">
            <tr>
              <th style="padding:8px 10px;text-align:left;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Date</th>
              <th style="padding:8px 10px;text-align:left;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Source</th>
              <th style="padding:8px 10px;text-align:left;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">From</th>
              <th style="padding:8px 10px;text-align:right;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${incomeDetailsHTML}
            <tr style="background:#f0fdf4;font-weight:700;">
              <td colspan="3" style="padding:8px 10px;text-align:right;font-size:14px;">TOTAL INCOME</td>
              <td style="padding:8px 10px;text-align:right;font-size:14px;color:#10b981;">R${data.summary.income.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div style="margin-bottom:30px;">
      <h3 style="font-size:16px;color:#0a0e17;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <span style="background:#ef4444;color:white;padding:2px 10px;border-radius:4px;font-size:12px;">${data.expenseDetails.length}</span>
        Expense Details
      </h3>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead style="background:#f1f5f9;">
            <tr>
              <th style="padding:8px 10px;text-align:left;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Date</th>
              <th style="padding:8px 10px;text-align:left;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Category</th>
              <th style="padding:8px 10px;text-align:right;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenseDetailsHTML}
            <tr style="background:#fef2f2;font-weight:700;">
              <td colspan="2" style="padding:8px 10px;text-align:right;font-size:14px;">TOTAL EXPENSES</td>
              <td style="padding:8px 10px;text-align:right;font-size:14px;color:#ef4444;">R${data.summary.expenses.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div style="margin-bottom:30px;">
      <h3 style="font-size:16px;color:#0a0e17;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <span style="background:#8b5cf6;color:white;padding:2px 10px;border-radius:4px;font-size:12px;">${data.passengerDetails.length}</span>
        Passenger Summary
      </h3>
      <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead style="background:#f1f5f9;">
            <tr>
              <th style="padding:8px 10px;text-align:left;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Name</th>
              <th style="padding:8px 10px;text-align:right;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Paid</th>
              <th style="padding:8px 10px;text-align:right;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Outstanding</th>
              <th style="padding:8px 10px;text-align:center;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${passengerDetailsHTML}
          </tbody>
        </table>
      </div>
    </div>
    
    <div style="text-align:center;padding-top:20px;border-top:2px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      <p>Report generated from Route Ledger Pro</p>
      <p style="margin-top:4px;">${new Date().toLocaleString()}</p>
    </div>
  `;
  
  document.body.appendChild(reportContent);
  
  html2canvas(reportContent, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    width: reportContent.scrollWidth,
    height: reportContent.scrollHeight,
    windowHeight: reportContent.scrollHeight
  }).then(canvas => {
    document.body.removeChild(reportContent);
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const maxPageHeight = pdf.internal.pageSize.getHeight();
    
    let heightLeft = pdfHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= maxPageHeight;
    
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= maxPageHeight;
    }
    
    pdf.save(`Route_Ledger_Full_Report_${monthNames[month]}_${year}.pdf`);
    
    showToast("✅ Full PDF Report generated successfully!", "success");
  }).catch(error => {
    document.body.removeChild(reportContent);
    showToast("❌ Error generating PDF. Please try again.", "error");
    console.error("PDF Error:", error);
  });
}

function getFullMonthData(month, year) {
  const incomeDetails = [];
  let totalIncome = 0;
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      incomeDetails.push({
        date: date.toLocaleDateString(),
        source: item.source,
        name: item.name,
        amount: item.amount
      });
      totalIncome += item.amount;
    }
  });
  
  const expenseDetails = [];
  let totalExpenses = 0;
  
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      expenseDetails.push({
        date: date.toLocaleDateString(),
        category: item.category,
        amount: item.amount
      });
      totalExpenses += item.amount;
    }
  });
  
  const passengerDetails = [];
  let paidCount = 0;
  let partialCount = 0;
  let waitingCount = 0;
  let totalCollected = 0;
  
  passengers.forEach(passenger => {
    const paid = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paid);
    totalCollected += paid;
    
    let status = 'Waiting';
    if (paid >= monthlyFee) {
      status = 'Paid';
      paidCount++;
    } else if (paid > 0) {
      status = 'Partial';
      partialCount++;
    } else {
      waitingCount++;
    }
    
    passengerDetails.push({
      name: passenger.name,
      paid: paid,
      outstanding: outstanding,
      status: status
    });
  });
  
  passengerDetails.sort((a, b) => b.paid - a.paid);
  
  const expected = passengers.length * monthlyFee;
  const profit = totalIncome - totalExpenses;
  const collectionRate = expected > 0 ? (totalCollected / expected) * 100 : 0;
  
  return {
    summary: {
      income: totalIncome,
      expenses: totalExpenses,
      profit: profit,
      passengerCount: passengers.length,
      paidCount: paidCount,
      partialCount: partialCount,
      waitingCount: waitingCount,
      collected: totalCollected,
      expected: expected,
      collectionRate: collectionRate.toFixed(1)
    },
    incomeDetails: incomeDetails.sort((a, b) => new Date(b.date) - new Date(a.date)),
    expenseDetails: expenseDetails.sort((a, b) => new Date(b.date) - new Date(a.date)),
    passengerDetails: passengerDetails
  };
}

function printReport() {
  showToast("🖨️ Preparing print...", "info");
  
  const monthInput = document.getElementById('pdfReportMonth');
  if (monthInput && monthInput.value) {
    const parts = monthInput.value.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('reportMonthDisplay').textContent = monthNames[date.getMonth()] + ' ' + date.getFullYear();
  }
  
  setTimeout(() => {
    window.print();
  }, 500);
}

function exportFullData() {
  if (incomeHistory.length === 0 && expenseHistory.length === 0) {
    showToast("No data to export", "error");
    return;
  }
  
  showToast("📊 Preparing data export...", "info");
  
  let csv = "=== ROUTE LEDGER - FULL DATA EXPORT ===\n\n";
  csv += `Export Date: ${new Date().toLocaleString()}\n`;
  csv += `Total Income: R${income.toFixed(2)}\n`;
  csv += `Total Expenses: R${expenses.toFixed(2)}\n`;
  csv += `Net Profit: R${(income - expenses).toFixed(2)}\n`;
  csv += `Active Passengers: ${passengers.length}\n\n`;
  
  csv += "=== INCOME HISTORY ===\n";
  csv += "Date,Source,Name,Amount\n";
  incomeHistory.forEach(item => {
    const date = new Date(item.date).toLocaleDateString();
    csv += `${date},${item.source},${item.name},${item.amount.toFixed(2)}\n`;
  });
  
  csv += "\n=== EXPENSE HISTORY ===\n";
  csv += "Date,Category,Amount\n";
  expenseHistory.forEach(item => {
    const date = new Date(item.date).toLocaleDateString();
    csv += `${date},${item.category},${item.amount.toFixed(2)}\n`;
  });
  
  csv += "\n=== PASSENGER SUMMARY ===\n";
  csv += "Name,Monthly Fee,Paid This Month,Outstanding,Status\n";
  passengers.forEach(passenger => {
    const paid = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paid);
    let status = "Waiting";
    if (paid >= monthlyFee) status = "Paid";
    else if (paid > 0) status = "Partial";
    csv += `${passenger.name},${monthlyFee},${paid.toFixed(2)},${outstanding.toFixed(2)},${status}\n`;
  });
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Route_Ledger_Full_Data_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast("✅ Full data exported successfully!", "success");
}

function getMonthData(month, year) {
  let income = 0;
  let expenses = 0;
  let passengerIncome = 0;
  let deliveryIncome = 0;
  let otherIncome = 0;
  const expenseCategories = {};
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      income += item.amount;
      if (item.source === 'Passenger') passengerIncome += item.amount;
      else if (item.source === 'Delivery') deliveryIncome += item.amount;
      else otherIncome += item.amount;
    }
  });
  
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === month && date.getFullYear() === year) {
      expenses += item.amount;
      const category = item.category || 'Other';
      expenseCategories[category] = (expenseCategories[category] || 0) + item.amount;
    }
  });
  
  const profit = income - expenses;
  const passengerCount = passengers.length;
  let paidCount = 0;
  let waitingCount = 0;
  let collected = 0;
  let expected = passengerCount * monthlyFee;
  
  passengers.forEach(passenger => {
    const paid = getPassengerPaidThisMonth(passenger.name);
    collected += paid;
    if (paid >= monthlyFee) paidCount++;
    else waitingCount++;
  });
  
  const collectionRate = expected > 0 ? (collected / expected) * 100 : 0;
  
  const topExpenses = Object.entries(expenseCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, amount]) => ({ category, amount }));
  
  return {
    income,
    expenses,
    profit,
    passengerIncome,
    deliveryIncome,
    otherIncome,
    passengerCount,
    paidCount,
    waitingCount,
    collected,
    expected,
    collectionRate: collectionRate.toFixed(1),
    topExpenses
  };
}

function updateReportSummary() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const data = getMonthData(month, year);
  
  document.getElementById('reportSummaryIncome').textContent = 'R' + data.income.toFixed(2);
  document.getElementById('reportSummaryExpenses').textContent = 'R' + data.expenses.toFixed(2);
  document.getElementById('reportSummaryProfit').textContent = 'R' + data.profit.toFixed(2);
  document.getElementById('reportSummaryPassengers').textContent = data.passengerCount;
  document.getElementById('reportSummaryCollection').textContent = data.collectionRate + '%';
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysPassed = Math.min(now.getDate(), daysInMonth);
  const dailyAvg = daysPassed > 0 ? data.income / daysPassed : 0;
  document.getElementById('reportSummaryDaily').textContent = 'R' + dailyAvg.toFixed(2);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('reportMonthDisplay').textContent = monthNames[month] + ' ' + year;
  
  const monthInput = document.getElementById('pdfReportMonth');
  if (monthInput) {
    const value = year + '-' + String(month + 1).padStart(2, '0');
    monthInput.value = value;
  }
}

// ================================================================
// 21. CLICKABLE STATS
// ================================================================

function goToHistory(type) {
  showTab('history');
  
  if (type === 'income') {
    const incomeCard = document.querySelector('.history-grid .card:first-child');
    if (incomeCard) {
      incomeCard.style.borderColor = 'var(--color-green)';
      incomeCard.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)';
      setTimeout(() => {
        incomeCard.style.borderColor = 'var(--border-color)';
        incomeCard.style.boxShadow = 'none';
      }, 3000);
    }
  } else if (type === 'expense') {
    const expenseCard = document.querySelector('.history-grid .card:last-child');
    if (expenseCard) {
      expenseCard.style.borderColor = 'var(--color-red)';
      expenseCard.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.2)';
      setTimeout(() => {
        expenseCard.style.borderColor = 'var(--border-color)';
        expenseCard.style.boxShadow = 'none';
      }, 3000);
    }
  }
  
  showToast(`📋 Viewing ${type} history`, "info");
}

// ================================================================
// 22. REMINDERS & AUTOMATION
// ================================================================

let defaultDueDay = localStorage.getItem("defaultDueDay") || "15";
let autoReminders = localStorage.getItem("autoReminders") || "enabled";
let reminderDays = parseInt(localStorage.getItem("reminderDays")) || 3;
let autoReset = localStorage.getItem("autoReset") || "enabled";

function saveDefaultDueDay() {
  const select = document.getElementById("defaultDueDay");
  if (!select) return;
  defaultDueDay = select.value;
  localStorage.setItem("defaultDueDay", defaultDueDay);
  showToast("Default due day saved: " + getDueDayDisplay(defaultDueDay), "success");
}

function getDueDayDisplay(value) {
  if (value === "last") return "Last Day";
  return value + (value === "1" ? "st" : value === "2" ? "nd" : value === "3" ? "rd" : "th");
}

function getPassengerDueDate(passengerName) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  let day = parseInt(defaultDueDay);
  if (defaultDueDay === "last") {
    day = new Date(year, month + 1, 0).getDate();
  }
  
  let dueDate = new Date(year, month, day);
  if (dueDate < now) {
    dueDate = new Date(year, month + 1, day);
  }
  
  return dueDate;
}

function isPassengerOverdue(passengerName) {
  const paidAmount = getPassengerPaidThisMonth(passengerName);
  if (paidAmount >= monthlyFee) return false;
  
  const dueDate = getPassengerDueDate(passengerName);
  const now = new Date();
  
  if (now > dueDate) {
    const hasPaid = incomeHistory.some(item => {
      if (item.name !== passengerName) return false;
      const paymentDate = new Date(item.date);
      return paymentDate > dueDate;
    });
    return !hasPaid;
  }
  return false;
}

function getDaysOverdue(passengerName) {
  const dueDate = getPassengerDueDate(passengerName);
  const now = new Date();
  const diffTime = now - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

function checkOverduePassengers() {
  const list = document.getElementById("overdueList");
  if (!list) return;
  
  const overdue = passengers.filter(p => isPassengerOverdue(p.name));
  const badge = document.getElementById("reminderBadge");
  
  if (overdue.length === 0) {
    list.innerHTML = '<div style="color:var(--text-muted);padding:12px;text-align:center;font-size:14px;">✅ No overdue passengers! Great job!</div>';
    if (badge) {
      badge.textContent = "0 overdue";
      badge.className = "badge";
    }
    return;
  }
  
  if (badge) {
    badge.textContent = overdue.length + " overdue";
    badge.className = "badge overdue-badge";
  }
  
  let html = '<div style="font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:8px;">⚠️ Overdue Passengers:</div>';
  overdue.forEach(passenger => {
    const days = getDaysOverdue(passenger.name);
    const paid = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paid);
    html += `
      <div class="overdue-item">
        <span class="overdue-name">${passenger.name}</span>
        <span class="overdue-days">${days} day${days > 1 ? 's' : ''} overdue</span>
        <span class="overdue-amount">R${outstanding.toFixed(2)}</span>
      </div>
    `;
  });
  
  list.innerHTML = html;
  
  if (overdue.length > 0) {
    showToast(`⚠️ ${overdue.length} passenger(s) are overdue!`, "warning");
  }
}

function sendReminders() {
  const overdue = passengers.filter(p => isPassengerOverdue(p.name));
  
  if (overdue.length === 0) {
    showToast("✅ No reminders needed! All passengers are up to date.", "success");
    return;
  }
  
  let message = `📢 REMINDER NOTIFICATIONS:\n\n`;
  overdue.forEach(passenger => {
    const days = getDaysOverdue(passenger.name);
    const paid = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paid);
    message += `• ${passenger.name}: R${outstanding.toFixed(2)} overdue (${days} days)\n`;
  });
  message += `\nPlease remind these passengers to make their payment.`;
  
  showToast(`📢 Reminders sent for ${overdue.length} passenger(s)`, "info");
  alert(message);
  checkOverduePassengers();
}

function checkOverdueOnLoad() {
  if (autoReminders !== "enabled") return;
  const overdue = passengers.filter(p => isPassengerOverdue(p.name));
  
  if (overdue.length > 0) {
    setTimeout(() => {
      showToast(`🔔 ${overdue.length} passenger(s) have overdue payments!`, "warning");
      if (Notification.permission === "granted") {
        new Notification("Route Ledger Reminder", {
          body: `${overdue.length} passenger(s) have overdue payments!`,
          icon: "📢"
        });
      }
    }, 2000);
  }
}

function saveReminderSettings() {
  const autoRemindersSelect = document.getElementById("autoReminders");
  const reminderDaysSelect = document.getElementById("reminderDays");
  const autoResetSelect = document.getElementById("autoReset");
  
  if (autoRemindersSelect) {
    autoReminders = autoRemindersSelect.value;
    localStorage.setItem("autoReminders", autoReminders);
  }
  
  if (reminderDaysSelect) {
    reminderDays = parseInt(reminderDaysSelect.value);
    localStorage.setItem("reminderDays", reminderDays);
  }
  
  if (autoResetSelect) {
    autoReset = autoResetSelect.value;
    localStorage.setItem("autoReset", autoReset);
  }
  
  showToast("Automation settings saved!", "success");
}

function loadReminderSettings() {
  const autoRemindersSelect = document.getElementById("autoReminders");
  const reminderDaysSelect = document.getElementById("reminderDays");
  const autoResetSelect = document.getElementById("autoReset");
  const defaultDueDaySelect = document.getElementById("defaultDueDay");
  
  if (autoRemindersSelect) autoRemindersSelect.value = autoReminders;
  if (reminderDaysSelect) reminderDaysSelect.value = reminderDays;
  if (autoResetSelect) autoResetSelect.value = autoReset;
  if (defaultDueDaySelect) defaultDueDaySelect.value = defaultDueDay;
}

function requestNotificationPermission() {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
}

const originalCheckMonthReset = checkMonthReset;

checkMonthReset = function() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  
  const displayEl = document.getElementById("currentMonthDisplay");
  if (displayEl) displayEl.textContent = monthNames[thisMonth] + " " + thisYear;
  
  if (currentMonth !== "" && currentYear !== "") {
    if (currentMonth != thisMonth || currentYear != thisYear) {
      console.log(`🔄 New month detected!`);
      
      if (autoReset === "enabled") {
        passengers.forEach(passenger => {
          passenger.status = "Waiting";
        });
        showToast(`📅 New month started! All passengers reset to Waiting.`, "warning");
      } else {
        showToast(`📅 New month detected! Auto-reset is disabled.`, "info");
      }
      
      currentMonth = thisMonth;
      currentYear = thisYear;
      localStorage.setItem("currentMonth", currentMonth);
      localStorage.setItem("currentYear", currentYear);
      
      saveData();
      updateUI();
      return true;
    }
  } else {
    currentMonth = thisMonth;
    currentYear = thisYear;
    localStorage.setItem("currentMonth", currentMonth);
    localStorage.setItem("currentYear", currentYear);
  }
  return false;
};

// ================================================================
// 23. CLOUD SYNC (Local)
// ================================================================

let lastSyncTime = localStorage.getItem("lastSyncTime") || null;
let syncCode = localStorage.getItem("syncCode") || "";

function generateSyncCode() {
  try {
    const data = {
      version: "2.0",
      timestamp: new Date().toISOString(),
      income: income,
      expenses: expenses,
      monthlyFee: monthlyFee,
      passengers: passengers,
      incomeHistory: incomeHistory,
      expenseHistory: expenseHistory,
      passengerNotes: passengerNotes || {},
      monthlyTarget: monthlyTarget || 15000,
      budgetLimit: budgetLimit || 8000,
      defaultDueDay: defaultDueDay || "15",
      autoReminders: autoReminders || "enabled",
      reminderDays: reminderDays || 3,
      autoReset: autoReset || "enabled"
    };
    
    const jsonString = JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(jsonString));
    
    if (encoded.length > 2000) {
      showToast("⚠️ Data is too large. Try exporting backup file instead.", "warning");
      return;
    }
    
    syncCode = encoded;
    localStorage.setItem("syncCode", syncCode);
    
    const display = document.getElementById("syncCodeDisplay");
    const codeEl = document.getElementById("syncCode");
    if (display && codeEl) {
      codeEl.textContent = syncCode;
      display.style.display = "block";
    }
    
    showToast("✅ Sync code generated! Copy it to import on another device.", "success");
    
  } catch (error) {
    showToast("❌ Error generating sync code: " + error.message, "error");
    console.error("Sync code error:", error);
  }
}

function importSyncData() {
  const code = prompt("📋 Enter your sync code:");
  if (!code) return;
  
  try {
    const jsonString = decodeURIComponent(atob(code));
    const data = JSON.parse(jsonString);
    
    if (!data.version || data.income === undefined) {
      showToast("❌ Invalid sync code. Please check and try again.", "error");
      return;
    }
    
    const confirmMsg = `⚠️ This will REPLACE all current data with synced data!\n\n` +
                       `Synced Data:\n` +
                       `• Income: R${data.income.toFixed(2)}\n` +
                       `• Expenses: R${data.expenses.toFixed(2)}\n` +
                       `• Passengers: ${data.passengers.length}\n` +
                       `• Transactions: ${(data.incomeHistory?.length || 0) + (data.expenseHistory?.length || 0)}\n\n` +
                       `Are you sure?`;
    
    if (!confirm(confirmMsg)) return;
    
    income = data.income || 0;
    expenses = data.expenses || 0;
    monthlyFee = data.monthlyFee || 1800;
    passengers = data.passengers || [];
    incomeHistory = data.incomeHistory || [];
    expenseHistory = data.expenseHistory || [];
    passengerNotes = data.passengerNotes || {};
    monthlyTarget = data.monthlyTarget || 15000;
    budgetLimit = data.budgetLimit || 8000;
    defaultDueDay = data.defaultDueDay || "15";
    autoReminders = data.autoReminders || "enabled";
    reminderDays = data.reminderDays || 3;
    autoReset = data.autoReset || "enabled";
    
    saveData();
    localStorage.setItem("passengerNotes", JSON.stringify(passengerNotes));
    localStorage.setItem("monthlyTarget", monthlyTarget);
    localStorage.setItem("budgetLimit", budgetLimit);
    localStorage.setItem("defaultDueDay", defaultDueDay);
    localStorage.setItem("autoReminders", autoReminders);
    localStorage.setItem("reminderDays", reminderDays);
    localStorage.setItem("autoReset", autoReset);
    
    updateUI();
    loadReminderSettings();
    
    showToast("✅ Data imported successfully from sync code!", "success");
    
  } catch (error) {
    showToast("❌ Error importing data: Invalid sync code", "error");
    console.error("Import error:", error);
  }
}

function copySyncCode() {
  const codeEl = document.getElementById("syncCode");
  if (!codeEl) return;
  
  const code = codeEl.textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast("📋 Sync code copied to clipboard!", "success");
  }).catch(() => {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast("📋 Sync code copied!", "success");
  });
}

function syncToCloud() {
  showToast("☁️ Syncing data...", "info");
  
  try {
    const syncData = {
      lastSync: new Date().toISOString(),
      data: {
        income,
        expenses,
        monthlyFee,
        passengers,
        incomeHistory,
        expenseHistory,
        passengerNotes,
        monthlyTarget,
        budgetLimit,
        defaultDueDay,
        autoReminders,
        reminderDays,
        autoReset
      }
    };
    
    localStorage.setItem("cloudSyncData", JSON.stringify(syncData));
    lastSyncTime = new Date().toISOString();
    localStorage.setItem("lastSyncTime", lastSyncTime);
    
    updateSyncStatus();
    
    showToast("✅ Data synced successfully! Last sync: " + new Date(lastSyncTime).toLocaleString(), "success");
    
  } catch (error) {
    showToast("❌ Sync failed: " + error.message, "error");
    console.error("Sync error:", error);
  }
}

function updateSyncStatus() {
  const statusEl = document.getElementById("syncStatus");
  const timeEl = document.getElementById("lastSyncTime");
  const sizeEl = document.getElementById("dataSize");
  
  if (statusEl) {
    if (lastSyncTime) {
      statusEl.textContent = "✅ Synced";
      statusEl.className = "badge";
      statusEl.style.color = "var(--color-green)";
    } else {
      statusEl.textContent = "⏳ Offline";
      statusEl.className = "badge";
      statusEl.style.color = "var(--text-muted)";
    }
  }
  
  if (timeEl) {
    timeEl.textContent = lastSyncTime ? new Date(lastSyncTime).toLocaleString() : "Never";
  }
  
  if (sizeEl) {
    const data = JSON.stringify({
      income, expenses, passengers, incomeHistory, expenseHistory
    });
    const size = (data.length / 1024).toFixed(1);
    sizeEl.textContent = size + " KB";
  }
}

function checkCloudBackup() {
  const cloudData = localStorage.getItem("cloudSyncData");
  if (!cloudData) return;
  
  try {
    const syncData = JSON.parse(cloudData);
    const lastSync = new Date(syncData.lastSync);
    const now = new Date();
    const hoursSince = (now - lastSync) / (1000 * 60 * 60);
    
    if (hoursSince < 24) {
      lastSyncTime = syncData.lastSync;
      localStorage.setItem("lastSyncTime", lastSyncTime);
      updateSyncStatus();
    }
  } catch (error) {
    console.log("Cloud backup check failed:", error);
  }
}

function generateQRCode() {
  generateSyncCode();
  
  const code = document.getElementById("syncCode");
  if (!code || !code.textContent) {
    showToast("Please generate a sync code first", "error");
    return;
  }
  
  const qrContainer = document.createElement("div");
  qrContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 30px;
    border-radius: var(--radius);
    z-index: 10000;
    box-shadow: var(--shadow-hover);
    text-align: center;
    max-width: 90%;
  `;
  
  qrContainer.innerHTML = `
    <h3 style="color:#0a0e17;margin-bottom:16px;">📱 Scan to Sync</h3>
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code.textContent)}" 
         alt="QR Code" 
         style="width:200px;height:200px;margin:0 auto;display:block;border-radius:8px;" />
    <p style="color:#64748b;font-size:13px;margin-top:12px;">Scan this QR code with your phone to sync data</p>
    <button onclick="this.parentElement.remove()" class="btn btn-primary" style="width:auto;padding:8px 24px;margin-top:12px;">
      <i class="fas fa-times"></i> Close
    </button>
  `;
  
  document.body.appendChild(qrContainer);
  
  qrContainer.addEventListener('click', (e) => {
    if (e.target === qrContainer) {
      qrContainer.remove();
    }
  });
}

function autoSyncOnClose() {
  const syncData = {
    lastSync: new Date().toISOString(),
    data: {
      income,
      expenses,
      monthlyFee,
      passengers,
      incomeHistory,
      expenseHistory,
      passengerNotes,
      monthlyTarget,
      budgetLimit,
      defaultDueDay,
      autoReminders,
      reminderDays,
      autoReset
    }
  };
  
  localStorage.setItem("cloudSyncData", JSON.stringify(syncData));
  localStorage.setItem("lastSyncTime", syncData.lastSync);
}

window.addEventListener('beforeunload', autoSyncOnClose);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    autoSyncOnClose();
  }
});

// ================================================================
// 24. DYNAMIC PERCENTAGE CHANGES
// ================================================================

function updatePercentageChanges() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let thisMonthIncome = 0;
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      thisMonthIncome += item.amount;
    }
  });
  
  let lastMonthIncome = 0;
  let lastMonth = currentMonth - 1;
  let lastMonthYear = currentYear;
  if (lastMonth < 0) {
    lastMonth = 11;
    lastMonthYear = currentYear - 1;
  }
  
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
      lastMonthIncome += item.amount;
    }
  });
  
  let incomeChange = 0;
  let incomeChangeText = '0%';
  let incomeChangeIcon = 'fa-minus';
  let incomeChangeClass = 'neutral';
  let incomeArrow = '→';
  
  if (lastMonthIncome > 0) {
    incomeChange = ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
    incomeChangeText = (incomeChange > 0 ? '+' : '') + incomeChange.toFixed(1) + '%';
    incomeChangeIcon = incomeChange > 0 ? 'fa-trend-up' : incomeChange < 0 ? 'fa-trend-down' : 'fa-minus';
    incomeChangeClass = incomeChange > 0 ? 'positive' : incomeChange < 0 ? 'negative' : 'neutral';
    incomeArrow = incomeChange > 0 ? '↑' : incomeChange < 0 ? '↓' : '→';
  } else if (thisMonthIncome > 0) {
    incomeChangeText = '+100%';
    incomeChangeIcon = 'fa-trend-up';
    incomeChangeClass = 'positive';
    incomeArrow = '↑';
  }
  
  let thisMonthExpenses = 0;
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      thisMonthExpenses += item.amount;
    }
  });
  
  let lastMonthExpenses = 0;
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
      lastMonthExpenses += item.amount;
    }
  });
  
  let expenseChange = 0;
  let expenseChangeText = '0%';
  let expenseChangeIcon = 'fa-minus';
  let expenseChangeClass = 'neutral';
  let expenseArrow = '→';
  
  if (lastMonthExpenses > 0) {
    expenseChange = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
    expenseChangeText = (expenseChange > 0 ? '+' : '') + expenseChange.toFixed(1) + '%';
    expenseChangeIcon = expenseChange > 0 ? 'fa-trend-up' : expenseChange < 0 ? 'fa-trend-down' : 'fa-minus';
    expenseChangeClass = expenseChange > 0 ? 'negative' : expenseChange < 0 ? 'positive' : 'neutral';
    expenseArrow = expenseChange > 0 ? '↑' : expenseChange < 0 ? '↓' : '→';
  } else if (thisMonthExpenses > 0) {
    expenseChangeText = '+100%';
    expenseChangeIcon = 'fa-trend-up';
    expenseChangeClass = 'negative';
    expenseArrow = '↑';
  }
  
  const incomePercentEl = document.getElementById('incomeChangePercent');
  const incomeTextEl = document.getElementById('incomePercentText');
  if (incomePercentEl && incomeTextEl) {
    incomePercentEl.className = 'stat-change ' + incomeChangeClass;
    const icon = incomePercentEl.querySelector('i');
    if (icon) {
      icon.className = 'fas ' + incomeChangeIcon;
    }
    incomeTextEl.textContent = incomeChangeText;
    incomePercentEl.title = `This Month: R${thisMonthIncome.toFixed(2)} | Last Month: R${lastMonthIncome.toFixed(2)} | ${incomeArrow} ${incomeChangeText}`;
  }
  
  const expensePercentEl = document.getElementById('expenseChangePercent');
  const expenseTextEl = document.getElementById('expensePercentText');
  if (expensePercentEl && expenseTextEl) {
    expensePercentEl.className = 'stat-change ' + expenseChangeClass;
    const icon = expensePercentEl.querySelector('i');
    if (icon) {
      icon.className = 'fas ' + expenseChangeIcon;
    }
    expenseTextEl.textContent = expenseChangeText;
    expensePercentEl.title = `This Month: R${thisMonthExpenses.toFixed(2)} | Last Month: R${lastMonthExpenses.toFixed(2)} | ${expenseArrow} ${expenseChangeText}`;
  }
  
  const incomeCard = document.querySelector('.stat-income');
  const expenseCard = document.querySelector('.stat-expense');
  
  if (incomeCard) {
    const changeEl = incomeCard.querySelector('.stat-change');
    if (changeEl) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = changeEl.querySelector('.change-label') || document.createElement('span');
      label.className = 'change-label';
      label.style.cssText = 'font-size:10px;color:var(--text-muted);display:block;margin-top:2px;';
      label.textContent = `vs ${monthNames[lastMonth]} ${lastMonthYear}`;
      if (!changeEl.querySelector('.change-label')) {
        changeEl.appendChild(label);
      }
    }
  }
  
  if (expenseCard) {
    const changeEl = expenseCard.querySelector('.stat-change');
    if (changeEl) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = changeEl.querySelector('.change-label') || document.createElement('span');
      label.className = 'change-label';
      label.style.cssText = 'font-size:10px;color:var(--text-muted);display:block;margin-top:2px;';
      label.textContent = `vs ${monthNames[lastMonth]} ${lastMonthYear}`;
      if (!changeEl.querySelector('.change-label')) {
        changeEl.appendChild(label);
      }
    }
  }
  
  console.log('📊 Income Change:', {
    thisMonth: thisMonthIncome,
    lastMonth: lastMonthIncome,
    change: incomeChangeText,
    class: incomeChangeClass
  });
  
  console.log('📊 Expense Change:', {
    thisMonth: thisMonthExpenses,
    lastMonth: lastMonthExpenses,
    change: expenseChangeText,
    class: expenseChangeClass
  });
}

// ================================================================
// 25. PWA INSTALL BANNER
// ================================================================

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  
  const banner = document.getElementById('installBanner');
  if (banner) {
    banner.className = 'show';
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
            hideInstallBanner();
          } else {
            console.log('❌ User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      }
    });
  }
});

function hideInstallBanner() {
  const banner = document.getElementById('installBanner');
  if (banner) {
    banner.className = '';
    localStorage.setItem('hideInstallBanner', 'true');
  }
}

window.addEventListener('load', function() {
  if (localStorage.getItem('hideInstallBanner') === 'true') {
    const banner = document.getElementById('installBanner');
    if (banner) banner.className = '';
  }
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    const banner = document.getElementById('installBanner');
    if (banner) banner.className = '';
    console.log('📱 App is running in standalone mode (installed)');
  }
});

window.addEventListener('appinstalled', function() {
  console.log('🎉 App installed successfully!');
  hideInstallBanner();
  showToast('🎉 Route Ledger installed successfully!', 'success');
});

function syncNow() {
  forceSync();
}

// ================================================================
// SIDEBAR TOGGLE FUNCTIONS
// ================================================================

function toggleSidebar() {
  const sidebar = document.getElementById('mainSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburgerBtn');
  
  if (!sidebar || !overlay || !hamburger) return;
  
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  
  const icon = hamburger.querySelector('i');
  if (sidebar.classList.contains('open')) {
    icon.className = 'fas fa-times';
  } else {
    icon.className = 'fas fa-bars';
  }
}

function closeSidebar() {
  const sidebar = document.getElementById('mainSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburgerBtn');
  
  if (!sidebar || !overlay || !hamburger) return;
  
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  
  const icon = hamburger.querySelector('i');
  icon.className = 'fas fa-bars';
}

// Close sidebar when pressing Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeSidebar();
  }
});

// Close sidebar on window resize to desktop
window.addEventListener('resize', function() {
  if (window.innerWidth >= 768) {
    closeSidebar();
  }
});

// ================================================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE (for HTML onclick attributes)
// ================================================================

window.showTab = showTab;
window.goToHistory = goToHistory;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.exportBackup = exportBackup;
window.addPassenger = addPassenger;
window.deletePassenger = deletePassenger;
window.resetPassengerStatuses = resetPassengerStatuses;
window.forceNewMonth = forceNewMonth;
window.selectAllPassengers = selectAllPassengers;
window.deselectAllPassengers = deselectAllPassengers;
window.markSelectedPaid = markSelectedPaid;
window.exportPassengerData = exportPassengerData;
window.checkOverduePassengers = checkOverduePassengers;
window.sendReminders = sendReminders;
window.saveDefaultDueDay = saveDefaultDueDay;
window.saveMonthlyFee = saveMonthlyFee;
window.saveMonthlyTarget = saveMonthlyTarget;
window.saveBudget = saveBudget;
window.saveFinanceSettings = saveFinanceSettings;
window.saveReminderSettings = saveReminderSettings;
window.generatePDF = generatePDF;
window.printReport = printReport;
window.exportFullData = exportFullData;
window.importBackup = importBackup;
window.clearDemoData = clearDemoData;
window.generateSyncCode = generateSyncCode;
window.importSyncData = importSyncData;
window.copySyncCode = copySyncCode;
window.syncToCloud = syncToCloud;
window.generateQRCode = generateQRCode;
window.syncNow = syncNow;
window.openPassengerModal = openPassengerModal;
window.closePassengerModal = closePassengerModal;
window.markPassengerPaid = markPassengerPaid;
window.savePassengerNote = savePassengerNote;
window.togglePassengerSelection = togglePassengerSelection;
window.addIncome = addIncome;
window.addExpense = addExpense;
window.toggleIncomeFields = toggleIncomeFields;
window.toggleExpenseField = toggleExpenseField;

// ================================================================
// START THE APP
// ================================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
