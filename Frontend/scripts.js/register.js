const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const birthDateInput = document.getElementById("birth-date");
const dlNumberInput = document.getElementById("dl-number");
const licenceStateInput = document.getElementById("licence-state");
const addressInput = document.getElementById("address");
const cityInput = document.getElementById("city");
const registerBtn = document.getElementById("register-btn");
const registerError = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");

// helper functions to keep the validation code cleaner
function showError(inputEl, errorEl, message) {
    inputEl.classList.add("error");
    errorEl.textContent = message;
}

function clearError(inputEl, errorEl) {
    inputEl.classList.remove("error");
    errorEl.textContent = "";
}

function isValidEmail(email) {
    return email.includes("@") && email.includes(".");
}

// birth date must be in the past
function isValidDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    return date < today;
}

registerBtn.addEventListener("click", function () {
    let isValid = true;

    registerError.style.display = "none";
    registerSuccess.style.display = "none";

    const usernameError = document.getElementById("username-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const confirmPasswordError = document.getElementById("confirm-password-error");
    const firstNameError = document.getElementById("first-name-error");
    const lastNameError = document.getElementById("last-name-error");
    const birthDateError = document.getElementById("birth-date-error");
    const dlNumberError = document.getElementById("dl-number-error");
    const licenceStateError = document.getElementById("licence-state-error");
    const addressError = document.getElementById("address-error");
    const cityError = document.getElementById("city-error");

    // clear all errors before revalidating
    clearError(usernameInput, usernameError);
    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);
    clearError(confirmPasswordInput, confirmPasswordError);
    clearError(firstNameInput, firstNameError);
    clearError(lastNameInput, lastNameError);
    clearError(birthDateInput, birthDateError);
    clearError(dlNumberInput, dlNumberError);
    clearError(licenceStateInput, licenceStateError);
    clearError(addressInput, addressError);
    clearError(cityInput, cityError);

    // username only needs to be non-empty, no min length
    // because some names like asian names can be very short
    if (usernameInput.value.trim() === "") {
        showError(usernameInput, usernameError, "Username is required");
        isValid = false;
    }

    if (emailInput.value.trim() === "") {
        showError(emailInput, emailError, "Email is required");
        isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
        showError(emailInput, emailError, "Please enter a valid email");
        isValid = false;
    }

    // password needs uppercase and number as well as min length
    if (passwordInput.value.trim() === "") {
        showError(passwordInput, passwordError, "Password is required");
        isValid = false;
    } else if (passwordInput.value.trim().length < 8) {
        showError(passwordInput, passwordError, "Password must be at least 8 characters");
        isValid = false;
    } else if (!/[A-Z]/.test(passwordInput.value)) {
        showError(passwordInput, passwordError, "Password must have at least one uppercase letter");
        isValid = false;
    } else if (!/[0-9]/.test(passwordInput.value)) {
        showError(passwordInput, passwordError, "Password must have at least one number");
        isValid = false;
    }

    if (confirmPasswordInput.value.trim() === "") {
        showError(confirmPasswordInput, confirmPasswordError, "Please confirm your password");
        isValid = false;
    } else if (confirmPasswordInput.value !== passwordInput.value) {
        showError(confirmPasswordInput, confirmPasswordError, "Passwords do not match");
        isValid = false;
    }

    if (firstNameInput.value.trim() === "") {
        showError(firstNameInput, firstNameError, "First name is required");
        isValid = false;
    }

    if (lastNameInput.value.trim() === "") {
        showError(lastNameInput, lastNameError, "Last name is required");
        isValid = false;
    }

    if (birthDateInput.value === "") {
        showError(birthDateInput, birthDateError, "Date of birth is required");
        isValid = false;
    } else if (!isValidDate(birthDateInput.value)) {
        showError(birthDateInput, birthDateError, "Please enter a valid date of birth");
        isValid = false;
    }

    if (dlNumberInput.value.trim() === "") {
        showError(dlNumberInput, dlNumberError, "Licence number is required");
        isValid = false;
    }

    if (licenceStateInput.value.trim() === "") {
        showError(licenceStateInput, licenceStateError, "Licence state is required");
        isValid = false;
    }

    if (addressInput.value.trim() === "") {
        showError(addressInput, addressError, "Address is required");
        isValid = false;
    }

    if (cityInput.value.trim() === "") {
        showError(cityInput, cityError, "City is required");
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    registerBtn.textContent = "Creating account...";
    registerBtn.disabled = true;

    // only sending account credentials to the API, personal info is stored locally
    const userData = {
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
    };

    fetch("http://localhost:8000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    })
    .then(function (response) {
        if (response.status === 400) {
            return response.json().then(function (data) {
                throw new Error(data.detail);
            });
        }
        if (!response.ok) {
            throw new Error("Something went wrong, try again");
        }
        return response.json();
    })
    .then(function (data) {
        registerBtn.textContent = "Create Account";
        registerBtn.disabled = false;
        registerSuccess.textContent = "Account created successfully! You can now login.";
        registerSuccess.style.display = "block";

        // clear all fields after successful registration
        usernameInput.value = "";
        emailInput.value = "";
        passwordInput.value = "";
        confirmPasswordInput.value = "";
        firstNameInput.value = "";
        lastNameInput.value = "";
        birthDateInput.value = "";
        dlNumberInput.value = "";
        licenceStateInput.value = "";
        addressInput.value = "";
        cityInput.value = "";

        // redirect to login after 2 seconds
        setTimeout(function () {
            window.location.href = "login.html";
        }, 2000);
    })
    .catch(function (error) {
        registerBtn.textContent = "Create Account";
        registerBtn.disabled = false;
        if (error.message === "Failed to fetch") {
            registerError.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            registerError.textContent = error.message;
        }
        registerError.style.display = "block";
    });
});

// real time validation - clear errors as user types
usernameInput.addEventListener("input", function () {
    const usernameError = document.getElementById("username-error");
    if (usernameInput.value.trim() !== "") {
        clearError(usernameInput, usernameError);
    }
});

emailInput.addEventListener("input", function () {
    const emailError = document.getElementById("email-error");
    if (isValidEmail(emailInput.value.trim())) {
        clearError(emailInput, emailError);
    }
});

passwordInput.addEventListener("input", function () {
    const passwordError = document.getElementById("password-error");
    if (passwordInput.value.trim().length >= 8 && /[A-Z]/.test(passwordInput.value) && /[0-9]/.test(passwordInput.value)) {
        clearError(passwordInput, passwordError);
    } else if (passwordInput.value.trim() !== "") {
        if (passwordInput.value.trim().length < 8) {
            showError(passwordInput, passwordError, "Password must be at least 8 characters");
        } else if (!/[A-Z]/.test(passwordInput.value)) {
            showError(passwordInput, passwordError, "Password must have at least one uppercase letter");
        } else if (!/[0-9]/.test(passwordInput.value)) {
            showError(passwordInput, passwordError, "Password must have at least one number");
        }
    }
});

confirmPasswordInput.addEventListener("input", function () {
    const confirmPasswordError = document.getElementById("confirm-password-error");
    if (confirmPasswordInput.value === passwordInput.value) {
        clearError(confirmPasswordInput, confirmPasswordError);
    } else if (confirmPasswordInput.value !== "") {
        showError(confirmPasswordInput, confirmPasswordError, "Passwords do not match");
    }
});
