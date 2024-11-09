module.exports = (req) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const skipCount = (page - 1) * limit;

  return { limit, skipCount };
};