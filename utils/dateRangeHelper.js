const httpStatus = require("http-status");
const apiResponse = require("./dateRangeHelper");

const getStartAndEndOfDay = (date) => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0);
  return [startOfDay, endOfDay];
};

const getStartAndEndOfWeek = (date) => {
  const startOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 6, 0, 0, 0);
  const endOfWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return [startOfWeek, endOfWeek];
};

const getStartAndEndOfLastMonth = (date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 29, 0, 0, 0);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return [startOfMonth, endOfMonth];
};

const getStartAndEndOfLastYear = (date) => {
  const startOfYear = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 364, 0, 0, 0);
  const endOfYear = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return [startOfYear, endOfYear];
};

const dashboardDateRange = (req) => {

  let startAndEnd;

  // Client request for different date ranges
  const dateRange = req.query.dateRange;

  switch (dateRange) {
    case 'today':
      startAndEnd = getStartAndEndOfDay(new Date());
      break;
    case 'weekly':
      startAndEnd = getStartAndEndOfWeek(new Date());
      break;
    case 'monthly':
      startAndEnd = getStartAndEndOfLastMonth(new Date());
      break;
    case 'year':
      startAndEnd = getStartAndEndOfLastYear(new Date());
      break;
    case 'custom':
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return apiResponse(res, httpStatus.BAD_REQUEST, { message: 'custom Date not provided' });
      }
      let startDateFormat = new Date(startDate);
      let endDateFormat = new Date(endDate);
      startAndEnd = [startDateFormat, endDateFormat];
      break;
    default:
      return startAndEnd = [null, null];
  }

  return startAndEnd;
}

module.exports = {
  dashboardDateRange
}
