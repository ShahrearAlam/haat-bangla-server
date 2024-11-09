const Joi = require('joi');
const { validate } = require('../utils/validate');

const register = {
	body: Joi.object({
		fullName: Joi.string().required(),
		countryCode: Joi.string().required(),
		number: Joi.string().required(),
		password: Joi.string().min(6).message("Password must be at least 6 characters long").required()
	})
};

const login = {
	body: Joi.object({
		number: Joi.string().required(),
		password: Joi.string().required(),
	})
};

module.exports = {
	registerValidation: validate(register),
	loginValidation: validate(login),
}