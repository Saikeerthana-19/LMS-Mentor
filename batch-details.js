
document.addEventListener("DOMContentLoaded", function () {

    const LEARNER_API = "http://localhost:8082/LMSPortal/LearnerController";
    const LEARNING_API = "http://localhost:8082/LMSPortal/LearningController";
    const SESSION_API = "http://localhost:8082/LMSPortal/HomeController";

    // Get selected batch ID from URL
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get("batchId") || "1";

    const tableBody = document.getElementById("learnerTableBody");
    const learnerCount = document.getElementById("learnerCount");
    const learnerTotal = document.getElementById("learnerTotal");
    const searchInput = document.getElementById("learnerSearch");

    const sessionBody = document.getElementById("sessionDetailsBody");

    const learnerTabs = document.querySelectorAll(".learner-tab");
    const mainTabs = document.querySelectorAll(".main-tab");
    const tabContents = document.querySelectorAll(".tab-content");

    let allLearners = [];
    let activeLearnerTab = "All";


    // Escape HTML values
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


    // Display learners in table
    function displayLearners(learners) {

        tableBody.innerHTML = "";

        learnerTotal.textContent = learners.length;

        if (learners.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center">
                        No learner records found.
                    </td>
                </tr>
            `;
            return;
        }

        learners.forEach(function (learner) {

            const attendance = Math.round(
                Number(learner.attendancePercentage) || 0
            );

            const progress = Math.max(
                0,
                Math.min(100, Number(learner.progress) || 0)
            );

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    ${escapeHTML(learner.learnerName)}
                    <br>
                    <small># ${escapeHTML(learner.learnerId)}</small>
                </td>

                <td>${escapeHTML(learner.enrolledOn || "-")}</td>

                <td>
                    <span class="attendance-value">
                        ${attendance}%
                    </span>
                </td>

                <td>
                    <div class="progress-track">
                        <div class="progress-fill"
                             style="width:${progress}%">
                        </div>
                    </div>
                    ${progress}%
                </td>

                <td>
                    <button class="action-btn" type="button"
                            title="Learner actions">
                        ⋮
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }


    // Apply learner status and search filters
    function applyLearnerFilters() {

        const search = searchInput.value.toLowerCase().trim();

        const filtered = allLearners.filter(function (learner) {

            const status = learner.enrollmentStatus;

            let matchesTab = true;

            if (activeLearnerTab === "Enrolled") {
                matchesTab = status === "Active";
            }
            else if (activeLearnerTab === "Completed") {
                matchesTab = status === "Completed";
            }
            else if (activeLearnerTab === "Leave") {
                matchesTab = status === "Dropped";
            }
            else if (activeLearnerTab === "Free Enrolled" ||
                     activeLearnerTab === "Archived") {
                matchesTab = false;
            }

            const matchesSearch =
                (learner.learnerName || "").toLowerCase().includes(search) ||
                (learner.email || "").toLowerCase().includes(search) ||
                (learner.phone || "").toLowerCase().includes(search);

            return matchesTab && matchesSearch;
        });

        displayLearners(filtered);
    }


    // Fetch learners from backend
    async function loadLearners() {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center">
                    Loading learners...
                </td>
            </tr>
        `;

        try {

            const response = await fetch(
                LEARNER_API + "?batchId=" + encodeURIComponent(batchId)
            );

            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            allLearners = data.learners || [];

            learnerCount.textContent = data.count ?? allLearners.length;

            applyLearnerFilters();

        } catch (error) {

            console.error("Learner loading failed:", error);

            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center">
                        Unable to load learners. Check backend connection.
                    </td>
                </tr>
            `;

            learnerCount.textContent = "0";
            learnerTotal.textContent = "0";
        }
    }


    // Load dynamic batch header and summary
    async function loadBatchSummary() {

        try {

            const response = await fetch(LEARNING_API);

            if (!response.ok) {
                throw new Error("Unable to load batch details");
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Find selected batch
            const batch = (data.batches || []).find(
                b => Number(b.batchId) === Number(batchId)
            );

            if (!batch) {
                throw new Error("Batch not found");
            }

            // Batch name
            document.getElementById("batchName").textContent =
                batch.batchName || "-";

            // Module count
            const modules = batch.moduleName
                ? batch.moduleName.split(",").filter(m => m.trim() !== "")
                : [];

            document.getElementById("moduleCount").textContent =
                modules.length;

            // Learner count
            document.getElementById("learnerCount").textContent =
                batch.learnerCount ?? 0;

        } catch (error) {

            console.error("Batch summary error:", error);
        }
    }


    // Fetch and display batch sessions
    async function loadBatchSessions() {

        try {

            const response = await fetch(
                SESSION_API + "?batchId=" + encodeURIComponent(batchId)
            );

            if (!response.ok) {
                throw new Error("Unable to load sessions");
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const sessions = data.sessions || [];

            sessionBody.innerHTML = "";

            if (sessions.length === 0) {

                sessionBody.innerHTML =
                    '<tr><td colspan="8">No sessions found for this batch.</td></tr>';

            } else {

                sessions.forEach(session => {

                    const row = document.createElement("tr");

                    row.innerHTML = `
                        <td>${escapeHTML(session.sessionId)}</td>
                        <td>${escapeHTML(session.sessionTitle || "-")}</td>
                        <td>${escapeHTML(session.sessionTopic || "-")}</td>
                        <td>${escapeHTML(session.sessionDate || "-")}</td>
                        <td>
                            ${escapeHTML(session.startTime || "-")} -
                            ${escapeHTML(session.endTime || "-")}
                        </td>
                        <td>
                            ${escapeHTML(session.attendanceCount)}/
                            ${escapeHTML(session.totalLearners)}
                            (${Number(session.attendancePercentage || 0).toFixed(1)}%)
                        </td>
                        <td>${escapeHTML(session.sessionStatus || "-")}</td>
                        <td>${escapeHTML(session.meetingType || "-")}</td>
                    `;

                    sessionBody.appendChild(row);
                });
            }

            // Calculate session summary
            const total = sessions.length;

            const completed = sessions.filter(
                session => session.sessionStatus === "Completed"
            ).length;

            const progress = total > 0
                ? Math.round((completed / total) * 100)
                : 0;

            document.getElementById("completedSessions").textContent =
                completed;

            document.getElementById("totalSessions").textContent =
                total;

            document.getElementById("classProgress").textContent =
                progress + "%";

        } catch (error) {

            console.error("Session loading failed:", error);

            sessionBody.innerHTML =
                '<tr><td colspan="8">Error loading sessions.</td></tr>';
        }
    }


    // Batch Actions dropdown
    const actionsBtn = document.getElementById("batchActionsBtn");
    const actionsMenu = document.getElementById("batchActionsMenu");

    actionsBtn.addEventListener("click", function () {
        actionsMenu.classList.toggle("show");
    });


    // Main tabs
    mainTabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            mainTabs.forEach(t => t.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            tab.classList.add("active");

            const selectedContent =
                document.getElementById(tab.dataset.tab);

            if (selectedContent) {
                selectedContent.classList.add("active");
            }
        });
    });


    // Learner status tabs
    learnerTabs.forEach(function (tab) {

        tab.addEventListener("click", function () {

            learnerTabs.forEach(t => t.classList.remove("active"));

            tab.classList.add("active");

            activeLearnerTab = tab.textContent.trim();

            applyLearnerFilters();
        });
    });


    // Learner search
    searchInput.addEventListener("input", applyLearnerFilters);


    // Load all batch details
    loadLearners();
    loadBatchSummary();
    loadBatchSessions();

});
