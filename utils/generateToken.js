import jwt from 'jsonwebtoken';


export const genereateToken = (...payload) =>{
    return jwt.sign(...payload,process.env.JWT_SECRET,{
        expiresIn: '30d'
    });
}