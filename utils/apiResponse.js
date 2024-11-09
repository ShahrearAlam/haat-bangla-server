/**
 * @param {Response} res
 * @param {number} status
 * @param {Object | Array<Object>} data
 * @param {Object=} optional
 * @return {this}
 * @constructor
 */
module.exports = (res, status, data = {}, optional = {}, redirectUrl) => {
	// Check if redirectUrl is provided
	if (redirectUrl) {
		return res.redirect(redirectUrl);
	}

	const returnObject = {};

	returnObject["data"] = data && data.data ? data.data : null;
	returnObject["total"] = data && data.total ? data.total : null;
	returnObject["message"] = data && data.message ? data.message : null;
	returnObject["success"] = data && data.success ? data.success : false;
	returnObject["stack"] = typeof optional !== "undefined" && Object.keys(optional).length > 0 ? optional : null;

	res.status(status);
	return res.json(returnObject);
};
