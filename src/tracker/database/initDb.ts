import { Pool } from "pg";  //thư viện giao tiếp với PostgraSQL
import dotenv from "dotenv"; 
dotenv.config(); //tải các biến môi trường trong tệp .env vào process.env


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});


export default pool;