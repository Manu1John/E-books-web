
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
