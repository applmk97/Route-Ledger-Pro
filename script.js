/* ================================================================
   ===== SCRIPT.JS - ROUTE LEDGER PRO =====
   ================================================================ */

/* ================================================================
   1. DATA STATE
   ================================================================ */

// ---- Financial Data ----
let income = localStorage.getItem("income") ? parseFloat(localStorage.getItem("income")) : 0;
let expenses = localStorage.getItem("expenses") ? parseFloat(localStorage.getItem("expenses")) : 0;

// ---- History ----
let incomeHistory = JSON.parse(localStorage.getItem("incomeHistory")) || [];
let expenseHistory = JSON.parse(localStorage.getItem("expenseHistory")) || [];

// ---- Passengers ----
let passengers = JSON.parse(localStorage.getItem("passengers")) || [];

// Fix passenger data structure (backward compatibility)
passengers = passengers.map(passenger => {
  if (typeof passenger === "string") {
    return { name: passenger, status: "Waiting" };
  }
  return passenger;
});

// ---- Settings ----
let monthlyFee = localStorage.getItem("monthlyFee") ? parseFloat(localStorage.getItem("monthlyFee")) : 1800;

// ---- Month Tracking ----
let currentMonth = localStorage.getItem("currentMonth") || "";
let currentYear = localStorage.getItem("currentYear") || "";

/* ================================================================
   2. MONTH TRACKING & AUTO-RESET
   ================================================================ */

/**
 * Check if a new month has started and reset passengers if needed
 * This runs automatically when the app loads
 */
function checkMonthReset() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  
  // Update month display in dashboard
  const displayEl = document.getElementById("currentMonthDisplay");
  if (displayEl) displayEl.textContent = monthNames[thisMonth] + " " + thisYear;
  
  // Check if we have a saved month
  if (currentMonth !== "" && currentYear !== "") {
    // If month/year changed, reset all passengers
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
    // First time running - save current month/year
    currentMonth = thisMonth;
    currentYear = thisYear;
    localStorage.setItem("currentMonth", currentMonth);
    localStorage.setItem("currentYear", currentYear);
  }
  return false;
}

/**
 * Manually force a new month reset
 */
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

/* ================================================================
   3. DATA PERSISTENCE
   ================================================================ */

/**
 * Save all data to localStorage
 */
function saveData() {
  localStorage.setItem("income", income);
  localStorage.setItem("expenses", expenses);
  localStorage.setItem("incomeHistory", JSON.stringify(incomeHistory));
  localStorage.setItem("expenseHistory", JSON.stringify(expenseHistory));
  localStorage.setItem("passengers", JSON.stringify(passengers));
  localStorage.setItem("monthlyFee", monthlyFee);
  localStorage.setItem("currentMonth", currentMonth);
  localStorage.setItem("currentYear", currentYear);
}

/* ================================================================
   4. TOAST NOTIFICATIONS
   ================================================================ */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'success', 'error', 'info', 'warning'
 */
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
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ================================================================
   5. SETTINGS
   ================================================================ */

/**
 * Save the monthly fee setting
 */
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

/* ================================================================
   6. RENDER FUNCTIONS
   ================================================================ */

/* ---- 6.1 History ---- */

/**
 * Render income and expense history
 */
function renderHistory() {
  const incomeList = document.getElementById("incomeHistory");
  const expenseList = document.getElementById("expenseHistory");
  const incomeCount = document.getElementById("incomeCount");
  const expenseCount = document.getElementById("expenseCount");

  // Render Income History
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

  // Render Expense History
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

/* ---- 6.2 Passengers ---- */

/**
 * Render the passenger list and statistics
 */
function renderPassengers() {
  const list = document.getElementById("passengerList");
  if (!list) return;
  list.innerHTML = "";

  if (passengers.length === 0) {
    list.innerHTML = '<li style="text-align:center;color:#64748b;padding:20px;">No passengers added yet</li>';
    updatePassengerStats(0, 0, 0, 0);
    return;
  }

  let paid = 0, partial = 0, waiting = 0;

  passengers.forEach((passenger, index) => {
    const paidAmount = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paidAmount);

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
    li.innerHTML = `
      <strong>${icon} ${passenger.name}</strong>
      <div class="passenger-detail">Monthly Fee: <span>R${monthlyFee}</span></div>
      <div class="passenger-detail">Paid: <span>R${paidAmount.toFixed(2)}</span></div>
      <div class="passenger-detail">Outstanding: <span>R${outstanding.toFixed(2)}</span></div>
      <div class="passenger-detail">Status: <span style="color:${statusColor};font-weight:600;">${status}</span></div>
      <button onclick="deletePassenger(${index})">Remove Passenger</button>
    `;
    list.appendChild(li);
  });

  updatePassengerStats(passengers.length, paid, partial, waiting);
}

/**
 * Update passenger statistics in the UI
 */
function updatePassengerStats(total, paid, partial, waiting) {
  document.getElementById("totalPassengers").textContent = total;
  document.getElementById("paidCount").textContent = paid;
  document.getElementById("partialCount").textContent = partial;
  document.getElementById("waitingCount").textContent = waiting;
}

/**
 * Render the passenger dropdown for income selection
 */
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

/* ---- 6.3 Dashboard Stats ---- */

/**
 * Update dashboard statistics
 */
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

/* ---- 6.4 Reports ---- */

/**
 * Update the reports tab with financial summaries
 */
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

/* ---- 6.5 Main UI Update ---- */

/**
 * Update all UI elements
 */
function updateUI() {
  // Update primary stats
  document.getElementById("income").innerText = "R" + income.toFixed(2);
  document.getElementById("expenses").innerText = "R" + expenses.toFixed(2);
  document.getElementById("balance").innerText = "R" + (income - expenses).toFixed(2);
  
  // Update all sections
  renderHistory();
  renderPassengers();
  renderPassengerDropdown();
  updateDashboardStats();
  updateReports();
  // Update charts
  initCharts();
  // Update smart finance
  updateSmartFinance();
  // Update advanced analytics
  updateAdvancedAnalytics();
  // Update report summary
  updateReportSummary();
  // Update percentage changes
  updatePercentageChanges();

  // Update fee input
  const feeInput = document.getElementById("monthlyFee");
  if (feeInput) feeInput.value = monthlyFee;
}

/* ================================================================
   7. PASSENGER OPERATIONS
   ================================================================ */

/**
 * Add a new passenger
 */
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

/**
 * Delete a passenger
 */
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

/**
 * Reset all passengers to "Waiting" status
 */
function resetPassengerStatuses() {
  if (confirm("Start a new month and reset all passengers to Waiting?")) {
    passengers.forEach(passenger => { passenger.status = "Waiting"; });
    saveData();
    renderPassengers();
    showToast("Month reset successfully!", "success");
  }
}

/**
 * Get total amount paid by a passenger this month
 */
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

/* ================================================================
   8. FINANCIAL OPERATIONS
   ================================================================ */

/**
 * Add income entry
 */
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

    // Update passenger status if it's a passenger payment
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

/**
 * Add expense entry
 */
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

/* ================================================================
   9. UI HELPERS
   ================================================================ */

/**
 * Toggle income fields based on source selection
 */
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

/**
 * Toggle expense description field for "Other" category
 */
function toggleExpenseField() {
  const category = document.getElementById("expenseCategory");
  const descriptionGroup = document.getElementById("expenseDescriptionGroup");
  
  if (!category || !descriptionGroup) return;
  descriptionGroup.style.display = category.value === "Other" ? "block" : "none";
}

/* ================================================================
   10. TAB NAVIGATION
   ================================================================ */

/**
 * Switch between tabs
 * @param {string} tabId - The ID of the tab to show
 */
function showTab(tabId) {
  // Hide all tabs
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => tab.classList.remove("active-tab"));
  
  // Remove active class from all nav items
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => item.classList.remove("active"));
  
  // Show selected tab
  const selectedTab = document.getElementById(tabId);
  if (selectedTab) selectedTab.classList.add("active-tab");
  
  // Highlight selected nav item
  const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (activeNav) activeNav.classList.add("active");
}

/* ================================================================
   11. DATA MANAGEMENT
   ================================================================ */

/**
 * Clear all demo data (keeps passengers and settings)
 */
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

/**
 * Export all data as a JSON backup file
 */
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

/**
 * Import data from a JSON backup file
 */
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

/* ================================================================
   12. APP INITIALIZATION
   ================================================================ */

/**
 * Initialize the app
 */
function initApp() {
  console.log("🚀 Route Ledger Pro initializing...");
  
  // Check for month change
  checkMonthReset();
  
  // Setup UI
  showTab("dashboard");
  updateUI();
  toggleIncomeFields();
  toggleExpenseField();
  // Load saved theme
  loadTheme();
  // Load reminder settings
  loadReminderSettings();


  // Update sync status
  updateSyncStatus();
  
  // Check for cloud backup
  checkCloudBackup();
  
  // Auto-sync periodically (every 5 minutes)
  setInterval(() => {
    if (navigator.onLine) {
      autoSyncOnClose();
      updateSyncStatus();
    }
  }, 300000); // 5 minutes
  
  // Check for overdue passengers
  setTimeout(() => {
    checkOverdueOnLoad();
  }, 3000);
  
  // Request notification permission
  requestNotificationPermission();
  
  // Check overdue on the dashboard tab
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
  console.log("📊 Data loaded:", { 
  income, 
  expenses, 
  passengers: passengers.length, 
  monthlyFee,
  monthlyTarget,
  budgetLimit,
  totalEntries: incomeHistory.length + expenseHistory.length
});
}

/* ================================================================
   13. CHARTS
   ================================================================ */

let incomeExpenseChart = null;
let incomeBreakdownChart = null;

/**
 * Initialize charts
 */
function initCharts() {
  // Check if chart containers exist
  const incomeExpenseCanvas = document.getElementById('incomeExpenseChart');
  const incomeBreakdownCanvas = document.getElementById('incomeBreakdownChart');
  
  if (!incomeExpenseCanvas || !incomeBreakdownCanvas) return;
  
  // Destroy existing charts if they exist
  if (incomeExpenseChart) incomeExpenseChart.destroy();
  if (incomeBreakdownChart) incomeBreakdownChart.destroy();
  
  // Get last 6 months of data
  const months = getLast6Months();
  const incomeData = getMonthlyIncome(months);
  const expenseData = getMonthlyExpenses(months);
  
  // Income vs Expenses Chart
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
  
  // Income Breakdown Chart (Passenger, Delivery, Other)
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

/**
 * Get last 6 months names
 */
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

/**
 * Get monthly income for last 6 months
 */
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

/**
 * Get monthly expenses for last 6 months
 */
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

/* ================================================================
   14. THEME TOGGLE
   ================================================================ */

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update icon
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (newTheme === 'dark') {
      icon.className = 'fas fa-sun';
    } else {
      icon.className = 'fas fa-moon';
    }
  }
  
  // Re-render charts with new colors if needed
  if (typeof initCharts === 'function') {
    setTimeout(initCharts, 100);
  }
}

/**
 * Load saved theme on startup
 */
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

/**
 * Get income breakdown by source
 */
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

/* ================================================================
   15. SMART FINANCE
   ================================================================ */

// ---- Finance Data ----
let monthlyTarget = localStorage.getItem("monthlyTarget") ? parseFloat(localStorage.getItem("monthlyTarget")) : 15000;
let budgetLimit = localStorage.getItem("budgetLimit") ? parseFloat(localStorage.getItem("budgetLimit")) : 8000;

/* ---- 15.1 Save Functions ---- */

/**
 * Save monthly income target
 */
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

/**
 * Save expense budget
 */
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

/**
 * Save finance settings from Settings tab
 */
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

/* ---- 15.2 Update Functions ---- */

/**
 * Update smart finance UI
 */
function updateSmartFinance() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // --- Calculate Monthly Totals ---
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
  
  // --- Profit & Margin ---
  const netProfit = monthlyIncome - monthlyExpenses;
  const profitMargin = monthlyIncome > 0 ? (netProfit / monthlyIncome) * 100 : 0;
  
  document.getElementById("netProfit").innerText = "R" + netProfit.toFixed(2);
  document.getElementById("profitMargin").innerText = profitMargin.toFixed(1) + "%";
  
  // --- Break-Even Analysis ---
  // Break-even is when income = expenses
  const breakEven = monthlyExpenses; // You need at least this much income to break even
  document.getElementById("breakEven").innerText = "R" + breakEven.toFixed(2);
  
  // --- Daily Average ---
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysPassed = Math.min(now.getDate(), daysInMonth);
  const dailyAverage = daysPassed > 0 ? monthlyIncome / daysPassed : 0;
  document.getElementById("dailyAverage").innerText = "R" + dailyAverage.toFixed(2);
  
  // --- Monthly Target Progress ---
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
  
  // --- Budget Progress ---
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
  
  // --- Budget Alert ---
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
  
  // --- Update settings inputs ---
  const settingsTarget = document.getElementById("settingsMonthlyTarget");
  const settingsBudget = document.getElementById("settingsBudget");
  if (settingsTarget) settingsTarget.value = monthlyTarget;
  if (settingsBudget) settingsBudget.value = budgetLimit;
  
  // --- Show target celebration if achieved ---
  if (targetProgress >= 100 && !localStorage.getItem("targetAchieved_" + currentMonth + "_" + currentYear)) {
    localStorage.setItem("targetAchieved_" + currentMonth + "_" + currentYear, "true");
    showToast("🎉 CONGRATULATIONS! You've achieved your monthly target of R" + monthlyTarget.toFixed(0) + "!", "success");
    // Add confetti effect later
  }
}

/* ================================================================
   16. PASSENGER POWER
   ================================================================ */

// ---- State for selected passengers ----
let selectedPassengers = new Set();
let currentModalPassenger = null;

/* ---- 16.1 Render Passengers with Checkboxes ---- */

/**
 * Override renderPassengers with enhanced version
 */
function renderPassengers() {
  const list = document.getElementById("passengerList");
  if (!list) return;
  list.innerHTML = "";

  if (passengers.length === 0) {
    list.innerHTML = '<li style="text-align:center;color:#64748b;padding:20px;">No passengers added yet</li>';
    updatePassengerStats(0, 0, 0, 0);
    updatePassengerRanking();
    return;
  }

  let paid = 0, partial = 0, waiting = 0;

  passengers.forEach((passenger, index) => {
    const paidAmount = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paidAmount);
    const isSelected = selectedPassengers.has(index);

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
    li.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <input type="checkbox" class="passenger-checkbox" 
               ${isSelected ? 'checked' : ''} 
               onchange="togglePassengerSelection(${index})" />
        <div style="flex:1;cursor:pointer;" onclick="openPassengerModal(${index})">
          <strong>${icon} ${passenger.name}</strong>
          <div class="passenger-detail">Monthly Fee: <span>R${monthlyFee}</span></div>
          <div class="passenger-detail">Paid: <span>R${paidAmount.toFixed(2)}</span></div>
          <div class="passenger-detail">Outstanding: <span>R${outstanding.toFixed(2)}</span></div>
          <div class="passenger-detail">Status: <span style="color:${statusColor};font-weight:600;">${status}</span></div>
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
}

/* ---- 16.2 Passenger Selection ---- */

/**
 * Toggle passenger selection
 */
function togglePassengerSelection(index) {
  if (selectedPassengers.has(index)) {
    selectedPassengers.delete(index);
  } else {
    selectedPassengers.add(index);
  }
  updateSelectedCount();
}

/**
 * Select all passengers
 */
function selectAllPassengers() {
  passengers.forEach((_, index) => {
    selectedPassengers.add(index);
  });
  renderPassengers();
  showToast(`Selected ${passengers.length} passengers`, "info");
}

/**
 * Deselect all passengers
 */
function deselectAllPassengers() {
  selectedPassengers.clear();
  renderPassengers();
  showToast("All passengers deselected", "info");
}

/**
 * Update selected count display
 */
function updateSelectedCount() {
  const el = document.getElementById("selectedCount");
  if (el) {
    el.textContent = `${selectedPassengers.size} selected`;
  }
}

/* ---- 16.3 Batch Actions ---- */

/**
 * Mark selected passengers as paid
 */
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
      
      // Only mark if not already fully paid
      if (paidAmount < monthlyFee) {
        // Add the remaining amount as income
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

/* ---- 16.4 Passenger Modal ---- */

/**
 * Open passenger detail modal
 */
function openPassengerModal(index) {
  if (index < 0 || index >= passengers.length) return;
  
  const passenger = passengers[index];
  currentModalPassenger = index;
  const paidAmount = getPassengerPaidThisMonth(passenger.name);
  const outstanding = Math.max(0, monthlyFee - paidAmount);
  
  // Set modal title
  document.getElementById("modalPassengerName").textContent = passenger.name;
  
  // Set stats
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
  document.getElementById("modalStatus").textContent = status;
  document.getElementById("modalStatus").style.color = statusColor;
  
  // Render payment history
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
  
  // Show modal
  document.getElementById("passengerModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Close passenger modal
 */
function closePassengerModal() {
  document.getElementById("passengerModal").classList.remove("active");
  document.body.style.overflow = "";
  currentModalPassenger = null;
}

/**
 * Mark passenger as paid from modal
 */
function markPassengerPaid() {
  if (currentModalPassenger === null) return;
  
  const passenger = passengers[currentModalPassenger];
  const paidAmount = getPassengerPaidThisMonth(passenger.name);
  const remaining = Math.max(0, monthlyFee - paidAmount);
  
  if (remaining <= 0) {
    showToast("This passenger is already fully paid!", "info");
    return;
  }
  
  // Add payment
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

/* ---- 16.5 Passenger Ranking ---- */

/**
 * Update passenger ranking
 */
function updatePassengerRanking() {
  const list = document.getElementById("passengerRanking");
  if (!list) return;
  
  if (passengers.length === 0) {
    list.innerHTML = '<li style="color:var(--text-muted);text-align:center;padding:20px;">Add passengers to see ranking</li>';
    return;
  }
  
  // Calculate total paid per passenger
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

/* ---- 16.6 Export Passenger Data ---- */

/**
 * Export passenger data as CSV
 */
function exportPassengerData() {
  if (passengers.length === 0) {
    showToast("No passengers to export", "error");
    return;
  }
  
  // Create CSV headers
  let csv = "Passenger,Monthly Fee,Paid This Month,Outstanding,Status\n";
  
  passengers.forEach(passenger => {
    const paid = getPassengerPaidThisMonth(passenger.name);
    const outstanding = Math.max(0, monthlyFee - paid);
    let status = "Waiting";
    if (paid >= monthlyFee) status = "Paid";
    else if (paid > 0) status = "Partial";
    
    csv += `${passenger.name},${monthlyFee},${paid.toFixed(2)},${outstanding.toFixed(2)},${status}\n`;
  });
  
  // Add summary
  const totalExpected = passengers.length * monthlyFee;
  const totalCollected = passengers.reduce((sum, p) => sum + getPassengerPaidThisMonth(p.name), 0);
  csv += `\nTOTAL,,${totalCollected.toFixed(2)},${(totalExpected - totalCollected).toFixed(2)},`;
  
  // Download CSV
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

// ---- Override updatePassengerStats to include ranking ----
function updatePassengerStats(total, paid, partial, waiting) {
  document.getElementById("totalPassengers").textContent = total;
  document.getElementById("paidCount").textContent = paid;
  document.getElementById("partialCount").textContent = partial;
  document.getElementById("waitingCount").textContent = waiting;
  
  // Update ranking
  updatePassengerRanking();
}

/* ================================================================
   17. ADVANCED ANALYTICS
   ================================================================ */

let expenseBreakdownChart = null;

/* ---- 17.1 Update Analytics ---- */

/**
 * Update all advanced analytics
 */
function updateAdvancedAnalytics() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // --- Month vs Last Month Comparison ---
  updateMonthComparison(currentMonth, currentYear, monthNames);
  
  // --- Year-to-Date ---
  updateYearToDate(currentYear);
  
  // --- Expense Breakdown Chart ---
  updateExpenseBreakdownChart();
  
  // --- Best & Worst Months ---
  updateBestWorstMonths();
  
  // --- Monthly Trends Table ---
  updateTrendsTable(currentMonth, currentYear, monthNames);
  
  // --- Growth Rate ---
  updateGrowthRate(currentMonth, currentYear);
  
  // --- Average Monthly Income ---
  updateAverageMonthlyIncome();
}

/* ---- 17.2 Month Comparison ---- */

function updateMonthComparison(currentMonth, currentYear, monthNames) {
  // Get this month's income
  let thisMonthIncome = 0;
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      thisMonthIncome += item.amount;
    }
  });
  
  // Get last month's income
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
  
  // Calculate change
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

/* ---- 17.3 Year-to-Date ---- */

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

/* ---- 17.4 Expense Breakdown Chart ---- */

function updateExpenseBreakdownChart() {
  const canvas = document.getElementById('expenseBreakdownChart');
  if (!canvas) return;
  
  // Calculate expenses by category
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
  
  // Sort categories by amount
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const labels = sortedCategories.map(c => c[0]);
  const data = sortedCategories.map(c => c[1]);
  const colors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
    '#ef4444', '#06b6d4', '#ec4899', '#f97316'
  ];
  
  // Destroy existing chart
  if (expenseBreakdownChart) {
    expenseBreakdownChart.destroy();
  }
  
  // Create new chart
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
  
  // Update legend
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

/* ---- 17.5 Best & Worst Months ---- */

function updateBestWorstMonths() {
  // Group income by month
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
  
  // Sort by amount
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

/* ---- 17.6 Trends Table ---- */

function updateTrendsTable(currentMonth, currentYear, monthNames) {
  const tbody = document.getElementById('trendsBody');
  if (!tbody) return;
  
  // Get last 6 months data
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

/* ---- 17.7 Growth Rate ---- */

function updateGrowthRate(currentMonth, currentYear) {
  // Get last 3 months vs previous 3 months
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

/* ---- 17.8 Average Monthly Income ---- */

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

/* ================================================================
   18. REPORTS & EXPORT
   ================================================================ */

/* ---- 18.1 PDF Report Generation ---- */

/**
 * Generate a COMPLETE professional PDF report with ALL details
 */
function generatePDF() {
  showToast("📄 Generating full report...", "info");
  
  // Get selected month
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
  
  // Get FULL data for selected month
  const data = getFullMonthData(month, year);
  
  // Create report content
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
  
  // Build the FULL report HTML
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
  
  // Build the complete report
  reportContent.innerHTML = `
    <!-- HEADER -->
    <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #10b981;padding-bottom:20px;">
      <h1 style="font-size:32px;color:#0a0e17;margin:0;">🚀 Route Ledger</h1>
      <p style="font-size:18px;color:#475569;margin:5px 0 0;">Business Finance Report</p>
      <p style="font-size:15px;color:#94a3b8;margin:5px 0 0;">${monthNames[month]} ${year}</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:8px;">Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <!-- SUMMARY CARDS -->
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
    
    <!-- DETAILED STATS -->
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
    
    <!-- INCOME DETAILS TABLE -->
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
    
    <!-- EXPENSE DETAILS TABLE -->
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
    
    <!-- PASSENGER SUMMARY TABLE -->
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
    
    <!-- FOOTER -->
    <div style="text-align:center;padding-top:20px;border-top:2px solid #e2e8f0;font-size:12px;color:#94a3b8;">
      <p>Report generated from Route Ledger Pro</p>
      <p style="margin-top:4px;">${new Date().toLocaleString()}</p>
    </div>
  `;
  
  // Add to body temporarily
  document.body.appendChild(reportContent);
  
  // Use html2canvas to capture the report
  html2canvas(reportContent, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    width: reportContent.scrollWidth,
    height: reportContent.scrollHeight,
    windowHeight: reportContent.scrollHeight
  }).then(canvas => {
    // Remove the temporary element
    document.body.removeChild(reportContent);
    
    // Create PDF with multiple pages if needed
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const maxPageHeight = pdf.internal.pageSize.getHeight();
    
    let heightLeft = pdfHeight;
    let position = 0;
    
    // First page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= maxPageHeight;
    
    // Additional pages if needed
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

/* ---- 20.1 Get FULL Month Data ---- */

/**
 * Get COMPLETE data for a specific month
 */
function getFullMonthData(month, year) {
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Income Details
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
  
  // Expense Details
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
  
  // Passenger Details
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
  
  // Sort by amount paid (highest first)
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

/* ---- 18.2 Print Report ---- */

/**
 * Print the dashboard as a report
 */
function printReport() {
  showToast("🖨️ Preparing print...", "info");
  
  // Set month display for print
  const monthInput = document.getElementById('pdfReportMonth');
  if (monthInput && monthInput.value) {
    const parts = monthInput.value.split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('reportMonthDisplay').textContent = monthNames[date.getMonth()] + ' ' + date.getFullYear();
  }
  
  // Trigger print
  setTimeout(() => {
    window.print();
  }, 500);
}

/* ---- 18.3 Export Full Data to CSV ---- */

/**
 * Export all data to CSV
 */
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
  
  // Download CSV
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

/* ---- 18.4 Get Month Data Helper ---- */

/**
 * Get data for a specific month
 */
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

/* ---- 18.5 Update Report Summary ---- */

/**
 * Update the report summary on the reports tab
 */
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
  
  // Calculate daily average
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysPassed = Math.min(now.getDate(), daysInMonth);
  const dailyAvg = daysPassed > 0 ? data.income / daysPassed : 0;
  document.getElementById('reportSummaryDaily').textContent = 'R' + dailyAvg.toFixed(2);
  
  // Set month display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('reportMonthDisplay').textContent = monthNames[month] + ' ' + year;
  
  // Set default month picker to current month
  const monthInput = document.getElementById('pdfReportMonth');
  if (monthInput) {
    const value = year + '-' + String(month + 1).padStart(2, '0');
    monthInput.value = value;
  }
}

/* ================================================================
   19. CLICKABLE STATS
   ================================================================ */

/**
 * Navigate to history tab with filter
 * @param {string} type - 'income' or 'expense'
 */
function goToHistory(type) {
  // Switch to history tab
  showTab('history');
  
  // Highlight the appropriate history section
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

/* ================================================================
   21. REMINDERS & AUTOMATION
   ================================================================ */

// ---- Reminder State ----
let defaultDueDay = localStorage.getItem("defaultDueDay") || "15";
let autoReminders = localStorage.getItem("autoReminders") || "enabled";
let reminderDays = parseInt(localStorage.getItem("reminderDays")) || 3;
let autoReset = localStorage.getItem("autoReset") || "enabled";

// ---- Passenger Notes ----
let passengerNotes = JSON.parse(localStorage.getItem("passengerNotes")) || {};

/* ---- 21.1 Due Day Management ---- */

/**
 * Save default due day
 */
function saveDefaultDueDay() {
  const select = document.getElementById("defaultDueDay");
  if (!select) return;
  defaultDueDay = select.value;
  localStorage.setItem("defaultDueDay", defaultDueDay);
  showToast("Default due day saved: " + getDueDayDisplay(defaultDueDay), "success");
}

/**
 * Get display name for due day
 */
function getDueDayDisplay(value) {
  if (value === "last") return "Last Day";
  return value + (value === "1" ? "st" : value === "2" ? "nd" : value === "3" ? "rd" : "th");
}

/**
 * Get due date for a passenger this month
 */
function getPassengerDueDate(passengerName) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  let day = parseInt(defaultDueDay);
  if (defaultDueDay === "last") {
    day = new Date(year, month + 1, 0).getDate();
  }
  
  // If due day has passed this month, it's next month
  let dueDate = new Date(year, month, day);
  if (dueDate < now) {
    dueDate = new Date(year, month + 1, day);
  }
  
  return dueDate;
}

/**
 * Check if a passenger is overdue
 */
function isPassengerOverdue(passengerName) {
  const paidAmount = getPassengerPaidThisMonth(passengerName);
  if (paidAmount >= monthlyFee) return false;
  
  const dueDate = getPassengerDueDate(passengerName);
  const now = new Date();
  
  // Check if due date has passed
  if (now > dueDate) {
    // Check if they've paid anything after due date
    const hasPaid = incomeHistory.some(item => {
      if (item.name !== passengerName) return false;
      const paymentDate = new Date(item.date);
      return paymentDate > dueDate;
    });
    return !hasPaid;
  }
  return false;
}

/**
 * Get days overdue for a passenger
 */
function getDaysOverdue(passengerName) {
  const dueDate = getPassengerDueDate(passengerName);
  const now = new Date();
  const diffTime = now - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/* ---- 21.2 Overdue Management ---- */

/**
 * Check and display overdue passengers
 */
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

/**
 * Send reminder notifications
 */
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
  
  // Show as toast notification
  showToast(`📢 Reminders sent for ${overdue.length} passenger(s)`, "info");
  
  // Also show in a modal-style alert
  alert(message);
  
  // Update badge
  checkOverduePassengers();
}

/**
 * Check overdue status on app load
 */
function checkOverdueOnLoad() {
  if (autoReminders !== "enabled") return;
  const overdue = passengers.filter(p => isPassengerOverdue(p.name));
  
  if (overdue.length > 0) {
    // Show a gentle reminder toast
    setTimeout(() => {
      showToast(`🔔 ${overdue.length} passenger(s) have overdue payments!`, "warning");
      // Show in notification center
      if (Notification.permission === "granted") {
        new Notification("Route Ledger Reminder", {
          body: `${overdue.length} passenger(s) have overdue payments!`,
          icon: "📢"
        });
      }
    }, 2000);
  }
}

/* ---- 21.3 Passenger Notes ---- */

/**
 * Enhanced renderPassengers with notes
 * Override the existing renderPassengers function
 */
function renderPassengersWithNotes() {
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

// Override renderPassengers with the enhanced version
renderPassengers = renderPassengersWithNotes;

/* ---- 21.4 Enhanced Passenger Modal with Notes ---- */

// Override openPassengerModal with note support
const originalOpenModal = openPassengerModal;
openPassengerModal = function(index) {
  if (index < 0 || index >= passengers.length) return;
  
  const passenger = passengers[index];
  currentModalPassenger = index;
  const paidAmount = getPassengerPaidThisMonth(passenger.name);
  const outstanding = Math.max(0, monthlyFee - paidAmount);
  const isOverdue = isPassengerOverdue(passenger.name);
  const dueDate = getPassengerDueDate(passenger.name);
  const note = passengerNotes[passenger.name] || "";
  
  // Set modal title with overdue indicator
  document.getElementById("modalPassengerName").textContent = passenger.name + (isOverdue ? " ⚠️ Overdue" : "");
  
  // Set stats
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
  
  // Add due date info
  const dueInfo = document.createElement('div');
  dueInfo.style.cssText = `
    background: var(--bg-primary);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    margin-bottom: 12px;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
  `;
  dueInfo.innerHTML = `
    <span style="color:var(--text-secondary);">📅 Due Date:</span>
    <span style="font-weight:600;">${dueDate.toLocaleDateString()}</span>
  `;
  
  // Insert due info after stats
  const statsContainer = document.getElementById("modalStats");
  if (statsContainer && !document.getElementById("modalDueInfo")) {
    dueInfo.id = "modalDueInfo";
    statsContainer.parentNode.insertBefore(dueInfo, statsContainer.nextSibling);
  }
  
  // Add note input
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
  
  // Set note value
  const noteInput = document.getElementById("modalNoteInput");
  const noteDisplay = document.getElementById("modalNoteDisplay");
  if (noteInput) noteInput.value = note;
  if (noteDisplay) {
    noteDisplay.textContent = note ? "📝 " + note : "No notes";
    noteDisplay.style.color = note ? "var(--text-primary)" : "var(--text-muted)";
  }
  
  // Render payment history
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
  
  // Show modal
  document.getElementById("passengerModal").classList.add("active");
  document.body.style.overflow = "hidden";
};

/* ---- 21.5 Save Passenger Note ---- */

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
  
  // Refresh passenger list
  renderPassengers();
  showToast("Note saved!", "success");
}

/* ---- 21.6 Reminder Settings ---- */

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

/* ---- 21.7 Load Reminder Settings ---- */

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

/* ---- 21.8 Request Notification Permission ---- */

function requestNotificationPermission() {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
}

/* ---- 21.9 Override checkMonthReset with auto-reset setting ---- */

// Store the original function
const originalCheckMonthReset = checkMonthReset;

// Override with enhanced version
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
      
      // Check if auto-reset is enabled
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

/* ================================================================
   22. CLOUD SYNC
   ================================================================ */

// ---- Sync State ----
let lastSyncTime = localStorage.getItem("lastSyncTime") || null;
let syncCode = localStorage.getItem("syncCode") || "";

/* ---- 22.1 Generate Sync Code ---- */

/**
 * Generate a sync code for sharing data between devices
 */
function generateSyncCode() {
  try {
    // Prepare data for sync
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
    
    // Convert to JSON and encode
    const jsonString = JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(jsonString));
    
    // Limit code length (for QR code readability)
    if (encoded.length > 2000) {
      showToast("⚠️ Data is too large. Try exporting backup file instead.", "warning");
      return;
    }
    
    // Save sync code
    syncCode = encoded;
    localStorage.setItem("syncCode", syncCode);
    
    // Display the code
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

/* ---- 22.2 Import Sync Data ---- */

/**
 * Import data from a sync code
 */
function importSyncData() {
  // Show prompt for sync code
  const code = prompt("📋 Enter your sync code:");
  if (!code) return;
  
  try {
    // Decode the data
    const jsonString = decodeURIComponent(atob(code));
    const data = JSON.parse(jsonString);
    
    // Validate data
    if (!data.version || data.income === undefined) {
      showToast("❌ Invalid sync code. Please check and try again.", "error");
      return;
    }
    
    // Confirm import
    const confirmMsg = `⚠️ This will REPLACE all current data with synced data!\n\n` +
                       `Synced Data:\n` +
                       `• Income: R${data.income.toFixed(2)}\n` +
                       `• Expenses: R${data.expenses.toFixed(2)}\n` +
                       `• Passengers: ${data.passengers.length}\n` +
                       `• Transactions: ${(data.incomeHistory?.length || 0) + (data.expenseHistory?.length || 0)}\n\n` +
                       `Are you sure?`;
    
    if (!confirm(confirmMsg)) return;
    
    // Import data
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
    
    // Save all data
    saveData();
    localStorage.setItem("passengerNotes", JSON.stringify(passengerNotes));
    localStorage.setItem("monthlyTarget", monthlyTarget);
    localStorage.setItem("budgetLimit", budgetLimit);
    localStorage.setItem("defaultDueDay", defaultDueDay);
    localStorage.setItem("autoReminders", autoReminders);
    localStorage.setItem("reminderDays", reminderDays);
    localStorage.setItem("autoReset", autoReset);
    
    // Update UI
    updateUI();
    loadReminderSettings();
    
    showToast("✅ Data imported successfully from sync code!", "success");
    
  } catch (error) {
    showToast("❌ Error importing data: Invalid sync code", "error");
    console.error("Import error:", error);
  }
}

/* ---- 22.3 Copy Sync Code ---- */

/**
 * Copy sync code to clipboard
 */
function copySyncCode() {
  const codeEl = document.getElementById("syncCode");
  if (!codeEl) return;
  
  const code = codeEl.textContent;
  navigator.clipboard.writeText(code).then(() => {
    showToast("📋 Sync code copied to clipboard!", "success");
  }).catch(() => {
    // Fallback
    const textArea = document.createElement("textarea");
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast("📋 Sync code copied!", "success");
  });
}

/* ---- 22.4 Sync to Cloud (Manual) ---- */

/**
 * Manual sync to cloud (stores in localStorage with timestamp)
 */
function syncToCloud() {
  showToast("☁️ Syncing data...", "info");
  
  try {
    // Prepare sync data
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
    
    // Store sync data
    localStorage.setItem("cloudSyncData", JSON.stringify(syncData));
    lastSyncTime = new Date().toISOString();
    localStorage.setItem("lastSyncTime", lastSyncTime);
    
    // Update UI
    updateSyncStatus();
    
    showToast("✅ Data synced successfully! Last sync: " + new Date(lastSyncTime).toLocaleString(), "success");
    
  } catch (error) {
    showToast("❌ Sync failed: " + error.message, "error");
    console.error("Sync error:", error);
  }
}

/* ---- 22.5 Update Sync Status ---- */

/**
 * Update sync status display
 */
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
    // Calculate data size
    const data = JSON.stringify({
      income, expenses, passengers, incomeHistory, expenseHistory
    });
    const size = (data.length / 1024).toFixed(1);
    sizeEl.textContent = size + " KB";
  }
}

/* ---- 22.6 Check for Cloud Backup on Load ---- */

/**
 * Check for cloud backup and offer to restore
 */
function checkCloudBackup() {
  const cloudData = localStorage.getItem("cloudSyncData");
  if (!cloudData) return;
  
  try {
    const syncData = JSON.parse(cloudData);
    const lastSync = new Date(syncData.lastSync);
    const now = new Date();
    const hoursSince = (now - lastSync) / (1000 * 60 * 60);
    
    // Only show if last sync was within 24 hours
    if (hoursSince < 24) {
      // Silently update last sync time
      lastSyncTime = syncData.lastSync;
      localStorage.setItem("lastSyncTime", lastSyncTime);
      updateSyncStatus();
    }
  } catch (error) {
    console.log("Cloud backup check failed:", error);
  }
}

/* ---- 22.7 QR Code Generation (Bonus) ---- */

/**
 * Generate QR code for sync (requires a QR library)
 * This uses a free API - no libraries needed!
 */
function generateQRCode() {
  generateSyncCode();
  
  const code = document.getElementById("syncCode");
  if (!code || !code.textContent) {
    showToast("Please generate a sync code first", "error");
    return;
  }
  
  // Create QR code using Google's API
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
  
  // Close on click outside
  qrContainer.addEventListener('click', (e) => {
    if (e.target === qrContainer) {
      qrContainer.remove();
    }
  });
}

/* ---- 22.8 Auto-Sync on App Close ---- */

/**
 * Auto-sync data when user leaves the page
 */
function autoSyncOnClose() {
  // Sync data to localStorage
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

// Add event listeners for auto-sync
window.addEventListener('beforeunload', autoSyncOnClose);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    autoSyncOnClose();
  }
});

/* ================================================================
   23. DYNAMIC PERCENTAGE CHANGES
   ================================================================ */

/**
 * Calculate and update the percentage changes for Income and Expenses
 * Compares this month vs last month
 */
function updatePercentageChanges() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // ---- Calculate This Month's Income ----
  let thisMonthIncome = 0;
  incomeHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      thisMonthIncome += item.amount;
    }
  });
  
  // ---- Calculate Last Month's Income ----
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
  
  // ---- Calculate Income Change ----
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
  
  // ---- Calculate This Month's Expenses ----
  let thisMonthExpenses = 0;
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      thisMonthExpenses += item.amount;
    }
  });
  
  // ---- Calculate Last Month's Expenses ----
  let lastMonthExpenses = 0;
  expenseHistory.forEach(item => {
    const date = new Date(item.date);
    if (date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear) {
      lastMonthExpenses += item.amount;
    }
  });
  
  // ---- Calculate Expense Change ----
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
  
  // ---- Update Income Percentage Display ----
  const incomePercentEl = document.getElementById('incomeChangePercent');
  const incomeTextEl = document.getElementById('incomePercentText');
  if (incomePercentEl && incomeTextEl) {
    incomePercentEl.className = 'stat-change ' + incomeChangeClass;
    const icon = incomePercentEl.querySelector('i');
    if (icon) {
      icon.className = 'fas ' + incomeChangeIcon;
    }
    incomeTextEl.textContent = incomeChangeText;
    
    // Add tooltip with more info
    incomePercentEl.title = `This Month: R${thisMonthIncome.toFixed(2)} | Last Month: R${lastMonthIncome.toFixed(2)} | ${incomeArrow} ${incomeChangeText}`;
  }
  
  // ---- Update Expense Percentage Display ----
  const expensePercentEl = document.getElementById('expenseChangePercent');
  const expenseTextEl = document.getElementById('expensePercentText');
  if (expensePercentEl && expenseTextEl) {
    expensePercentEl.className = 'stat-change ' + expenseChangeClass;
    const icon = expensePercentEl.querySelector('i');
    if (icon) {
      icon.className = 'fas ' + expenseChangeIcon;
    }
    expenseTextEl.textContent = expenseChangeText;
    
    // Add tooltip with more info
    expensePercentEl.title = `This Month: R${thisMonthExpenses.toFixed(2)} | Last Month: R${lastMonthExpenses.toFixed(2)} | ${expenseArrow} ${expenseChangeText}`;
  }
  
  // ---- Update the stat cards with more info ----
  const incomeCard = document.querySelector('.stat-income');
  const expenseCard = document.querySelector('.stat-expense');
  
  if (incomeCard) {
    const changeEl = incomeCard.querySelector('.stat-change');
    if (changeEl) {
      // Add dynamic label showing month comparison
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
  
  // ---- Log for debugging ----
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

/* ================================================================
   24. PWA INSTALL BANNER
   ================================================================ */

let deferredPrompt = null;

// ---- Detect if app can be installed ----
window.addEventListener('beforeinstallprompt', function(e) {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install banner
  const banner = document.getElementById('installBanner');
  if (banner) {
    banner.className = 'show';
  }
});

// ---- Install Button Click ----
document.addEventListener('DOMContentLoaded', function() {
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', function() {
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
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

// ---- Hide Install Banner ----
function hideInstallBanner() {
  const banner = document.getElementById('installBanner');
  if (banner) {
    banner.className = '';
    // Save preference
    localStorage.setItem('hideInstallBanner', 'true');
  }
}

// ---- Check if banner should be shown ----
window.addEventListener('load', function() {
  // Don't show if user already installed or hid it
  if (localStorage.getItem('hideInstallBanner') === 'true') {
    const banner = document.getElementById('installBanner');
    if (banner) banner.className = '';
  }
  
  // Check if already installed (standalone mode)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    const banner = document.getElementById('installBanner');
    if (banner) banner.className = '';
    console.log('📱 App is running in standalone mode (installed)');
  }
});

// ---- Detect when app is installed ----
window.addEventListener('appinstalled', function() {
  console.log('🎉 App installed successfully!');
  hideInstallBanner();
  showToast('🎉 Route Ledger installed successfully!', 'success');
});

/* ----------------------------------------------------------------------------- */
// Start the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
