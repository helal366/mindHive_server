const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app=express();
const port=process.env.PORT || 3000;

// middlewire
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=>{
    res.send('Welcome to mind hive!')
});
app.listen(port, ()=>{
    console.log(`The server is running on the port, ${port}`)
})

// helalskr77
// ka3OrqSipQCtXADp

// mind-hive
// ka3OrqSipQCtXADp