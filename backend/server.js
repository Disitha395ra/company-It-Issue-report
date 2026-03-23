const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json())



app.listen(5000, ()=>{
    console.log('Server is running on port 5000');
})

const user = {
    empNo: "123",
    email: "test@gmail.com"
};


app.get("/", (req, res) => {
    res.send("Backend running");
});

app.post("/login", (req, res)=>{
    const {empNo, email} = req.body;

    if(empNo === user.empNo && email === user.email){
        res.json({
            success:true,
            message: "Login successfull",
            user: user,
        })
    }else {
        return res.json({
            success: false,
            message: "Invalid employee number or email",
        })
    }
})

