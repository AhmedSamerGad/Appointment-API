const errorHandler = (fun) => {
    return (req, res, next) => {
        fun(req, res, next).catch(next);
    };
}

export default errorHandler;