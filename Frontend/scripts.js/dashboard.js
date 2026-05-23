const token = sessionStorage.getItem("token");
const username = sessionStorage.getItem("username");

// check if JWT token has expired by reading the exp field from the payload
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp < Date.now() / 1000;
    } catch (e) {
        return true;
    }
}

// redirect to login if no token or token is expired
if (!token || isTokenExpired(token)) {
    sessionStorage.clear();
    window.location.href = "login.html";
}

const welcomeMsg = document.getElementById("welcome-msg");
const plateInput = document.getElementById("plate-input");
const searchBtn = document.getElementById("search-btn");
const plateError = document.getElementById("plate-error");
const vehicleInfo = document.getElementById("vehicle-info");
const noticesSection = document.getElementById("notices-section");
const noticesBody = document.getElementById("notices-body");
const noticesCount = document.getElementById("notices-count");
const loadingNotices = document.getElementById("loading-notices");
const apiErrorNotices = document.getElementById("api-error-notices");
const noNoticesMsg = document.getElementById("no-notices-msg");
const logoutBtn = document.getElementById("logout-btn");

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

hamburger.addEventListener("click", function () {
    navMenu.classList.toggle("open");
});

welcomeMsg.textContent = "Welcome, " + username + "!";

logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    window.location.href = "login.html";
});

searchBtn.addEventListener("click", function () {
    const plate = plateInput.value.trim();

    // reset everything before new search
    plateError.textContent = "";
    plateInput.classList.remove("error");
    vehicleInfo.style.display = "none";
    noticesSection.style.display = "none";
    apiErrorNotices.style.display = "none";
    noNoticesMsg.style.display = "none";

    if (plate === "") {
        plateError.textContent = "Please enter a licence plate number";
        plateInput.classList.add("error");
        return;
    }

    searchBtn.textContent = "Searching...";
    searchBtn.disabled = true;
    loadingNotices.style.display = "block";
    noticesSection.style.display = "block";

    // first get vehicle info by plate number
    fetch("http://localhost:8000/vehicles/plate/" + plate, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(function (response) {
        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = "login.html";
            throw new Error("Session expired");
        }
        if (response.status === 404) {
            throw new Error("Vehicle not found, please check the plate number");
        }
        if (!response.ok) {
            throw new Error("Something went wrong, try again");
        }
        return response.json();
    })
    .then(function (vehicleData) {
        document.getElementById("v-make").textContent = vehicleData.vehicle_info.make;
        document.getElementById("v-year").textContent = vehicleData.vehicle_info.year;
        document.getElementById("v-colour").textContent = vehicleData.vehicle_info.colour;
        document.getElementById("v-plate").textContent = vehicleData.vehicle_info.plate;
        vehicleInfo.style.display = "block";

        // save driver_id so profile page can use it without asking again
        const driverId = vehicleData.owner.driver_id;
        sessionStorage.setItem("driver_id", driverId);

        // then get all violations for this driver
        return fetch("http://localhost:8000/drivers/" + driverId + "/violations", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Could not load violations");
        }
        return response.json();
    })
    .then(function (data) {
        searchBtn.textContent = "Search";
        searchBtn.disabled = false;
        loadingNotices.style.display = "none";

        noticesBody.innerHTML = "";

        if (data.violations.length === 0) {
            noticesCount.textContent = "";
            noNoticesMsg.style.display = "block";
            return;
        }

        noticesCount.textContent = "Total notices: " + data.total_violations;

        // build table rows from the violations array
        for (let i = 0; i < data.violations.length; i++) {
            const notice = data.violations[i];
            const tr = document.createElement("tr");

            const tdId = document.createElement("td");
            tdId.textContent = notice.notice_id;

            const tdDate = document.createElement("td");
            tdDate.textContent = notice.violation_date;

            const tdLocation = document.createElement("td");
            tdLocation.textContent = notice.location;

            const tdDesc = document.createElement("td");
            tdDesc.textContent = notice.description;

            const tdOfficer = document.createElement("td");
            tdOfficer.textContent = notice.officer;

            // show Pending if no action has been taken yet
            const tdAction = document.createElement("td");
            tdAction.textContent = notice.action_taken ? notice.action_taken : "Pending";

            tr.appendChild(tdId);
            tr.appendChild(tdDate);
            tr.appendChild(tdLocation);
            tr.appendChild(tdDesc);
            tr.appendChild(tdOfficer);
            tr.appendChild(tdAction);

            noticesBody.appendChild(tr);
        }
    })
    .catch(function (error) {
        searchBtn.textContent = "Search";
        searchBtn.disabled = false;
        loadingNotices.style.display = "none";

        if (error.message === "Failed to fetch") {
            apiErrorNotices.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            apiErrorNotices.textContent = error.message;
        }
        apiErrorNotices.style.display = "block";
        noticesSection.style.display = "block";
    });
});

plateInput.addEventListener("input", function () {
    if (plateInput.value.trim() !== "") {
        plateError.textContent = "";
        plateInput.classList.remove("error");
    }
});


