const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0wRyLs7tQFpiP0x3N_K_2zVvPAMPWACBaazToSQt6iVZtIY2dk0xm7vsTmJGXPcPRtg/exec";

// IMPORTANT: Hugging Face space ka link yahan dalein, lekin is baar spaces format wala username/space-name format daalna hai, jaise neeche diya hai:
const HF_SPACE_NAME = "pvc-cropper-api/pvc-cropper-api"; 

let currentUser = "";

// Window object me global login function de rahe hain kyunki script ek module hai
window.loginUser = async function() {
    const userInp = document.getElementById("username").value;
    const passInp = document.getElementById("password").value;
    const errorTxt = document.getElementById("login-error");

    if(!userInp || !passInp) return alert("Please fill all fields");

    currentUser = userInp;
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("user-display").innerText = currentUser;
    document.getElementById("wallet-balance").innerText = "46"; // Syncing with your current balance

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "login", userId: userInp, password: passInp })
    });
}

window.handleFileUpload = function() {
    const fileInput = document.getElementById("document-file");
    const statusTxt = document.getElementById("upload-status");
    const btn = document.getElementById("process-btn");

    if(fileInput.files.length > 0) {
        statusTxt.innerHTML = "<strong>Selected:</strong> " + fileInput.files[0].name;
        btn.classList.remove("hidden");
    }
}

window.processSelectedCard = async function() {
    let currentBal = parseFloat(document.getElementById("wallet-balance").innerText);
    const cardType = document.getElementById("card-type").value;
    const pdfPassword = document.getElementById("pdf-password").value;
    const fileInput = document.getElementById("document-file");
    const btn = document.getElementById("process-btn");

    if(currentBal < 2) {
        return alert("Low Balance! Please recharge your wallet.");
    }
    if(fileInput.files.length === 0) {
        return alert("Please upload a file first!");
    }

    btn.innerText = "⏳ Processing... Please Wait...";
    btn.disabled = true;

    try {
        // Step 1: Wallet Balance Deduct from Google Sheets
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ action: "deduct_balance", userId: currentUser })
        });

        currentBal -= 2;
        document.getElementById("wallet-balance").innerText = currentBal;

        // Step 2: Call Hugging Face via official Gradio Client library (Smooth Upload Fix)
        const file = fileInput.files[0];
        
        // Gradio client auto-initialization
        const { client } = await import("https://cdn.jsdelivr.net/npm/@gradio/client@0.1.4/dist/index.min.js");
        const app = await client(HF_SPACE_NAME);
        
        // Processing request
        const result = await app.predict("/crop_to_pvc", [
            file,         // Uploaded Image/PDF file blob
            cardType,     // Drodown type string (voter/passport_photo etc)
            pdfPassword   // Encrypted text password string
        ]);

        if (result && result.data && result.data[0]) {
            // Gradio client return direct file temporary access URL
            const fileUrl = result.data[0].url;
            
            const downloadAnchor = document.createElement("a");
            downloadAnchor.href = fileUrl;
            downloadAnchor.download = `${cardType}_processed_ready.png`;
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            document.body.removeChild(downloadAnchor);
            
            alert("✨ Success! Premium Passport Photo Sheet / PVC Card Downloaded Successfully.");
        } else {
            alert("Processing error on engine. Please check file format or parameters.");
        }

    } catch(e) {
        console.error(e);
        alert("Engine Connection Error or Transaction Issue! Check console logs.");
    } finally {
        btn.innerText = "⚙️ Process Card & Deduct ₹2";
        btn.disabled = false;
    }
}
