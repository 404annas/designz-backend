const apiResponse = (res, statusCode, success, message, data = null, extra = {}) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    ...extra,
  });
};

export default apiResponse;
