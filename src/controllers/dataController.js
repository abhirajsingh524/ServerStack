const dataService = require('../services/dataService');
const { sendSuccess } = require('../utils/response');

const createData = async (req, res, next) => {
  try {
    // jsonData arrives as a string when sent via multipart/form-data
    let jsonData = req.body.jsonData;
    if (jsonData && typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData);
      } catch {
        const err = new Error('jsonData must be valid JSON');
        err.statusCode = 422;
        return next(err);
      }
    }

    const data = await dataService.createData(
      { ...req.body, jsonData },
      req.file,
      req.user,
      req
    );
    return sendSuccess(res, 201, 'Data record created', data);
  } catch (err) {
    next(err);
  }
};

const getAllData = async (req, res, next) => {
  try {
    const result = await dataService.getAllData(req.user, req.query);
    return sendSuccess(res, 200, 'Data retrieved', result);
  } catch (err) {
    next(err);
  }
};

const getDataById = async (req, res, next) => {
  try {
    const record = await dataService.getDataById(req.params.id, req.user, req);
    return sendSuccess(res, 200, 'Data retrieved', record);
  } catch (err) {
    next(err);
  }
};

const updateData = async (req, res, next) => {
  try {
    const updated = await dataService.updateData(req.params.id, req.body, req.user, req);
    return sendSuccess(res, 200, 'Data updated', updated);
  } catch (err) {
    next(err);
  }
};

const deleteData = async (req, res, next) => {
  try {
    await dataService.deleteData(req.params.id, req.user, req);
    return sendSuccess(res, 200, 'Data deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { createData, getAllData, getDataById, updateData, deleteData };
