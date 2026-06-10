
    const editBtn =
        document.getElementById("editBtn");

    const changePhotoBtn =
        document.getElementById(
            "changePhotoBtn"
        );

    const profileImage =
        document.getElementById(
            "profileImage"
        );

    const previewImage =
        document.getElementById(
            "previewImage"
        );

    // ALL editable fields
    const fields =
        document.querySelectorAll(
            'input[name="firstName"], input[name="lastName"], input[name="phone"], textarea[name="address"]'
        );

    let editMode = false;

    editBtn.addEventListener(
        "click",
        function () {

            // SAVE MODE
            if (editMode) {

                document
                    .querySelector(
                        ".info-card"
                    )
                    .submit();

                return;
            }

            // EDIT MODE
            fields.forEach(
                field => {
                    field.disabled = false;
                }
            );

            changePhotoBtn.disabled =
                false;

            editBtn.textContent =
                "Save";

            editMode = true;
        }
    );

    // Open image picker
    changePhotoBtn
        .addEventListener(
            "click",
            () => {
                profileImage.click();
            }
        );

    // Preview selected image
    profileImage
        .addEventListener(
            "change",
            function () {

                const file =
                    this.files[0];

                if (file) {

                    previewImage.src =
                        URL.createObjectURL(
                            file
                        );
                }
            }
        );

  // CHANGE PASSWORD LIVE VALIDATION

const passwordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const submitBtn =
    document.getElementById("passwordBtn");

// Rules
const lengthRule =
    document.getElementById("lengthRule");

const upperRule =
    document.getElementById("upperRule");

const lowerRule =
    document.getElementById("lowerRule");

const numberRule =
    document.getElementById("numberRule");

const specialRule =
    document.getElementById("specialRule");

const confirmPasswordError =
    document.getElementById("confirmPasswordError");


// Prevent JS crash if page element not found
if (
    passwordInput &&
    confirmPasswordInput &&
    submitBtn
) {

    // Disable button initially
    submitBtn.disabled = true;

    passwordInput.addEventListener(
        "input",
        validatePassword
    );

    confirmPasswordInput.addEventListener(
        "input",
        validatePassword
    );
}


function validatePassword() {

    const password =
        passwordInput.value.trim();

    const confirmPassword =
        confirmPasswordInput.value.trim();

    // Password Rules
    const hasLength =
        password.length >= 8;

    const hasUpper =
        /[A-Z]/.test(password);

    const hasLower =
        /[a-z]/.test(password);

    const hasNumber =
        /[0-9]/.test(password);

    const hasSpecial =
        /[!@#$%^&*(),.?":{}|<>]/.test(password);

    // Update UI Rules
    updateRule(
        lengthRule,
        hasLength
    );

    updateRule(
        upperRule,
        hasUpper
    );

    updateRule(
        lowerRule,
        hasLower
    );

    updateRule(
        numberRule,
        hasNumber
    );

    updateRule(
        specialRule,
        hasSpecial
    );

    // Confirm Password Check
    if (
        confirmPassword &&
        password !== confirmPassword
    ) {

        confirmPasswordError.innerText =
            "Passwords do not match";

    } else {

        confirmPasswordError.innerText =
            "";
    }

    // Final Validation
    const isPasswordValid =
        hasLength &&
        hasUpper &&
        hasLower &&
        hasNumber &&
        hasSpecial &&
        password === confirmPassword;

    submitBtn.disabled =
        !isPasswordValid;
}


function updateRule(
    element,
    isValid
) {

    const icon =
        element.querySelector(".icon");

    if (isValid) {

        element.classList.add(
            "valid"
        );

        element.classList.remove(
            "invalid"
        );

        icon.innerText = "✅";

    } else {

        element.classList.add(
            "invalid"
        );

        element.classList.remove(
            "valid"
        );

        icon.innerText = "❌";
    }
}

//password visiblity
document.getElementById("passwordShow").addEventListener("click",toggleVissiblity)
const currentPassword = document.getElementById("currentPassword")
const newPassword = document.getElementById("newPassword")
const confirmPassword = document.getElementById("confirmPassword")
function toggleVissiblity(){
    if(currentPassword.type === "password" && newPassword.type==="password" 
        &&confirmPassword.type === "password"){
            currentPassword.type ="text"
            newPassword.type = "text"
            confirmPassword.type ="text"
    }else{
         currentPassword.type ="password"
            newPassword.type = "password"
            confirmPassword.type ="password"
    } 
}