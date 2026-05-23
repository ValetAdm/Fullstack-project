const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const usernameError = document.getElementById("username-error");
const passwordError = document.getElementById("password-error");

loginBtn.addEventListener("click", function () {
    let isValid = true;

    // clear any previous errors before checking again
    usernameError.textContent = "";
    passwordError.textContent = "";
    loginError.style.display = "none";

    usernameInput.classList.remove("error");
    passwordInput.classList.remove("error");

    if (usernameInput.value.trim() === "") {
        usernameError.textContent = "Username is required";
        usernameInput.classList.add("error");
        isValid = false;
    }

    // minimum 8 characters required for password
    if (passwordInput.value.trim() === "") {
        passwordError.textContent = "Password is required";
        passwordInput.classList.add("error");
        isValid = false;
    } else if (passwordInput.value.trim().length < 8) {
        passwordError.textContent = "Password must be at least 8 characters";
        passwordInput.classList.add("error");
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // show loading state so user knows something is happening
    loginBtn.textContent = "Logging in...";
    loginBtn.disabled = true;

    // API expects form data not JSON for OAuth2
    const formData = new FormData();
    formData.append("username", usernameInput.value.trim());
    formData.append("password", passwordInput.value.trim());

    fetch("http://localhost:8000/token", {
        method: "POST",
        body: formData
    })
    .then(function (response) {
        if (response.status === 401) {
            throw new Error("Wrong username or password");
        }
        if (!response.ok) {
            throw new Error("Something went wrong, try again");
        }
        return response.json();
    })
    .then(function (data) {
        // this page is for drivers only, admins have their own login
        if (data.role !== "user") {
            loginBtn.textContent = "Login";
            loginBtn.disabled = false;
            loginError.textContent = "This login is for drivers only";
            loginError.style.display = "block";
            return;
        }

        // save token and user info for use on other pages
        sessionStorage.setItem("token", data.access_token);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("role", data.role);

        window.location.href = "dashboard.html";
    })
    .catch(function (error) {
        loginBtn.textContent = "Login";
        loginBtn.disabled = false;
        if (error.message === "Failed to fetch") {
            loginError.textContent = "Cannot connect to server, make sure the API is running";
        } else {
            loginError.textContent = error.message;
        }
        loginError.style.display = "block";
    });
});

// remove error as soon as user starts typing
usernameInput.addEventListener("input", function () {
    if (usernameInput.value.trim() !== "") {
        usernameError.textContent = "";
        usernameInput.classList.remove("error");
    }
});

passwordInput.addEventListener("input", function () {
    if (passwordInput.value.trim().length >= 8) {
        passwordError.textContent = "";
        passwordInput.classList.remove("error");
    } else if (passwordInput.value.trim() !== "") {
        passwordError.textContent = "Password must be at least 8 characters";
        passwordInput.classList.add("error");
    }
});
