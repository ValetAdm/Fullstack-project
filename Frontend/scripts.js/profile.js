const token = sessionStorage.getItem("token");
const username = sessionStorage.getItem("username");
const role = sessionStorage.getItem("role");
const driverId = sessionStorage.getItem("driver_id");

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp < Date.now() / 1000;
    } catch (e) {
        return true;
    }
}

if (!token || isTokenExpired(token)) {
    sessionStorage.clear();
    window.location.href = "login.html";
}

const logoutBtn = document.getElementById("logout-btn");
const loadingProfile = document.getElementById("loading-profile");
const profileForm = document.getElementById("profile-form");
const profileSuccess = document.getElementById("profile-success");
const profileError = document.getElementById("profile-error");
const saveBtn = document.getElementById("save-btn");

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

hamburger.addEventListener("click", function () {
    navMenu.classList.toggle("open");
});

logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("driver_id");
    window.location.href = "login.html";
});

document.getElementById("p-username").textContent = username;
document.getElementById("p-role").textContent = role;

// driver_id is set when user searches for their vehicle on the dashboard
// if they come here directly without searching first, we ask them to go back
if (!driverId) {
    loadingProfile.textContent = "Please search for your vehicle first on the Citations page.";
} else {
    fetch("http://localhost:8000/drivers/" + driverId + "/violations", {
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
        if (!response.ok) {
            throw new Error("Could not load profile");
        }
        return response.json();
    })
    .then(function (data) {
        loadingProfile.style.display = "none";
        profileForm.style.display = "block";

        // name comes back as "First Last" so we split it
        const nameParts = data.name.split(" ");
        document.getElementById("first-name").value = nameParts[0] || "";
        document.getElementById("last-name").value = nameParts[1] || "";
        document.getElementById("dl-number").value = data.dl_number || "";
    })
    .catch(function (error) {
        loadingProfile.style.display = "none";
        profileError.textContent = error.message;
        profileError.style.display = "block";
    });
}

saveBtn.addEventListener("click", function () {
    let isValid = true;

    profileSuccess.style.display = "none";
    profileError.style.display = "none";

    const firstNameError = document.getElementById("first-name-error");
    const lastNameError = document.getElementById("last-name-error");
    const dlNumberError = document.getElementById("dl-number-error");
    const addressError = document.getElementById("address-error");
    const cityError = document.getElementById("city-error");

    firstNameError.textContent = "";
    lastNameError.textContent = "";
    dlNumberError.textContent = "";
    addressError.textContent = "";
    cityError.textContent = "";

    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const dlNumberInput = document.getElementById("dl-number");
    const addressInput = document.getElementById("address");
    const cityInput = document.getElementById("city");

    firstNameInput.classList.remove("error");
    lastNameInput.classList.remove("error");
    dlNumberInput.classList.remove("error");
    addressInput.classList.remove("error");
    cityInput.classList.remove("error");

    if (firstNameInput.value.trim() === "") {
        firstNameError.textContent = "First name is required";
        firstNameInput.classList.add("error");
        isValid = false;
    }

    if (lastNameInput.value.trim() === "") {
        lastNameError.textContent = "Last name is required";
        lastNameInput.classList.add("error");
        isValid = false;
    }

    if (dlNumberInput.value.trim() === "") {
        dlNumberError.textContent = "Licence number is required";
        dlNumberInput.classList.add("error");
        isValid = false;
    }

    if (addressInput.value.trim() === "") {
        addressError.textContent = "Address is required";
        addressInput.classList.add("error");
        isValid = false;
    }

    if (cityInput.value.trim() === "") {
        cityError.textContent = "City is required";
        cityInput.classList.add("error");
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    // API requires all driver fields even if some are empty
    const updatedDriver = {
        first_name: firstNameInput.value.trim(),
        last_name: lastNameInput.value.trim(),
        dl_number: dlNumberInput.value.trim(),
        address: addressInput.value.trim(),
        city: cityInput.value.trim(),
        state: document.getElementById("state").value.trim(),
        zip_code: document.getElementById("zip-code").value.trim(),
        licence_state: document.getElementById("licence-state").value.trim(),
        birth_date: document.getElementById("birth-date").value || null,
        height: null,
        weight: null,
        eye_colour: null
    };

    fetch("http://localhost:8000/drivers/" + driverId, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify(updatedDriver)
    })
    .then(function (response) {
        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = "login.html";
            throw new Error("Session expired");
        }
        if (response.status === 404) {
            throw new Error("Driver not found");
        }
        if (!response.ok) {
            throw new Error("Could not save changes, try again");
        }
        return response.json();
    })
    .then(function (data) {
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = false;
        profileSuccess.textContent = "Profile updated successfully!";
        profileSuccess.style.display = "block";

        // hide success message after 3 seconds
        setTimeout(function () {
            profileSuccess.style.display = "none";
        }, 3000);
    })
    .catch(function (error) {
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = false;
        if (error.message === "Failed to fetch") {
            profileError.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            profileError.textContent = error.message;
        }
        profileError.style.display = "block";
    });
});
