const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("transactionDate");

const totalBalanceElement = document.getElementById("totalBalance");
const totalIncomeElement = document.getElementById("totalIncome");
const totalExpensesElement = document.getElementById("totalExpenses");

const transactionList = document.getElementById("transactionList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const todayDateElement = document.getElementById("todayDate");

const CURRENCY = "EGP";
const moneyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY
});

function getLocalDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

todayDateElement.textContent = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
}).format(new Date());

dateInput.value = getLocalDate();

let transactions = [];
try {
    const savedTransactions = localStorage.getItem("expenseTrackerTransactions");

    if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);

        if (Array.isArray(parsedTransactions)) {
            transactions = parsedTransactions.filter((transaction) => {
                return (
                    transaction &&
                    typeof transaction.id === "string" &&
                    typeof transaction.description === "string" &&
                    Number.isFinite(transaction.amount) &&
                    transaction.amount > 0 &&
                    ["income", "expense"].includes(transaction.type) &&
                    typeof transaction.category === "string" &&
                    typeof transaction.date === "string"
                );
            });
        }
    }
} catch (error) {
    console.error("Could not load saved transactions:", error);
}
function saveTransactions() {
    try {
        localStorage.setItem(
            "expenseTrackerTransactions",
            JSON.stringify(transactions)
        );
    } catch (error) {
        alert("Could not save your data in this browser.");
        console.error("Could not save transactions:", error);
    }
}

function formatMoney(amount) {
    return moneyFormatter.format(amount);
}

function updateSummary() {
    const totalIncome = transactions
        .filter(transaction => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpenses = transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalBalance = totalIncome - totalExpenses;

    totalBalanceElement.textContent = formatMoney(totalBalance);
    totalIncomeElement.textContent = formatMoney(totalIncome);
    totalExpensesElement.textContent = formatMoney(totalExpenses);
}

function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
}

function renderTransactions() {
    transactionList.replaceChildren();
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filteredTransactions = transactions
        .filter(transaction => {
            return transaction.description
                .toLowerCase()
                .includes(searchTerm);
        })
        .sort((a, b) => {
            return b.date.localeCompare(a.date) ||
                b.id.localeCompare(a.id);
        });
    filteredTransactions.forEach(transaction => {
        const row = document.createElement("tr");

        row.appendChild(createCell(transaction.description));
        row.appendChild(createCell(transaction.category));
        row.appendChild(createCell(transaction.date));

        const amountCell = document.createElement("td");
        const amountSpan = document.createElement("span");

        if (transaction.type === "income") {
            amountSpan.textContent = `+${formatMoney(transaction.amount)}`;
            amountSpan.className = "income-amount";
        } else {
            amountSpan.textContent = `-${formatMoney(transaction.amount)}`;
            amountSpan.className = "expense-amount";
        }
        amountCell.appendChild(amountSpan);
        row.appendChild(amountCell);

        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";
        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        transactionList.appendChild(row);
    });

    emptyMessage.hidden = filteredTransactions.length > 0;

    if (transactions.length > 0 && filteredTransactions.length === 0) {
        emptyMessage.textContent = "No matching transactions found.";
    } else {
        emptyMessage.textContent =
            "No transactions yet. Add your first transaction!";
    }

    updateSummary();
}

transactionForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description) {
        alert("Please enter a transaction name.");
        return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than zero.");
        return;
    }
    if (!["income", "expense"].includes(type)) {
        alert("Please select a valid transaction type.");
        return;
    }
    if (!date) {
        alert("Please select a transaction date.");
        return;
    }
    const transaction = {
        id: crypto.randomUUID(),
        description,
        amount,
        type,
        category,
        date
    };
    transactions.push(transaction);

    saveTransactions();
    renderTransactions();

    transactionForm.reset();
    dateInput.value = getLocalDate();
    typeInput.value = "expense";
    categoryInput.value = "Food";

    descriptionInput.focus();
});

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
        return;
    }

    transactions = transactions.filter(
        transaction => transaction.id !== id
    );

    saveTransactions();
    renderTransactions();
}
searchInput.addEventListener("input", renderTransactions);
renderTransactions();