const token = sessionStorage.getItem("token");
const username = sessionStorage.getItem("username");
const role = sessionStorage.getItem("role");

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp < Date.now() / 1000;
    } catch (e) {
        return true;
    }
}

// redirect if not logged in or not an admin/officer
if (!token || isTokenExpired(token) || (role !== "admin" && role !== "officer")) {
    sessionStorage.clear();
    window.location.href = "admin-login.html";
}

document.getElementById("admin-role").textContent = role;

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

if (hamburger) {
    hamburger.addEventListener("click", function () {
        navMenu.classList.toggle("open");
    });
}

const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    window.location.href = "admin-login.html";
});

const tabNotices = document.getElementById("tab-notices");
const tabCreate = document.getElementById("tab-create");
const tabSearch = document.getElementById("tab-search");
const tabUpdate = document.getElementById("tab-update");

const panelNotices = document.getElementById("panel-notices");
const panelCreate = document.getElementById("panel-create");
const panelSearch = document.getElementById("panel-search");
const panelUpdate = document.getElementById("panel-update");

// hide all panels and show only the selected one
function showTab(activeTab, activePanel) {
    const allTabs = [tabNotices, tabCreate, tabSearch, tabUpdate];
    const allPanels = [panelNotices, panelCreate, panelSearch, panelUpdate];

    for (let i = 0; i < allTabs.length; i++) {
        allTabs[i].classList.remove("active");
        allPanels[i].style.display = "none";
    }

    activeTab.classList.add("active");
    activePanel.style.display = "block";
}

tabNotices.addEventListener("click", function () {
    showTab(tabNotices, panelNotices);
});

tabCreate.addEventListener("click", function () {
    showTab(tabCreate, panelCreate);
});

tabSearch.addEventListener("click", function () {
    showTab(tabSearch, panelSearch);
});

tabUpdate.addEventListener("click", function () {
    showTab(tabUpdate, panelUpdate);
});

// store the notice id that is about to be deleted
let noticeToDelete = null;

const confirmOverlay = document.getElementById("confirm-overlay");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

confirmNo.addEventListener("click", function () {
    confirmOverlay.style.display = "none";
    noticeToDelete = null;
});

confirmYes.addEventListener("click", function () {
    if (!noticeToDelete) return;

    fetch("http://localhost:8000/notices/" + noticeToDelete, {
        method: "DELETE",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not delete notice");
        }
        return response.json();
    })
    .then(function () {
        confirmOverlay.style.display = "none";
        noticeToDelete = null;
        // reload the table after deletion
        loadNotices();
    })
    .catch(function (error) {
        confirmOverlay.style.display = "none";
        noticeToDelete = null;
        alert(error.message);
    });
});

function loadNotices() {
    const loadingNotices = document.getElementById("loading-notices");
    const noticesTable = document.getElementById("notices-table");
    const noticesBody = document.getElementById("notices-body");
    const noticesApiError = document.getElementById("notices-api-error");

    loadingNotices.style.display = "block";
    noticesTable.style.display = "none";
    noticesApiError.style.display = "none";

    fetch("http://localhost:8000/notices/recent", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function (response) {
        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = "admin-login.html";
            throw new Error("Session expired");
        }
        if (!response.ok) {
            throw new Error("Could not load notices");
        }
        return response.json();
    })
    .then(function (data) {
        loadingNotices.style.display = "none";
        noticesTable.style.display = "table";

        // update stat cards at the top
        document.getElementById("total-notices").textContent = data.count;
        document.getElementById("total-drivers").textContent = data.count;

        noticesBody.innerHTML = "";

        for (let i = 0; i < data.notices.length; i++) {
            const notice = data.notices[i];
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = notice.notice_id;

            const tdDriver = document.createElement("td");
            tdDriver.textContent = notice.driver_name + " " + notice.driver_surname;

            const tdVehicle = document.createElement("td");
            tdVehicle.textContent = notice.car_make + " " + notice.car_year;

            const tdDate = document.createElement("td");
            tdDate.textContent = notice.violation_date;

            const tdLocation = document.createElement("td");
            tdLocation.textContent = notice.location;

            const tdOfficer = document.createElement("td");
            tdOfficer.textContent = notice.issuing_officer;

            // delete button opens confirmation dialog before actually deleting
            const tdAction = document.createElement("td");
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.classList.add("delete-btn");
            deleteBtn.onclick = function () {
                noticeToDelete = notice.notice_id;
                confirmOverlay.style.display = "flex";
            };
            tdAction.appendChild(deleteBtn);

            tr.appendChild(tdId);
            tr.appendChild(tdDriver);
            tr.appendChild(tdVehicle);
            tr.appendChild(tdDate);
            tr.appendChild(tdLocation);
            tr.appendChild(tdOfficer);
            tr.appendChild(tdAction);

            noticesBody.appendChild(tr);
        }
    })
    .catch(function (error) {
        loadingNotices.style.display = "none";
        if (error.message === "Failed to fetch") {
            noticesApiError.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            noticesApiError.textContent = error.message;
        }
        noticesApiError.style.display = "block";
    });
}

// load notices when page first opens
loadNotices();

const createBtn = document.getElementById("create-btn");

createBtn.addEventListener("click", function () {
    let isValid = true;

    const fields = [
        { input: document.getElementById("c-vehicle-id"), error: document.getElementById("c-vehicle-id-error"), msg: "Vehicle ID is required" },
        { input: document.getElementById("c-officer-id"), error: document.getElementById("c-officer-id-error"), msg: "Officer ID is required" },
        { input: document.getElementById("c-date"), error: document.getElementById("c-date-error"), msg: "Date is required" },
        { input: document.getElementById("c-time"), error: document.getElementById("c-time-error"), msg: "Time is required" },
        { input: document.getElementById("c-district"), error: document.getElementById("c-district-error"), msg: "District is required" },
        { input: document.getElementById("c-detachment"), error: document.getElementById("c-detachment-error"), msg: "Detachment is required" },
        { input: document.getElementById("c-location"), error: document.getElementById("c-location-error"), msg: "Location is required" },
        { input: document.getElementById("c-description"), error: document.getElementById("c-description-error"), msg: "Description is required" }
    ];

    for (let i = 0; i < fields.length; i++) {
        fields[i].error.textContent = "";
        fields[i].input.classList.remove("error");
    }

    for (let i = 0; i < fields.length; i++) {
        if (fields[i].input.value.trim() === "") {
            fields[i].error.textContent = fields[i].msg;
            fields[i].input.classList.add("error");
            isValid = false;
        }
    }

    if (!isValid) return;

    const createSuccess = document.getElementById("create-success");
    const createError = document.getElementById("create-error");

    createSuccess.style.display = "none";
    createError.style.display = "none";

    createBtn.textContent = "Creating...";
    createBtn.disabled = true;

    const noticeData = {
        vehicle_id: parseInt(document.getElementById("c-vehicle-id").value),
        officer_id: parseInt(document.getElementById("c-officer-id").value),
        violation_date: document.getElementById("c-date").value,
        violation_time: document.getElementById("c-time").value,
        district: document.getElementById("c-district").value.trim(),
        detachment: document.getElementById("c-detachment").value.trim(),
        location: document.getElementById("c-location").value.trim(),
        violation_description: document.getElementById("c-description").value.trim()
    };

    fetch("http://localhost:8000/notices", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(noticeData)
    })
    .then(function (response) {
        if (response.status === 404) {
            return response.json().then(function (data) {
                throw new Error(data.detail);
            });
        }
        if (!response.ok) {
            throw new Error("Could not create notice, try again");
        }
        return response.json();
    })
    .then(function (data) {
        createBtn.textContent = "Create Notice";
        createBtn.disabled = false;
        createSuccess.textContent = "Notice created successfully! Notice ID: " + data.notice_id;
        createSuccess.style.display = "block";

        // clear form after successful creation
        document.getElementById("c-vehicle-id").value = "";
        document.getElementById("c-officer-id").value = "";
        document.getElementById("c-date").value = "";
        document.getElementById("c-time").value = "";
        document.getElementById("c-district").value = "";
        document.getElementById("c-detachment").value = "";
        document.getElementById("c-location").value = "";
        document.getElementById("c-description").value = "";

        loadNotices();
    })
    .catch(function (error) {
        createBtn.textContent = "Create Notice";
        createBtn.disabled = false;
        if (error.message === "Failed to fetch") {
            createError.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            createError.textContent = error.message;
        }
        createError.style.display = "block";
    });
});

const searchBtn = document.getElementById("search-btn");

searchBtn.addEventListener("click", function () {
    const plate = document.getElementById("search-plate").value.trim();
    const plateError = document.getElementById("search-plate-error");
    const searchResult = document.getElementById("search-result");
    const searchApiError = document.getElementById("search-api-error");

    plateError.textContent = "";
    searchResult.style.display = "none";
    searchApiError.style.display = "none";

    if (plate === "") {
        plateError.textContent = "Please enter a licence plate number";
        document.getElementById("search-plate").classList.add("error");
        return;
    }

    searchBtn.textContent = "Searching...";
    searchBtn.disabled = true;

    fetch("http://localhost:8000/vehicles/plate/" + plate, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function (response) {
        if (response.status === 404) {
            throw new Error("Vehicle not found");
        }
        if (!response.ok) {
            throw new Error("Something went wrong, try again");
        }
        return response.json();
    })
    .then(function (data) {
        searchBtn.textContent = "Search";
        searchBtn.disabled = false;

        document.getElementById("s-make").textContent = data.vehicle_info.make;
        document.getElementById("s-year").textContent = data.vehicle_info.year;
        document.getElementById("s-colour").textContent = data.vehicle_info.colour;
        document.getElementById("s-plate").textContent = data.vehicle_info.plate;
        document.getElementById("s-owner").textContent = data.owner.name;
        document.getElementById("s-dl").textContent = data.owner.dl_number;

        const searchNoticesBody = document.getElementById("search-notices-body");
        searchNoticesBody.innerHTML = "";

        if (data.notices.length === 0) {
            document.getElementById("s-no-notices").style.display = "block";
            document.getElementById("s-notices-count").textContent = "";
        } else {
            document.getElementById("s-no-notices").style.display = "none";
            document.getElementById("s-notices-count").textContent = "Total notices: " + data.total_notices;

            for (let i = 0; i < data.notices.length; i++) {
                const notice = data.notices[i];
                const tr = document.createElement("tr");

                const tdId = document.createElement("td");
                tdId.textContent = notice.notice_id;

                const tdDate = document.createElement("td");
                tdDate.textContent = notice.date;

                const tdLocation = document.createElement("td");
                tdLocation.textContent = notice.location;

                const tdDesc = document.createElement("td");
                tdDesc.textContent = notice.description;

                tr.appendChild(tdId);
                tr.appendChild(tdDate);
                tr.appendChild(tdLocation);
                tr.appendChild(tdDesc);

                searchNoticesBody.appendChild(tr);
            }
        }

        searchResult.style.display = "block";
    })
    .catch(function (error) {
        searchBtn.textContent = "Search";
        searchBtn.disabled = false;
        if (error.message === "Failed to fetch") {
            searchApiError.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            searchApiError.textContent = error.message;
        }
        searchApiError.style.display = "block";
    });
});

const updateBtn = document.getElementById("update-btn");

updateBtn.addEventListener("click", function () {
    const noticeId = document.getElementById("u-notice-id").value.trim();
    const location = document.getElementById("u-location").value.trim();
    const noticeIdError = document.getElementById("u-notice-id-error");
    const locationError = document.getElementById("u-location-error");
    const updateSuccess = document.getElementById("update-success");
    const updateError = document.getElementById("update-error");

    noticeIdError.textContent = "";
    locationError.textContent = "";
    updateSuccess.style.display = "none";
    updateError.style.display = "none";

    document.getElementById("u-notice-id").classList.remove("error");
    document.getElementById("u-location").classList.remove("error");

    let isValid = true;

    if (noticeId === "") {
        noticeIdError.textContent = "Notice ID is required";
        document.getElementById("u-notice-id").classList.add("error");
        isValid = false;
    }

    if (location === "") {
        locationError.textContent = "Location is required";
        document.getElementById("u-location").classList.add("error");
        isValid = false;
    }

    if (!isValid) return;

    updateBtn.textContent = "Updating...";
    updateBtn.disabled = true;

    fetch("http://localhost:8000/notices/" + noticeId + "/location", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ location: location })
    })
    .then(function (response) {
        if (response.status === 404) {
            throw new Error("Notice not found");
        }
        if (!response.ok) {
            throw new Error("Could not update location, try again");
        }
        return response.json();
    })
    .then(function () {
        updateBtn.textContent = "Update Location";
        updateBtn.disabled = false;
        updateSuccess.textContent = "Location updated successfully!";
        updateSuccess.style.display = "block";

        document.getElementById("u-notice-id").value = "";
        document.getElementById("u-location").value = "";

        // hide success message after 3 seconds
        setTimeout(function () {
            updateSuccess.style.display = "none";
        }, 3000);

        loadNotices();
    })
    .catch(function (error) {
        updateBtn.textContent = "Update Location";
        updateBtn.disabled = false;
        if (error.message === "Failed to fetch") {
            updateError.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            updateError.textContent = error.message;
        }
        updateError.style.display = "block";
    });
});
