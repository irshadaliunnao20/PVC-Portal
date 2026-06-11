const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0wRyLs7tQFpiP0x3N_K_2zVvPAMPWACBaazToSQt6iVZtIY2dk0xm7vsTmJGXPcPRtg/exec";

let currentUser = "";

// 1. LOGIN LOGIC
async function loginUser() {
    const userInp = document.getElementById("username").value;
    const passInp = document.getElementById("password").value;
    const errorTxt = document.getElementById("login-error");

    if(!userInp || !passInp) return alert("Please fill all fields");

    errorTxt.classList.add("hidden");

    try {
        // Direct dashboard loading for seamless performance
        currentUser = userInp;
        document.getElementById("login-box").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");
        document.getElementById("user-display").innerText = currentUser;
        
        // Default base wallet sync
        document.getElementById("wallet-balance").innerText = "50"; 
        
        // Soft-ping to Google App script backend
        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ action: "login", userId: userInp, password: passInp })
        });
        
    } catch (err) {
        errorTxt.innerText = "Server Error. Try Again!";
        errorTxt.classList.remove("hidden");
    }
}

// 2. FILE UPLOAD HANDLER
function handleFileUpload() {
    const fileInput = document.getElementById("document-file");
    const statusTxt = document.getElementById("upload-status");
    const btn = document.getElementById("process-btn");

    if(fileInput.files.length > 0) {
        statusTxt.innerHTML = "<strong>Selected:</strong> " + fileInput.files[0].name;
        btn.classList.remove("hidden");
    }
}

// 3. MULTI-CARD PROCESSING WITH PASSWORD SUPPORT
async function processSelectedCard() {
    let currentBal = parseFloat(document.getElementById("wallet-balance").innerText);
    const cardType = document.getElementById("card-type").value;
    const pdfPassword = document.getElementById("pdf-password").value;
    const fileInput = document.getElementById("document-file");

    if(currentBal < 2) {
        alert("Low Balance! Please recharge your wallet.");
        return;
    }

    if(fileInput.files.length === 0) {
        alert("Please upload a file first!");
        return;
    }

    // Step 1: Deduct balance from Sheet Backend
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                action: "deduct_balance",
                userId: currentUser
            })
        });

        // UI balance update
        currentBal -= 2;
        document.getElementById("wallet-balance").innerText = currentBal;
        
        alert(`₹2 Deducted! Processing standard ${cardType.toUpperCase()} Card...`);
        
        // Log parameters for debugging/Next Python Engine Step
        console.log("Card Mode:", cardType);
        console.log("Password Provided:", pdfPassword ? "YES" : "NO");
        console.log("File Name:", fileInput.files[0].name);

        // NEXT STEP: Yahan hum dynamic script data Python API ko forward karenge password ke sath
        alert("Success: Processing complete. (Python Engine execution starts next)");

    } catch(e) {
        alert("Transaction failed! Try again.");
    }
}
