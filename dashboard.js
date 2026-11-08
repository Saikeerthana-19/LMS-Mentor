
document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "http://localhost:8082/LMSPortal/HomeController";

    const dateInput = document.getElementById("sessionDate");
    const calendarPicker = document.getElementById("calendarPicker");

    const previousBtn = document.getElementById("previousDate");
    const nextBtn = document.getElementById("nextDate");
    const refreshBtn = document.getElementById("refreshSessions");
    const calendarBtn = document.getElementById("viewCalendar");

    const sessionCount = document.querySelector(".session-count");
    const tableBody = document.querySelector(".session-table tbody");

    function parseDate(value) {
        const parts = value.split("-").map(Number);
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    function formatDate(date) {
        return String(date.getDate()).padStart(2, "0") + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            date.getFullYear();
    }

    function formatCalendarDate(date) {
        return date.getFullYear() + "-" +
            String(date.getMonth() + 1).padStart(2, "0") + "-" +
            String(date.getDate()).padStart(2, "0");
    }

    function formatTime(time) {
        if (!time) return "-";

        let parts = time.split(":");
        let hour = Number(parts[0]);
        let minute = parts[1];

        let period = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;

        return String(hour).padStart(2, "0") + ":" +
            minute + period;
    }

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

    function showMessage(message) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
        sessionCount.textContent = "0";
    }

    // Display database sessions
    function displaySessions(sessions) {

        tableBody.innerHTML = "";

        if (!sessions || sessions.length === 0) {
            showMessage("No data");
            return;
        }

        sessions.forEach(function (session, index) {

            const startTime = formatTime(session.startTime);
            const endTime = formatTime(session.endTime);

            const batch = escapeHTML(session.batchName);
            const course = escapeHTML(session.courseName);
            const mentor = escapeHTML(session.mentorName);
            const title = escapeHTML(session.sessionTitle);
            const topic = escapeHTML(session.sessionTopic || "-");
            const meetingType = escapeHTML(session.meetingType || "LIVE MEETING");

            const attendance = session.attendanceCount;
            const total = session.totalLearners;

            const percentage =
                Number(session.attendancePercentage).toFixed(2);

            const status = session.sessionStatus || "Scheduled";

            const signedIn = status === "Ongoing" ||
                             status === "Completed";

            const statusClass = signedIn ? "completed" : "not-signed";

            const statusText = escapeHTML(status.toUpperCase());

            const recurringLabel = session.recurring
                ? `<span class="recurring">↻ RECURRING</span>`
                : "";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td class="serial">
                    ${String(index + 1).padStart(2, "0")}
                </td>

                <td class="session-details">

                    <strong>${startTime} to ${endTime}</strong>

                    <div class="session-labels">
                        ${recurringLabel}
                        <span class="live-label">${meetingType}</span>
                    </div>

                    <p>${batch} | ${course}</p>

                    <small>
                        ${mentor} (${batch} | ${course})
                    </small>

                </td>

                <td class="attendance">
                    <span>♧ ${attendance}/${total}</span>
                    <small>${percentage}%</small>
                </td>

                <td>
                    <span class="status ${statusClass}">
                        ${statusText}
                    </span>
                </td>

                <td class="topics">${topic}</td>

                <td class="actions">

                    <button class="sign-in-btn"
                            type="button"
                            data-session-id="${session.sessionId}"
                            ${signedIn ? "disabled" : ""}>
                        ${signedIn ? "Signed In ✓" : "Sign In →"}
                    </button>

                    <button class="more-btn"
                            type="button"
                            data-session-id="${session.sessionId}">
                        •••
                    </button>

                </td>
            `;

            tableBody.appendChild(row);
        });

        sessionCount.textContent = sessions.length;
    }

    // Fetch sessions from Java Servlet
    async function loadSessions() {

        const selectedDate = parseDate(dateInput.value);
        const day = selectedDate.getDay();

        calendarPicker.value = formatCalendarDate(selectedDate);

        if (day === 0 || day === 6) {
            showMessage("No data");
            return;
        }

        showMessage("Loading sessions...");

        const apiDate = formatCalendarDate(selectedDate);

        try {

            const response = await fetch(
                API_URL + "?date=" + encodeURIComponent(apiDate)
            );

            if (!response.ok) {
                throw new Error("Server returned error: " + response.status);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            displaySessions(data.sessions);

        } catch (error) {

            console.error("Session loading failed:", error);

            showMessage("Unable to load sessions. Check Tomcat connection.");
        }
    }

    // SIGN IN BUTTON FUNCTIONALITY
    tableBody.addEventListener("click", async function (event) {

        const button = event.target.closest(".sign-in-btn");

        if (!button || button.disabled) {
            return;
        }

        const sessionId = button.dataset.sessionId;

        if (!sessionId) {
            alert("Session ID is missing!");
            return;
        }

        button.disabled = true;
        button.textContent = "Signing In...";

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },

                body: new URLSearchParams({
                    action: "signin",
                    sessionId: sessionId
                })

            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Sign In failed");
            }

            alert(result.message);

            // Reload sessions to display updated status
            await loadSessions();

        } catch (error) {

            console.error("Sign In failed:", error);

            alert(error.message);

            button.disabled = false;
            button.textContent = "Sign In →";
        }

    });

    // Previous date
    previousBtn.addEventListener("click", function () {

        const date = parseDate(dateInput.value);
        date.setDate(date.getDate() - 1);

        dateInput.value = formatDate(date);

        loadSessions();
    });

    // Next date
    nextBtn.addEventListener("click", function () {

        const date = parseDate(dateInput.value);
        date.setDate(date.getDate() + 1);

        dateInput.value = formatDate(date);

        loadSessions();
    });

    // Refresh
    refreshBtn.addEventListener("click", loadSessions);

    // Open calendar
    calendarBtn.addEventListener("click", function () {

        if (typeof calendarPicker.showPicker === "function") {
            calendarPicker.showPicker();
        } else {
            calendarPicker.click();
        }
    });

    // Calendar date selection
    calendarPicker.addEventListener("change", function () {

        if (!calendarPicker.value) return;

        const selectedDate =
            new Date(calendarPicker.value + "T00:00:00");

        dateInput.value = formatDate(selectedDate);

        loadSessions();
    });

    // Initial loading
    loadSessions();

});
const learningMenu = document.querySelector(".menu-group > a");
const menuGroup = document.querySelector(".menu-group");

learningMenu.addEventListener("click", function(event) {
    event.preventDefault();
    menuGroup.classList.toggle("open");
});