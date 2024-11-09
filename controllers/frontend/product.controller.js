const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { ProductModel } = require("../../models/product/product.model");
const { SlotModel, SlotStatus } = require("../../models/slot.model");
const { default: mongoose } = require("mongoose");
const paginationHelper = require("../../utils/paginationHelper");
const { getProductsFilter } = require("../../utils/product.utils");
const sortingHelper = require("../../utils/sortingHelper");
const { SavedProductModel } = require("../../models/product/save.model");

const getProducts = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const sortOrder = sortingHelper(req);
  const whereClause = getProductsFilter(req);
  const currentTime = new Date();
  const userId = new mongoose.Types.ObjectId(req?.query?.userId);

  const matchCondition = [
    { $match: whereClause },
    {
      $lookup: {
        from: "slots",
        localField: "slot",
        foreignField: "_id",
        as: "slot"
      }
    },
    { $unwind: "$slot" },
    { $match: { "slot.expiryDate": { $gt: currentTime }, "slot.status": { $eq: SlotStatus.active } } },
  ]

  const aggregationPipeline = [
    ...matchCondition,
    {
      $lookup: {
        from: "saved_products",
        let: { productId: "$_id" },
        pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$product", "$$productId"] }, { $eq: ["$user", userId] }] } } }],
        as: "savedProducts"
      }
    },
    { $project: { _id: 1, division: 1, district: 1, haat: 1, price: 1, sellingPrice: 1, category: 1, age: 1, teeth: 1, weight: 1, origin: 1, createdAt: 1, pictures: 1, isSavedProduct: { $gt: [{ $size: "$savedProducts" }, 0] } } }
  ]

  if (sortOrder !== 0) {
    aggregationPipeline.push({ $sort: { price: sortOrder } });
  } else {
    aggregationPipeline.push({ $sort: { createdAt: -1 } });
  }

  aggregationPipeline.push({ $skip: skipCount });
  aggregationPipeline.push({ $limit: limit });

  const products = await ProductModel.aggregate(aggregationPipeline);

  let totalProduct = await ProductModel.aggregate([
    ...matchCondition,
    { $count: "total" }
  ])

  totalProduct = totalProduct.length > 0 ? totalProduct[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { products, totalProduct }, message: "Products Successfully retrieved" });
})

const getSlotsByUserId = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const userId = new mongoose.Types.ObjectId(req.params.userId);
  const currentTime = new Date();

  const slots = await SlotModel.aggregate([
    { $match: { user: userId, expiryDate: { $gt: currentTime }, status: SlotStatus.active } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product"
      }
    },
    {
      $project: {
        _id: 1, order: 1, expiryDate: 1, product: {
          $cond: {
            if: { $eq: [{ $size: "$product" }, 0] },
            then: null,
            else: { $arrayElemAt: ["$product", 0] }
          }
        }
      }
    },
    { $sort: { expiryDate: 1 } },
    { $skip: skipCount },
    { $limit: limit }
  ])

  let totalSlot = await SlotModel.aggregate([
    { $match: { user: userId, expiryDate: { $gt: currentTime }, status: SlotStatus.active } },
    { $count: "total" }
  ])

  totalSlot = totalSlot.length > 0 ? totalSlot[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { slots, totalSlot }, message: "Slots Successfully retrieved by UserId" });
})

const getSingleProduct = catchAsync(async (req, res) => {

  let product = await ProductModel
    .findOne({ _id: req.params.productId })
    .populate([
      {
        path: 'user',
        select: 'fullName phone.number'
      },
      {
        path: 'slot',
        select: 'expiryDate status'
      }
    ]);

  if (!product) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Product not found." });

  if (new Date(product.slot.expiryDate) < new Date()) return apiResponse(res, httpStatus.GONE, { message: "Slot has expired" });

  if (product.slot.status !== SlotStatus.active) return apiResponse(res, httpStatus.FORBIDDEN, { message: "Slot is inactive or banned" });

  let isSave;
  if (req.query?.userId !== 'null') {
    isSave = await SavedProductModel.findOne({ user: req.query?.userId, product: product._id });
  } else {
    isSave = false;
  }

  product = { ...product.toObject(), isSavedProduct: !!isSave }

  return apiResponse(res, httpStatus.OK, { data: product, message: "Product Successfully retrieved" });
})

const addProduct = catchAsync(async (req, res) => {

  const { slotId, division, district, haat, price, sellingPrice, category, age, teeth, weight, origin } = req.body;

  const slot = await SlotModel.findOne({ _id: slotId })
  if (!slot) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Slot not found." });

  if (slot.product?.toString()) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Product was already uploaded this slot" });

  if (new Date(slot.expiryDate) < new Date()) return apiResponse(res, httpStatus.GONE, { message: "Slot has expired" });

  if (slot.status !== SlotStatus.active) return apiResponse(res, httpStatus.FORBIDDEN, { message: "Slot is inactive or banned" });

  if (slot.user.toString() !== req.user.userId) return apiResponse(res, httpStatus.FORBIDDEN, { message: "You are not owner this slot" });

  const pictures = [];
  // Image Uploading in AWS and live link genarate
  if (req.files) {
    req.files.forEach(file => {
      if (file && file.location) {
        pictures.push(file.location);
      }
    });
  }

  const product = new ProductModel({ user: req.user.userId, slot: slotId, division, district, haat, price, sellingPrice, category, age, teeth, weight, origin, pictures });
  await product.save();
  await SlotModel.updateOne({ _id: slotId }, { product: product._id })

  return apiResponse(res, httpStatus.OK, { data: product, message: "Product Successfully Added" });
})

const updateProduct = catchAsync(async (req, res) => {

  let { division, district, haat, price, sellingPrice, category, age, teeth, weight, origin, pictures } = req.body;

  pictures = Array.isArray(pictures) ? pictures : pictures ? [pictures] : [];

  const newPictures = [];
  // Image Uploading in AWS and live link genarate
  if (req.files) {
    req.files.forEach(file => {
      if (file && file.location) {
        newPictures.push(file.location);
      }
    });
  }

  const product = await ProductModel.updateOne(
    { _id: req.params.productId },
    { division, district, haat, price, sellingPrice, category, age, teeth, weight, origin, pictures: [...pictures, ...newPictures] }
  )

  if (!product) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Product not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data: product, message: "Product Update Successfully" });
})

const deleteProduct = catchAsync(async (req, res) => {

  const { productId } = req.params;

  const data = await ProductModel.deleteOne({ _id: productId });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Product not found, deletion failed." });
  }

  await SlotModel.updateOne({ user: req.user.userId, product: productId }, { product: null });

  return apiResponse(res, httpStatus.OK, { data, message: "Product successfully deleted" });
})

const getSavedProducts = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const userId = new mongoose.Types.ObjectId(req.user.userId);
  const currentTime = new Date();

  const matchCondition = [
    { $match: { user: userId } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "slots",
        localField: "product.slot",
        foreignField: "_id",
        as: "slot"
      }
    },
    { $unwind: "$slot" },
    { $match: { "slot.expiryDate": { $gt: currentTime }, "slot.status": { $eq: SlotStatus.active } } },
  ]

  const saveProducts = await SavedProductModel.aggregate([
    ...matchCondition,
    {
      $project: { _id: 1, user: 1, createdAt: 1, product: { _id: "$product._id", category: "$product.category", division: "$product.division", district: "$product.district", haat: "$product.haat", origin: "$product.origin", pictures: "$product.pictures", price: "$product.price", sellingPrice: "$product.sellingPrice", weight: "$product.weight" } }
    },
    { $addFields: { "product.isSavedProduct": true } },
    { $sort: { createdAt: -1 } },
    { $skip: skipCount },
    { $limit: limit }
  ])

  let totalSavedProduct = await SavedProductModel.aggregate([
    ...matchCondition,
    { $count: "total" }
  ]);

  totalSavedProduct = totalSavedProduct.length > 0 ? totalSavedProduct[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { saveProducts, totalSavedProduct }, message: "Successfully retrieved saved products." });
});

const saveProduct = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const productId = req.params.productId;

  const data = await SavedProductModel.findOne({ user: userId, product: productId });
  if (data) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Product already has been saved." });

  const savedProduct = new SavedProductModel({ user: userId, product: productId });
  await savedProduct.save();

  return apiResponse(res, httpStatus.OK, { data: savedProduct, message: "Product successfully saved." });
});

const unsaveProduct = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const productId = req.params.productId;

  const data = await SavedProductModel.findOne({ user: userId, product: productId });
  if (!data) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Saved product does not exist." });

  await SavedProductModel.deleteOne({ user: userId, product: productId });

  return apiResponse(res, httpStatus.OK, { data, message: "Product successfully unsaved." });
});


module.exports = {
  getProducts, getSlotsByUserId,
  getSingleProduct, addProduct, updateProduct, deleteProduct,
  getSavedProducts, saveProduct, unsaveProduct
}
