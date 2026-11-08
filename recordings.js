
const learningMenu = document.querySelector(".menu-group > a");
const menuGroup = document.querySelector(".menu-group");

learningMenu.addEventListener("click", function(event) {
    event.preventDefault();
    menuGroup.classList.toggle("open");
});

// Sample recordings using external video URLs
const recordings = [
    {
        id: 1,
        title: "Java Programming - Introduction",
        date: "08-Nov-2026",
        batch: "FSD Morning Batch",
        instructor: "Vasu Kumar",
        status: "PUBLISHED",
        video: "https://pnb-freetoolsforweb.s3.us-east-2.amazonaws.com/samples/videos/mp4/sample-video-480x270-1mb.mp4"
    },
    {
        id: 2,
        title: "Python Programming - Basics",
        date: "08-Nov-2026",
        batch: "FSD Evening Batch",
        instructor: "Vasu Kumar",
        status: "PUBLISHED",
        video: "https://pnb-freetoolsforweb.s3.us-east-2.amazonaws.com/samples/videos/mp4/sample-video-1280x720-av1.mp4"
    },
    {
        id: 3,
        title: "HTML and CSS - Introduction",
        date: "07-Nov-2026",
        batch: "Python Morning Batch",
        instructor: "Mentor One",
        status: "PUBLISHED",
        video: "https://pnb-freetoolsforweb.s3.us-east-2.amazonaws.com/samples/videos/mp4/sample-video-640x360-2mb.mp4"
    }
];

// Display recordings
function displayRecordings(data) {

    const tableBody = document.getElementById("recordingTableBody");

    tableBody.innerHTML = "";

    data.forEach(function(recording, index) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <input type="checkbox" class="record-check"
                       value="${recording.id}">
            </td>

            <td>${String(index + 1).padStart(2, "0")}</td>

            <td>
                <div style="display:flex; align-items:center; gap:10px;">

                    <video width="60" height="36"
                           controls preload="metadata"
                           style="object-fit:cover;">
                        <source src="${recording.video}" type="video/mp4">
                    </video>

                    <div>
                        <div>${recording.title}</div>
                        <small style="color:#999;">
                            ${recording.date}
                        </small>
                    </div>

                </div>
            </td>

            <td>${recording.batch}</td>

            <td>${recording.instructor}</td>

            <td>
                <span style="
                    background:#e5f8ef;
                    color:#159765;
                    padding:4px 8px;
                    border-radius:4px;
                    font-size:10px;">
                    ${recording.status}
                </span>
            </td>

            <td>
                <a href="${recording.video}"
                   target="_blank"
                   title="Open recording"
                   style="text-decoration:none;">
                    ⋮
                </a>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Search recordings
document.getElementById("recordingSearch")
    .addEventListener("input", function() {

        const value = this.value.toLowerCase();

        const filtered = recordings.filter(r =>
            r.title.toLowerCase().includes(value) ||
            r.batch.toLowerCase().includes(value) ||
            r.instructor.toLowerCase().includes(value)
        );

        displayRecordings(filtered);
    });

// Select all
document.getElementById("selectAll")
    .addEventListener("change", function() {

        document.querySelectorAll(".record-check").forEach(check => {
            check.checked = this.checked;
        });
    });

// Initial display
displayRecordings(recordings);
