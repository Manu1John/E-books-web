

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    const clearButton =
        document.getElementById(
            "clearSearch"
        );

    let timer;

    // Debounced search
    searchInput.addEventListener(
        "keyup",
        function () {

            clearTimeout(
                timer
            );

            timer =
                setTimeout(() => {

                    const searchValue =
                        searchInput.value.trim();

                    window.location.href =
                        `/admin/dashboard?search=${searchValue}`;

                }, 500);

        }
    );

    // Clear search
    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "/admin/dashboard";

            }
        );

    }
