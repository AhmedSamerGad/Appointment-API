import jwt from 'jsonwebtoken';
import ApiResponse from '../utils/apiResponse.js';

const verifyToken = (req, res, next) => {
  const bearerHeader = req.header('Authorization');
  if (!bearerHeader || !bearerHeader.startsWith('Bearer ')) {
    return res.status(401).json(
        new ApiResponse('fail', 'Invalid authorization format. Use Bearer token')
    );
}
const token = bearerHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(error);
  }
}

export default verifyToken;