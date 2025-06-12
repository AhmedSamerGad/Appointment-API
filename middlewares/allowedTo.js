import errorHandler from "./errorHandler.js";
import ApiResponse from "../utils/apiResponse.js";
const allowedTo = (...role) => errorHandler(async (req, res, next) => {
        if (!role.includes(req.user.role)) {
            return res.status(403).json(new ApiResponse('fail', 'You are not allowed to access this route'));
        }
        next();
    });
;

export default allowedTo;