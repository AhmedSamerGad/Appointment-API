import fs from 'fs';
import User from '../../models/userModel.js';
import {connectDB} from '../../config/database_conig.js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(path.dirname(''), '../../.env') });
let users ;
const connectAndInsertData = async () => {
   connectDB();
   users = JSON.parse(fs.readFileSync('./user.json', 'utf-8'));
};
  const insertData = async () => {
  try {
    await User.insertMany(users);
    console.log('Data imported successfully');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

if(process.argv[2] === '-i'){
  connectAndInsertData().then(insertData); 
}