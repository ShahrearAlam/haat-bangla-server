const { UserProductViewModel } = require("../../models/product/userProductVeiw.model");
const catchAsync = require("../../utils/catchAsync");
const fastcsv = require('fast-csv');

const productVeiwCSVDownload = catchAsync(async (req, res) => {

  const productVeiws = await UserProductViewModel
    .find({ product: req.body.productId })
    .sort({ createdAt: -1 })
    .populate('user')
    .populate('product');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.setHeader('Content-Disposition', `attachment; filename=product_veiw_data.csv`);

  const csvStream = fastcsv.format({ headers: true });
  csvStream.pipe(res);

  productVeiws.forEach(veiw => {
    csvStream.write({
      fullName: veiw.user.fullName,
      email: veiw.user?.email,
      number: veiw.user?.phone?.number
    });
  });

  csvStream.end();

});

module.exports = {
  productVeiwCSVDownload
};