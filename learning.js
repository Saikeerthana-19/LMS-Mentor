
document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "http://localhost:8082/LMSPortal/LearningController";

    const tableBody = document.getElementById("batchTableBody");
    const totalCount = document.getElementById("totalCount");

    const searchInput = document.getElementById("batchSearch");
    const statusFilter = document.getElementById("batchStatus");
    const courseFilter = document.getElementById("courseFilter");
    const moduleFilter = document.getElementById("moduleFilter");
    const instructorFilter = document.getElementById("instructorFilter");

    const tabs = document.querySelectorAll(".tab");
    const applyBtn = document.getElementById("applyFilters");

    let allBatches = [];
    let activeTab = "Active";

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function populateFilter(select, values, placeholder) {

        const uniqueValues = [...new Set(
            values.filter(value => value && value.trim() !== "")
        )];

        select.innerHTML =
            `<option value="">${placeholder}</option>`;

        uniqueValues.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function displayBatches(batches) {

        tableBody.innerHTML = "";
        totalCount.textContent = batches.length;

        if (batches.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center">
                        No batches available
                    </td>
                </tr>
            `;
            return;
        }

        batches.forEach(function (batch, index) {

            const progress = Math.max(
                0,
                Math.min(100, Number(batch.progress) || 0)
            );

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${String(index + 1).padStart(2, "0")}</td>

                <td>
                    <strong>${escapeHTML(batch.batchName)}</strong>
                    <br>
                    <small>${escapeHTML(batch.learnerCount)} Learners</small>
                </td>

                <td>${escapeHTML(batch.courseName)}</td>

                <td>${escapeHTML(batch.duration)}</td>

                <td>
                    ${escapeHTML(batch.moduleName || "-")}
                    <br>
                    <small>${escapeHTML(batch.instructorName || "-")}</small>
                </td>

                <td>${escapeHTML(batch.batchManager || "-")}</td>

                <td>
                    <div class="progress-track">
                        <div class="progress-fill"
                             style="width:${progress}%"></div>
                    </div>
                    ${progress}%
                </td>

                <td>
                    <button class="action-btn"
                            type="button"
                            data-batch-id="${batch.batchId}"
                            title="Batch actions">
                        •••
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    function applyFilters() {

        const search = searchInput.value.toLowerCase().trim();

        const selectedStatus = statusFilter.value;
        const selectedCourse = courseFilter.value;
        const selectedModule = moduleFilter.value;
        const selectedInstructor = instructorFilter.value;

        const filtered = allBatches.filter(function (batch) {

            const status = (batch.batchStatus || "").toLowerCase();

const matchesTab =
    activeTab === "All" ||
    (activeTab === "Active"
        ? status === "ongoing" || status === "upcoming"
        : activeTab === "Completed"
            ? status === "completed"
            : status === "inactive" || status === "archived");
            const matchesStatus =
                !selectedStatus || batch.batchStatus === selectedStatus;

            const matchesCourse =
                !selectedCourse || batch.courseName === selectedCourse;

            const matchesModule =
                !selectedModule ||
                (batch.moduleName || "").includes(selectedModule);

            const matchesInstructor =
                !selectedInstructor ||
                (batch.instructorName || "").includes(selectedInstructor);

            const matchesSearch =
                (batch.batchName || "").toLowerCase().includes(search);

            return matchesTab &&
                   matchesStatus &&
                   matchesCourse &&
                   matchesModule &&
                   matchesInstructor &&
                   matchesSearch;
        });

        displayBatches(filtered);
    }

    async function loadBatches() {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center">
                    Loading batches...
                </td>
            </tr>
        `;

        try {

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            allBatches = data.batches || [];

            populateFilter(
                courseFilter,
                allBatches.map(b => b.courseName),
                "Select Course"
            );

            populateFilter(
                moduleFilter,
                allBatches.flatMap(b =>
                    (b.moduleName || "").split(", ")
                ),
                "Select Module"
            );

            populateFilter(
                instructorFilter,
                allBatches.flatMap(b =>
                    (b.instructorName || "").split(", ")
                ),
                "Select Instructor"
            );

            applyFilters();

        } catch (error) {

            console.error("Batch loading failed:", error);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center">
                        Unable to load batches. Check Tomcat connection.
                    </td>
                </tr>
            `;

            totalCount.textContent = "0";
        }
    }

    // Batch tabs
    tabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            tabs.forEach(t => t.classList.remove("active"));

            tab.classList.add("active");

            activeTab = tab.dataset.status;

            applyFilters();
        });
    });

    // Apply filters
    applyBtn.addEventListener("click", applyFilters);

    // Search
    searchInput.addEventListener("input", applyFilters);
// Manage Columns Modal

const columnsBtn = document.getElementById("columnsBtn");
const columnsModal = document.getElementById("columnsModal");

const availableList = document.getElementById("availableColumnList");
const selectedList = document.getElementById("selectedColumnList");

const visibleCount = document.getElementById("visibleCount");

const columnNames = [
    "#",
    "Batch Name",
    "Course",
    "Duration",
    "Module & Instructor",
    "Batch Manager",
    "Batch Progress",
    "Actions"
];

let savedColumns = columnNames.map(() => true);
let temporaryColumns = [...savedColumns];

function renderColumns() {

    availableList.innerHTML = "";
    selectedList.innerHTML = "";

    columnNames.forEach((name, index) => {

        const option = document.createElement("label");
        option.className = "column-option";

        option.innerHTML = `
            <span>${name}</span>
            <input type="checkbox"
                   data-index="${index}"
                   ${temporaryColumns[index] ? "checked" : ""}>
        `;

        option.querySelector("input").addEventListener("change", function() {
            temporaryColumns[index] = this.checked;
            renderColumns();
        });

        if (temporaryColumns[index]) {
            selectedList.appendChild(option);
        } else {
            availableList.appendChild(option);
        }
    });

    const count = temporaryColumns.filter(Boolean).length;
    visibleCount.textContent = `${count} of 8 columns visible`;
}

function applyColumnVisibility() {

    document.querySelectorAll("table tr").forEach(row => {

        columnNames.forEach((name, index) => {

            const cell = row.children[index];

            if (cell) {
                cell.style.display =
                    savedColumns[index] ? "" : "none";
            }

        });

    });
}

columnsBtn.addEventListener("click", function() {
    temporaryColumns = [...savedColumns];
    renderColumns();
    columnsModal.classList.add("show");
});

document.getElementById("showAllColumns").addEventListener("click", function() {
    temporaryColumns = columnNames.map(() => true);
    renderColumns();
});

document.getElementById("resetColumns").addEventListener("click", function() {
    temporaryColumns = columnNames.map(() => true);
    renderColumns();
});

document.getElementById("discardColumns").addEventListener("click", function() {
    columnsModal.classList.remove("show");
});

document.getElementById("saveColumns").addEventListener("click", function() {
    savedColumns = [...temporaryColumns];
    applyColumnVisibility();
    columnsModal.classList.remove("show");
});
    // Load database batches
    loadBatches();

});
// Open Batch Details when clicking Actions
tableBody.addEventListener("click", function (event) {

    const actionButton = event.target.closest(".action-btn");

    if (actionButton) {
        const batchId = actionButton.dataset.batchId;

        window.location.href =
            "batch-details.html?batchId=" + batchId;
    }

});
const learningMenu = document.querySelector(".menu-group > a");
const menuGroup = document.querySelector(".menu-group");

learningMenu.addEventListener("click", function(event) {
    event.preventDefault();
    menuGroup.classList.toggle("open");
});