

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

///confirmation for asking soft delete category
async function deleteCategory(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(
            `/admin/delete-category/${id}`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (data.success) {
            alert("Category deleted successfully");
            location.reload();
        } else {
            alert(data.message);
        }

    } catch (error) {
        console.log("dELETE ERROR",error);
        alert("Something went wrong");
    }
}

