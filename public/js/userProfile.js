
    const editBtn =
        document.getElementById(
            "editBtn"
        );

    const fields =
        document.querySelectorAll(
            ".info-card input[name], .info-card textarea"
        );

    const changePhotoBtn =
        document.getElementById(
            "changePhotoBtn"
        );

    const imageInput =
        document.getElementById(
            "profileImage"
        );

    const form =
        document.querySelector(
            ".info-card"
        );

    let editing = false;

    editBtn.addEventListener(
        "click",
        () => {

            if (!editing) {

                fields.forEach(
                    field => {
                        field.disabled = false;
                    }
                );

                changePhotoBtn.disabled =
                    false;

                editBtn.textContent =
                    "Save";

                editing = true;

            } else {

                form.submit();
            }
        }
    );

    changePhotoBtn
        .addEventListener(
            "click",
            () => {

                imageInput.click();
            }
        );

    imageInput
        .addEventListener(
            "change",
            function () {

                const file =
                    this.files[0];

                if (file) {

                    document
                        .getElementById(
                            "previewImage"
                        )
                        .src =
                        URL.createObjectURL(
                            file
                        );
                }
            }
        );