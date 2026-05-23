const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");
const usernameError = document.getElementById("username-error");
const passwordError = document.getElementById("password-error");

loginBtn.addEventListener("click", function () {
    let isValid = true;

    // clear previous errors
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

    loginBtn.textContent = "Logging in...";
    loginBtn.disabled = true;

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
        // only admin and officer roles are allowed here
        if (data.role !== "admin" && data.role !== "officer") {
            loginBtn.textContent = "Login";
            loginBtn.disabled = false;
            loginError.textContent = "Access denied, this login is for admins and officers only";
            loginError.style.display = "block";
            return;
        }

        sessionStorage.setItem("token", data.access_token);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("role", data.role);

        window.location.href = "admin-dashboard.html";
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
