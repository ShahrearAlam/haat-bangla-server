const express = require("express");
const router = express.Router();
const ApiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const httpStatus = require("http-status");


const feAuthRoute = require("./frontend/auth.route");
const feUserRoute = require("./frontend/user.route");
const feLeadRoute = require("./frontend/lead.route");
const fePackageRoute = require("./frontend/package.route");
const feProductRoute = require("./frontend/product.route");
const feBkashRoute = require("./frontend/bkash.route");
const feRefundRoute = require("./frontend/refund.route");
const feOrderRoute = require("./frontend/order.route");
const feUserProductViewRoute = require("./frontend/userProductView.route");
const feContestRoute = require("./frontend/contest.route");


const beUsersRoute = require("./backend/users.route");
const bePackagesRoute = require("./backend/packages.route");
const beProductsRoute = require("./backend/products.route");
const beOrdersRoute = require("./backend/orders.route");
const beRefundsRoute = require("./backend/refunds.route");
const beCSVRoute = require("./backend/csv.route");
const beContestsRoute = require("./backend/contests.route");


router.use("/api/frontend/auth", feAuthRoute);
router.use("/api/frontend/user", feUserRoute);
router.use("/api/frontend/lead", feLeadRoute);
router.use("/api/frontend/package", fePackageRoute);
router.use("/api/frontend/product", feProductRoute);
router.use("/api/frontend/bkash", feBkashRoute);
router.use("/api/frontend/refund", feRefundRoute);
router.use("/api/frontend/order", feOrderRoute);
router.use("/api/frontend/view", feUserProductViewRoute);
router.use("/api/frontend/contest", feContestRoute);


router.use("/api/backend/users", beUsersRoute);
router.use("/api/backend/packages", bePackagesRoute);
router.use("/api/backend/products", beProductsRoute);
router.use("/api/backend/orders", beOrdersRoute);
router.use("/api/backend/refunds", beRefundsRoute);
router.use("/api/backend/csv", beCSVRoute);
router.use("/api/backend/contests", beContestsRoute);


router.use((req, res, next) => {
    const error = new ApiError(httpStatus.NOT_FOUND);
    return next(error);
});

router.use((error, req, res, next) => {
    const status = error.statusCode || res.statusCode || 500;
    const stack = error.stack;

    return apiResponse(res, status, error.message, stack);
});

module.exports = router;
