import React, { useState } from 'react';
import { Button } from '@mui/material';
import { useNavigate } from "react-router-dom";

export default function Land() {
    const [userempno, setuserempno] = useState("");
    const [useremail, setuseremail] = useState("");

    const navigate = useNavigate();

    const handleSetUserEmpNo = (e) => {
        setuserempno(e.target.value);
    };

    const handleSetUserEmail = (e) => {
        setuseremail(e.target.value);
    };

    return (
        <div>
            <h1>Welcome to IT Support Ticket System</h1>

            <div>
                <label>
                    Employee No:
                    <input value={userempno} onChange={handleSetUserEmpNo} />
                </label>

                <br />

                <label>
                    Email:
                    <input value={useremail} onChange={handleSetUserEmail} />
                </label>
            </div>

            <div>
                <Button
                    variant="contained"
                    onClick={() => {
                        console.log("Employee No:", userempno);
                        console.log("Email:", useremail);
                        navigate("/home");
                    }}
                >
                    Login
                </Button>
            </div>
        </div>
    );
}