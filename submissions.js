
const learningMenu = document.querySelector(".menu-group > a");
const menuGroup = document.querySelector(".menu-group");

learningMenu.addEventListener("click", function(event) {
    event.preventDefault();
    menuGroup.classList.toggle("open");
});

// Backend URL
const API_URL = "http://localhost:8082/LMSPortal/SubmissionController";

let allSubmissions = [];
let selectedTab = "Not Evaluated";

// Load submissions from database
function loadSubmissions() {

    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            allSubmissions = data;
            displaySubmissions();
            loadFilters();
        })
        .catch(error => {
            console.log("Error loading submissions:", error);
        });
}

// Display submissions in table
function displaySubmissions() {

    const tableBody = document.getElementById("submissionTableBody");
    const searchValue = document.getElementById("learnerSearch").value.toLowerCase();

    let filtered = allSubmissions.filter(s => {

        let tabMatch = selectedTab === "All" ||
                       s.evaluationStatus === selectedTab;

        let searchMatch = s.learnerName.toLowerCase().includes(searchValue) ||
                          s.assessmentName.toLowerCase().includes(searchValue);

        return tabMatch && searchMatch;
    });

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="11" class="empty-data">No submissions available</td></tr>';
        return;
    }

    filtered.forEach(s => {

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${s.learnerName}</td>
            <td>${s.assessmentName}</td>
            <td>${s.submissionDate || "-"}</td>
            <td>${s.timeliness || "-"}</td>
            <td>${s.assessmentType || "-"}</td>
            <td>${s.marksObtained}</td>
            <td>${s.totalMarks}</td>
            <td>${Number(s.percentage).toFixed(2)}%</td>
            <td>${s.productName || "-"}</td>
            <td>${s.batchName || "-"}</td>
            <td>
                <button class="review-btn"
                        onclick="reviewSubmission(${s.submissionId})">
                    Review
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Load filter options from database records
function loadFilters() {

    fillFilter("courseFilter", "productName", "Select Course");
    fillFilter("batchFilter", "batchName", "Select Batch");
    fillFilter("assessmentFilter", "assessmentName", "Select Assessment");
}

function fillFilter(elementId, property, defaultText) {

    const select = document.getElementById(elementId);
    const values = [...new Set(
        allSubmissions.map(s => s[property]).filter(value => value)
    )];

    select.innerHTML = `<option value="">${defaultText}</option>`;

    values.forEach(value => {
        select.innerHTML += `<option value="${value}">${value}</option>`;
    });
}

// Tab functionality
document.querySelectorAll(".tab").forEach(tab => {

    tab.addEventListener("click", function() {

        document.querySelectorAll(".tab").forEach(t => {
            t.classList.remove("active");
        });

        this.classList.add("active");
        selectedTab = this.textContent.trim();

        displaySubmissions();
    });
});

// Search functionality
document.getElementById("learnerSearch")
    .addEventListener("input", displaySubmissions);

// Apply filters
document.querySelector(".apply-btn").addEventListener("click", function() {

    const course = document.getElementById("courseFilter").value;
    const batch = document.getElementById("batchFilter").value;
    const assessment = document.getElementById("assessmentFilter").value;

    let filtered = allSubmissions.filter(s => {

        return (!course || s.productName === course) &&
               (!batch || s.batchName === batch) &&
               (!assessment || s.assessmentName === assessment);
    });

    displayFilteredRows(filtered);
});

// Display filtered records
function displayFilteredRows(filtered) {

    const tableBody = document.getElementById("submissionTableBody");

    tableBody.innerHTML = "";

    filtered = filtered.filter(s =>
        selectedTab === "All" || s.evaluationStatus === selectedTab
    );

    if (filtered.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="11" class="empty-data">No submissions available</td></tr>';
        return;
    }

    filtered.forEach(s => {

        let row = document.createElement("tr");

        row.innerHTML = `
            <td>${s.learnerName}</td>
            <td>${s.assessmentName}</td>
            <td>${s.submissionDate || "-"}</td>
            <td>${s.timeliness || "-"}</td>
            <td>${s.assessmentType || "-"}</td>
            <td>${s.marksObtained}</td>
            <td>${s.totalMarks}</td>
            <td>${Number(s.percentage).toFixed(2)}%</td>
            <td>${s.productName || "-"}</td>
            <td>${s.batchName || "-"}</td>
            <td><button onclick="reviewSubmission(${s.submissionId})">Review</button></td>
        `;

        tableBody.appendChild(row);
    });
}

// Clear filters
document.querySelector(".clear-btn").addEventListener("click", function() {

    document.getElementById("courseFilter").value = "";
    document.getElementById("batchFilter").value = "";
    document.getElementById("instructorFilter").value = "";
    document.getElementById("assessmentFilter").value = "";
    document.getElementById("learnerSearch").value = "";

    document.getElementById("dateFilter").selectedIndex = 0;

    displaySubmissions();
});

// Review submission
function reviewSubmission(id) {

    let marks = prompt("Enter marks obtained:");

    if (marks === null) return;

    let feedback = prompt("Enter feedback:");

    if (feedback === null) return;

    const formData = new URLSearchParams();

    formData.append("submissionId", id);
    formData.append("marksObtained", marks);
    formData.append("feedback", feedback);

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {

        if (data.success) {
            alert("Evaluation saved successfully!");
            loadSubmissions();
        } else {
            alert("Evaluation failed!");
        }
    })
    .catch(error => console.log(error));
}

// Initial loading
loadSubmissions();
