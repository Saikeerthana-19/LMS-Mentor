
const mentorId = 2;

const mentorURL =
    "http://localhost:8082/LMSPortal/MentorController?mentorId=" + mentorId;

let mentorData = {};
let isEditing = false;

const editableFields = [
    ["mentorName", "mentorName", "text"],
    ["username", "username", "text"],
    ["dateOfBirth", "dateOfBirth", "date"],
    ["gender", "gender", "text"],
    ["phone", "phone", "text"],
    ["alternateMobile", "alternateMobile", "text"],
    ["email", "email", "email"],
    ["permanentAddress", "permanentAddress", "text"],
    ["state", "state", "text"],
    ["city", "city", "text"],
    ["pincode", "pincode", "text"],
    ["residentialAddress", "residentialAddress", "text"],
    ["about", "about", "text"],
    ["timezone", "timezone", "text"]
];

function displayMentorDetails(mentor) {

    mentorData = mentor;

    const fields = {
        profileName: mentor.mentorName,
        topMentorName: mentor.mentorName,
        mentorName: mentor.mentorName,
        username: mentor.username,
        dateOfBirth: mentor.dateOfBirth,
        gender: mentor.gender,
        phone: mentor.phone,
        alternateMobile: mentor.alternateMobile,
        email: mentor.email,
        permanentAddress: mentor.permanentAddress,
        state: mentor.state,
        city: mentor.city,
        pincode: mentor.pincode,
        residentialAddress: mentor.residentialAddress,
        about: mentor.about,
        timezone: mentor.timezone
    };

    for (let id in fields) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = fields[id] || "-";
        }
    }
}

function loadMentorDetails() {

    fetch(mentorURL)
        .then(response => {
            if (!response.ok) {
                throw new Error("Unable to fetch mentor details");
            }
            return response.json();
        })
        .then(data => {
            console.log("Mentor Details:", data);
            displayMentorDetails(data);
        })
        .catch(error => console.error(error));
}


// Convert profile text into editable inputs
function enableEdit() {

    if (isEditing) return;

    isEditing = true;

    editableFields.forEach(field => {

        const [id, name, type] = field;
        const element = document.getElementById(id);

        if (!element) return;

        const input = document.createElement("input");

        input.type = type;
        input.name = name;
        input.id = id;

        let value = mentorData[name] || "";

        if (type === "date" && value.length > 10) {
            value = value.substring(0, 10);
        }

        input.value = value;
        input.className = "profile-edit-input";

        element.replaceWith(input);
    });

    document.querySelector(".edit-btn").textContent = "Save Changes";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "password-btn";
    cancelButton.id = "cancelEdit";

    document.querySelector(".settings-actions")
        .appendChild(cancelButton);

    cancelButton.addEventListener("click", () => {
        location.reload();
    });
}



  
function saveProfile() {

    const params = new URLSearchParams();

    params.append("mentorId", mentorId);

    editableFields.forEach(field => {

        const [id, name] = field;
        const input = document.getElementById(id);

        params.append(name, input ? input.value.trim() : "");
    });

    fetch("http://localhost:8082/LMSPortal/MentorController", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
    })

    .then(async response => {

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(result.message || "Profile update failed");
        }

        return result;
    })

    .then(result => {

        alert(result.message);

        location.reload();
    })

    .catch(error => {

        console.error("Update Error:", error);

        alert("Update failed: " + error.message);
    });
}



// Edit Profile button click
document.addEventListener("DOMContentLoaded", () => {

    loadMentorDetails();

    document.querySelector(".edit-btn").addEventListener("click", () => {

        if (!isEditing) {
            enableEdit();
        } else {
            saveProfile();
        }
    });

});
