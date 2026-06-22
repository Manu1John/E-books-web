import express from 'express'
import Address from '../../models/address.js'


// ADDRESS PAGE
const getAddressPage = async (req, res) => {

    try {

        const userId =
            req.session.user.id;
            

        const addresses =
            await Address.find({
                userId
            });

        res.render(
            "user/address",
            {
                title:
                    "Saved Address",

                cssFile:
                    "address.css",

                user:
                    req.session.user,

                addresses
            }
        );

    } catch (error) {

        console.log(error);

        res.redirect(
            "/user-profile"
        );
    }
};

const getAddAddressPage = (req, res, next) => {
    try {
        return res.render("user/addAddress", {
            title: "Add Address",
            cssFile: "addAddress.css",
            jsFile:"addAddress.js",
            // Safe check: Prevents crashing if req.session is undefined
            user: req.session?.user 
        });
    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error in getAddAddressPage controller:", error);
        
        // Forward the error to your central Express error-handling middleware
        next(error);
    }
};
// ADD ADDRESS
const addAddress = async (req, res) => {
    try {

        const userId = req.session.user.id;

        const {
            fullName,
            phone,
            house,
            area,
            landmark,
            city,
            state,
            pincode,
            addressType
        } = req.body;

        await Address.create({
            userId,

            fullName,

            phone,

            addressLine: `${house}, ${area}`,

            landmark,

            city,

            state,

            pincode,

            addressType
        });

        return res.redirect("/address");

    } catch (error) {

        console.log("ADD ADDRESS ERROR:", error);

        return res.redirect("/add-address");
    }
};

// GET EDIT ADDRESS PAGE
const getEditAddress = async (req, res) => {
    try {

        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.redirect("/address");
        }

        return res.render("user/editAddress", {
            title: "Edit Address",
            cssFile: "addAddress.css",
            jsFile:"editAddress.js",
            address
        });

    } catch (error) {

        console.log(error);
        return res.redirect("/address");
    }
};


// UPDATE ADDRESS
const updateAddress = async (req, res) => {
    try {

        const {
            fullName,
            phone,
            house,
            area,
            landmark,
            city,
            state,
            pincode,
            addressType
        } = req.body;

        await Address.findByIdAndUpdate(
            req.params.id,
            {
                fullName,
                phone,
                addressLine: `${house}, ${area}`,
                landmark,
                city,
                state,
                pincode,
                addressType
            }
        );

        return res.redirect("/address");

    } catch (error) {

        console.log(error);
        return res.redirect("/address");
    }
};




// DELETE ADDRESS
const deleteAddress =
async (req, res) => {

    try {

        await Address.findByIdAndDelete(
            req.params.id
        );

        res.redirect(
            "/address"
        );

    } catch (error) {

        console.log(error);

        res.redirect(
            "/address"
        );
    }
};

export default {
    getAddAddressPage,
    getAddressPage,
    addAddress,
    updateAddress,
    getEditAddress,
    deleteAddress
}

