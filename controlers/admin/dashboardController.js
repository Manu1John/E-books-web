import User from "../../models/User.js";

/* ---------------- DASHBOARD ---------------- */

export const getDashboard =
async (req, res) => {
    try {

        const page =
            parseInt(
                req.query.page
            ) || 1;

        const search =
            req.query.search || "";

        const limit = 5;

        const skip =
            (page - 1) * limit;

        const filter = {
            $or: [
                {
                    firstName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    lastName: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ]
        };

        const totalUsers =
            await User.countDocuments(
                filter
            );

        const users =
            await User.find(filter)
                .sort({
                    updatedAt: -1
                })
                .skip(skip)
                .limit(limit);

        const totalPages =
            Math.ceil(
                totalUsers / limit
            );

        return res.render(
            "admin/dashboard",
            {
                title:
                    "admin dashboard",
                cssFile:
                    "dashboard.css",
                jsFile:
                    "dashboard.js",
                users,
                currentPage:
                    page,
                totalPages,
                totalUsers,
                search
            }
        );

    } catch (error) {
        console.log(
            "getDashboard error:",
            error
        );

        return res
            .status(500)
            .send(
                "Something went wrong"
            );
    }
};