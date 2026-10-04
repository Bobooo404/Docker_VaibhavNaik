const form = document.getElementById("registration-form");
const messageBox = document.getElementById("message");
const submitButton = document.getElementById("submit-button");
const recordList = document.getElementById("record-list");
const recordCount = document.getElementById("record-count");

function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
}

function clearErrors() {
    ["name", "email", "course"].forEach((field) => {
        document.getElementById(`${field}-error`).textContent = "";
    });
}

function showErrors(errors) {
    Object.entries(errors || {}).forEach(([field, text]) => {
        const target = document.getElementById(`${field}-error`);
        if (target) target.textContent = text;
    });
}

async function loadRecords() {
    try {
        const response = await fetch("/submissions");
        const data = await response.json();
        const records = data.submissions || [];

        recordCount.textContent = records.length;
        recordList.innerHTML = "";

        records.forEach((record) => {
            const item = document.createElement("li");
            item.innerHTML = `
                <span class="name">${record.name}</span><br>
                ${record.email} &middot; ${record.course}
            `;
            recordList.appendChild(item);
        });
    } catch (error) {
        recordCount.textContent = "0";
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearErrors();
    messageBox.className = "message hidden";
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const payload = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        course: document.getElementById("course").value
    };

    try {
        const response = await fetch("/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message, "success");
            form.reset();
        } else {
            showErrors(data.errors);
            showMessage(data.message || "Submission failed.", "failed");
        }

        await loadRecords();
    } catch (error) {
        showMessage(`Network error: ${error.message}`, "failed");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit";
    }
});

loadRecords();