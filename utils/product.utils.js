const applyFilter = (title, value, whereClause, useRegex = false) => {
  if (value) {
    if (useRegex) {
      whereClause[title] = new RegExp(value, 'i');
    } else {
      whereClause[title] = value;
    }
  }
};

// getProducts controller helper variable & function

const getProductsFilter = (req) => {

  let { category, price } = req.query;
  price = price && JSON.parse(price);

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('category', category, whereClause);
  applyFilter('price', price, whereClause);

  return whereClause;
};

module.exports = { getProductsFilter }
