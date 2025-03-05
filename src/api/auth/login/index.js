/** @format */

import axios from "axios";

export const login = (email, password) => {
    // return axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
    //     email,
    //     password,
    // });
    return new Promise((resolve,reject)=>setTimeout(resolve({
        data:{tokens:{
            access:{
                token:"eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IjZlNTkyMTUzODE5MDRlYjc4M2QyMzQ4YTFhYjM4NjA0In0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MjE3NDA4NDAsImV4cCI6MTcyMTc0NDQ0MH0.zYcwW1piheBg0RX3Ril8h8fx114-O_Xq4qfHrKVZ4z02Qs99YLZsgrEXWhVnxsrpsK5fOn3nRIj1cai9XpUoJw",expires:1721732440
            }, //Giriş 
            refresh  :{
                token:"eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6IjZlNTkyMTUzODE5MDRlYjc4M2QyMzQ4YTFhYjM4NjA0In0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MjE3NDA4NDAsImV4cCI6MTcyMTc0NDQ0MH0.zYcwW1piheBg0RX3Ril8h8fx114-O_Xq4qfHrKVZ4z02Qs99YLZsgrEXWhVnxsrpsK5fOn3nRIj1cai9XpUoJw",
                expires:1721732440
            }
        }}
        
    }),2000))
};
