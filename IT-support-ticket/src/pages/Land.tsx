import React, { useState } from 'react';
export default function Land() {
    const [userempno, setuserempno] = useState("");
    const [useremail, setuseremail] = useState("");

    const handleSetUserEmpNo = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value);
    };

    const handleSetUserEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value);
    };

    return (


        <div>
            <h1>Welcome to IT Support Ticket System</h1>
            <div>
                <label>
                    Text input: <input name="userEmp" onChange={handleSetUserEmpNo} />
                </label>
                <label>
                    Text input: <input name="userEmail" onChange={handleSetUserEmail} />
                </label>
            </div>
        </div>
    )
}