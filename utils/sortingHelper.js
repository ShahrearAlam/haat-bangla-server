module.exports = (req) => {

  const sortBy = req.query.sortBy;
  let sort;

  switch (sortBy) {
    case 'asc':
      sort = 1;
      break;
    case 'desc':
      sort = -1;
      break;
    default:
      sort = 0;
  }
  
  return sort;
};