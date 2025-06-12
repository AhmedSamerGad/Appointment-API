const globalError = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const env = process.env.NODE_ENV || 'development';

    const response = {
        status: 'error',
        message: err.message || 'Something went wrong!',
    };

    // Only show stack trace in development mode
    if (env === 'development') {
        response.stack = err.stack;
        response.error = err;
    }

    return res.status(statusCode).json(response);
};

export default globalError;
