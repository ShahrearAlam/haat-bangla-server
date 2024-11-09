
const applyFilter = (title, value, whereClause, useRegex = false) => {
  if (value) {
    if (useRegex) {
      whereClause[title] = new RegExp(value, 'i');
    } else {
      whereClause[title] = value;
    }
  }
};

// getBlogs controller helper variable & function
const getUsersFilter = (req) => {

  const { fullName, email, number, role, status } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('fullName', fullName, whereClause, true);
  applyFilter('email', email, whereClause, true);
  applyFilter('phone.number', number, whereClause, true);
  applyFilter('role', role, whereClause);
  applyFilter('status', status, whereClause);

  return whereClause;
};

const getPackagesFilter = (req) => {

  const { name } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('name', name, whereClause, true);

  return whereClause;
};

const getProductsFilter = (req) => {

  const { haat, category } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('haat', haat, whereClause, true);
  applyFilter('category', category, whereClause, true);

  return whereClause;
};

const populateUserNameFilter = (req) => {

  const { fullName } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('user.fullName', fullName, whereClause, true);

  return whereClause;
};

const populateSlotStatusFilter = (req) => {

  const { status } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('slot.status', status, whereClause);

  return whereClause;
};

const getOrdersFilter = (req) => {

  const { status } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('status', status, whereClause);

  return whereClause;
};

const populatePackageNameFilter = (req) => {

  const { packageName } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('package.name', packageName, whereClause, true);

  return whereClause;
};

const getPaymentsFilter = (req) => {

  const { senderNumber, transactionId } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('payment.senderNumber', senderNumber, whereClause, true);
  applyFilter('payment.transactionId', transactionId, whereClause, true);

  return whereClause;
};

const getRefundsRequestFilter = (req) => {

  const { status } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('status', status, whereClause);

  return whereClause;
};

const getAdminContestsFilter = (req) => {

  const { name } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('name', name, whereClause, true);

  return whereClause;
};

const getParticipantsFilter = (req) => {

  const { name } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('name', name, whereClause, true);

  return whereClause;
};

const populateContestNameFilter = (req) => {

  const { name } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('contest.name', name, whereClause);

  return whereClause;
};

const getAdminWinnersFilter = (req) => {

  const { status } = req.query;

  let whereClause = {};

  // Apply filtering criteria based on query parameters
  applyFilter('status', status, whereClause);

  return whereClause;
};

module.exports = {
  getUsersFilter,
  getPackagesFilter,
  getProductsFilter,
  populateUserNameFilter,
  populateSlotStatusFilter,
  getOrdersFilter,
  populatePackageNameFilter,
  getPaymentsFilter,
  getRefundsRequestFilter,
  getAdminContestsFilter,
  getParticipantsFilter,
  populateContestNameFilter,
  getAdminWinnersFilter
}
