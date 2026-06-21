/* ================================================================
   FIREBASE CONFIG - Route Ledger Pro (Shared Sync)
   ================================================================ */

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, set, update, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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
console.log("🔥 Firebase initialized!");

// ================================================================
// FIXED USER ID - ALL DEVICES SHARE THIS!
// ================================================================

// Change this to ANY unique string - this is your shared user ID
// All devices using this same ID will share the same data!
const FIXED_USER_ID = "route-ledger-master-2026";

console.log("📌 Using fixed User ID:", FIXED_USER_ID);

let currentUserId = FIXED_USER_ID;
let isSyncing = false;
let syncEnabled = true;

// ================================================================
// SYNC FUNCTIONS
// ================================================================

function initSync() {
  console.log("☁️ Initializing Firebase sync with FIXED USER ID...");
  console.log("📌 User ID:", currentUserId);
  
  // Update UI
  updateSyncStatusUI(true);
  
  // Load data from cloud
  loadDataFromCloud();
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
  
  // Check which data is newer
  if (localTime > cloudTime && localStorage.getItem("income") !== null && parseFloat(localStorage.getItem("income")) > 0) {
    console.log("📱 Local data is newer, uploading...");
    uploadToCloud();
    return;
  }
  
  console.log("☁️ Merging cloud data...");
  
  // Merge all data
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
  
  // Reload UI
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
// EXPORT FUNCTIONS
// ================================================================

export { 
  initSync, 
  autoSync, 
  uploadToCloud, 
  forceSync,
  updateSyncStatusUI,
  currentUserId,
  syncEnabled
};
