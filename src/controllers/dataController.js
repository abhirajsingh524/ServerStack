const dataService = require('../services/dataService');
const { sendSuccess, sendError } = require('../utils/response');

const createData = async (req, res, next) => {
  try {
    // jsonData may come as a string from multipart form
    let jsonData = req.body.jsonData;
    if (jsonData && typeof jsonData === 'string') {
      try { jsonData = JSON.parse(jsonData); } catch { jsonData = null; }
    }

    const data = await dataService.createData(
      { ...req.body, jsonData },
      req.file,
      req.user,
      req
    );
    return sendSuccess(res, 201, 'Data created successfully', data);
  } catch (err) {
    next(err);
  }
};

const getAllData = async (req, res, next) => {
  try {
    const records = await dataService.getAllData(req.user);
    return sendSuccess(res, 200, 'Data retrieved', records);
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
    return sendSuccess(res, 200, 'Data deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createData, getAllData, getDataById, updateData, deleteData };
