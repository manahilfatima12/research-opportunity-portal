
const API_URL = "http://localhost:3000/api/opportunities";

// Get the HTML elements we need to control.
const opportunityList = document.getElementById("opportunityList");
const messageBox = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");

const formModal = document.getElementById("formModal");
const opportunityForm = document.getElementById("opportunityForm");
const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");

const detailsModal = document.getElementById("detailsModal");
const detailsContent = document.getElementById("detailsContent");

// Keep the opportunities retrieved from the API in memory.
let opportunities = [];

// Store the ID when editing. Null means we are creating a new record.
let editingId = null;


// Display success and error messages.
function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `message ${type}`;

    window.setTimeout(() => {
        messageBox.textContent = "";
        messageBox.className = "message";
    }, 4000);
}


// Escape text before inserting database values into HTML.
// This prevents user-entered text from being treated as HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// Retrieve all opportunities from the backend.
async function loadOpportunities() {
    opportunityList.innerHTML = "<p>Loading opportunities...</p>";

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not load opportunities.");
        }

        opportunities = data;
        renderOpportunities();
    } catch (error) {
        opportunityList.innerHTML = `
            <p class="empty-state">
                Could not connect to the server.
                Make sure your backend is running on port 3000.
            </p>
        `;
        showMessage(error.message, "error");
    }
}


// Display opportunities according to the search and status filters.
function renderOpportunities() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredOpportunities = opportunities.filter(opportunity => {
        const searchableText = [
            opportunity.title,
            opportunity.faculty_name,
            opportunity.research_area,
            opportunity.department,
            opportunity.required_skills
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);
        const matchesStatus =
            selectedStatus === "All" ||
            opportunity.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    if (filteredOpportunities.length === 0) {
        opportunityList.innerHTML = `
            <div class="empty-state">
                <h3>No opportunities found</h3>
                <p>Try changing your search or add a new opportunity.</p>
            </div>
        `;
        return;
    }

    opportunityList.innerHTML = filteredOpportunities.map(opportunity => `
        <article class="opportunity-card">
            <span class="status ${
                opportunity.status === "Open" ? "status-open" : "status-closed"
            }">${escapeHTML(opportunity.status)}</span>

            <h3>${escapeHTML(opportunity.title)}</h3>

            <p class="card-description">
                ${escapeHTML(opportunity.description)}
            </p>

            <div class="card-meta">
                <p><strong>Research Area:</strong>
                    ${escapeHTML(opportunity.research_area)}</p>
                <p><strong>Faculty:</strong>
                    ${escapeHTML(opportunity.faculty_name)}</p>
                <p><strong>Department:</strong>
                    ${escapeHTML(opportunity.department)}</p>
                <p><strong>Positions:</strong>
                    ${escapeHTML(opportunity.available_positions)}</p>
                <p><strong>Deadline:</strong>
                    ${escapeHTML(opportunity.application_deadline)}</p>
            </div>

            <div class="card-actions">
                <button class="details-button"
                    data-action="details" data-id="${opportunity.id}">
                    View Details
                </button>

                <button class="edit-button"
                    data-action="edit" data-id="${opportunity.id}">
                    Edit
                </button>

                ${opportunity.status === "Open" ? `
                    <button class="close-opportunity-button"
                        data-action="close" data-id="${opportunity.id}">
                        Close Opportunity
                    </button>
                ` : ""}

                <button class="delete-button"
                    data-action="delete" data-id="${opportunity.id}">
                    Delete
                </button>
            </div>
        </article>
    `).join("");
}


// Open a blank form for creating a new opportunity.
function openAddForm() {
    editingId = null;
    opportunityForm.reset();

    document.getElementById("application_deadline").min =
        new Date().toLocaleDateString("en-CA");

    document.getElementById("status").value = "Open";
    formTitle.textContent = "Add Research Opportunity";
    saveButton.textContent = "Save Opportunity";
    formModal.classList.remove("hidden");
}


// Open the form with existing information for editing.
function openEditForm(id) {
    const opportunity = opportunities.find(item => item.id === id);

    if (!opportunity) {
        showMessage("Opportunity not found.", "error");
        return;
    }

    editingId = id;
    opportunityForm.reset();

    for (const field of [
        "title",
        "description",
        "research_area",
        "faculty_name",
        "department",
        "required_skills",
        "available_positions",
        "application_deadline",
        "status"
    ]) {
        opportunityForm.elements[field].value = opportunity[field] ?? "";
    }

    // Do not force the deadline to be today or later while editing
    // an existing record that may have an earlier deadline.
    document.getElementById("application_deadline").removeAttribute("min");

    formTitle.textContent = "Edit Research Opportunity";
    saveButton.textContent = "Update Opportunity";
    formModal.classList.remove("hidden");
}


// Close the create/edit form.
function closeForm() {
    formModal.classList.add("hidden");
    opportunityForm.reset();
    editingId = null;
}


// Send the form information to the backend.
async function saveOpportunity(event) {
    event.preventDefault();

    const formData = new FormData(opportunityForm);
    const opportunityData = Object.fromEntries(formData.entries());

    opportunityData.title = opportunityData.title.trim();
    opportunityData.description = opportunityData.description.trim();
    opportunityData.research_area = opportunityData.research_area.trim();
    opportunityData.faculty_name = opportunityData.faculty_name.trim();
    opportunityData.department = opportunityData.department.trim();
    opportunityData.required_skills = opportunityData.required_skills.trim();
    opportunityData.available_positions =
        Number(opportunityData.available_positions);

    if (
        !opportunityData.title ||
        !opportunityData.description ||
        !opportunityData.research_area ||
        !opportunityData.faculty_name ||
        !opportunityData.department ||
        !opportunityData.required_skills
    ) {
        showMessage("Please complete all required fields.", "error");
        return;
    }

    if (
        !Number.isInteger(opportunityData.available_positions) ||
        opportunityData.available_positions < 1
    ) {
        showMessage("Available positions must be a whole number of at least 1.", "error");
        return;
    }

    if (!opportunityData.application_deadline) {
        showMessage("Please select an application deadline.", "error");
        return;
    }

    const isEditing = editingId !== null;
    const url = isEditing ? `${API_URL}/${editingId}` : API_URL;
    const method = isEditing ? "PUT" : "POST";

    saveButton.disabled = true;
    saveButton.textContent = isEditing ? "Updating..." : "Saving...";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(opportunityData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not save the opportunity.");
        }

        closeForm();
        await loadOpportunities();

        showMessage(
            result.message || (
                isEditing
                    ? "Opportunity updated successfully."
                    : "Opportunity created successfully."
            )
        );
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingId !== null
            ? "Update Opportunity"
            : "Save Opportunity";
    }
}


// Retrieve and display one opportunity.
async function viewDetails(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const opportunity = await response.json();

        if (!response.ok) {
            throw new Error(opportunity.message || "Could not load details.");
        }

        detailsContent.innerHTML = `
            <h3>${escapeHTML(opportunity.title)}</h3>
            <p><strong>ID:</strong> ${escapeHTML(opportunity.id)}</p>
            <p><strong>Description:</strong> ${escapeHTML(opportunity.description)}</p>
            <p><strong>Research Area:</strong> ${escapeHTML(opportunity.research_area)}</p>
            <p><strong>Faculty Member:</strong> ${escapeHTML(opportunity.faculty_name)}</p>
            <p><strong>Department:</strong> ${escapeHTML(opportunity.department)}</p>
            <p><strong>Required Skills:</strong> ${escapeHTML(opportunity.required_skills)}</p>
            <p><strong>Available Positions:</strong> ${escapeHTML(opportunity.available_positions)}</p>
            <p><strong>Application Deadline:</strong> ${escapeHTML(opportunity.application_deadline)}</p>
            <p><strong>Status:</strong> ${escapeHTML(opportunity.status)}</p>
        `;

        detailsModal.classList.remove("hidden");
    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Change an opportunity's status to Closed.
async function closeOpportunity(id) {
    const opportunity = opportunities.find(item => item.id === id);

    if (!opportunity) {
        showMessage("Opportunity not found.", "error");
        return;
    }

    if (opportunity.status === "Closed") {
        showMessage("This opportunity is already closed.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to close "${opportunity.title}"?`
    );

    if (!confirmed) {
        return;
    }

    const updatedOpportunity = {
        title: opportunity.title,
        description: opportunity.description,
        research_area: opportunity.research_area,
        faculty_name: opportunity.faculty_name,
        department: opportunity.department,
        required_skills: opportunity.required_skills,
        available_positions: opportunity.available_positions,
        application_deadline: String(opportunity.application_deadline).slice(0, 10),
        status: "Closed"
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedOpportunity)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not close the opportunity.");
        }

        await loadOpportunities();
        showMessage("Opportunity closed successfully.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Delete an opportunity after confirmation.
async function deleteOpportunity(id) {
    const opportunity = opportunities.find(item => item.id === id);

    if (!opportunity) {
        showMessage("Opportunity not found.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete "${opportunity.title}"? This cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not delete the opportunity.");
        }

        await loadOpportunities();
        showMessage(result.message || "Opportunity deleted successfully.");
    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Handle buttons inside the opportunity cards.
opportunityList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "details") {
        viewDetails(id);
    } else if (action === "edit") {
        openEditForm(id);
    } else if (action === "close") {
        closeOpportunity(id);
    } else if (action === "delete") {
        deleteOpportunity(id);
    }
});


// Connect buttons, form submission, search, and filters.
document.getElementById("addButton").addEventListener("click", openAddForm);
document.getElementById("closeFormButton").addEventListener("click", closeForm);
document.getElementById("cancelButton").addEventListener("click", closeForm);

document.getElementById("closeDetailsButton").addEventListener("click", () => {
    detailsModal.classList.add("hidden");
});

opportunityForm.addEventListener("submit", saveOpportunity);
searchInput.addEventListener("input", renderOpportunities);
statusFilter.addEventListener("change", renderOpportunities);


// Close a dialog when the user clicks its dark background.
formModal.addEventListener("click", event => {
    if (event.target === formModal) {
        closeForm();
    }
});

detailsModal.addEventListener("click", event => {
    if (event.target === detailsModal) {
        detailsModal.classList.add("hidden");
    }
});


// Load the actual records from the API when the page starts.
loadOpportunities();
