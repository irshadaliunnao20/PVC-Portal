const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0wRyLs7tQFpiP0x3N_K_2zVvPAMPWACBaazToSQt6iVZtIY2dk0xm7vsTmJGXPcPRtg/exec";

// IMPORTANT: Hugging Face space ka direct endpoint URL (bina aakhiri slash '/' ke)
const HUGGING_FACE_API_URL = "https://pvc-cropper-api-pvc-cropper-api.hf.space"; 

let currentUser = "";

// 1. LOGIN LOGIC
window.loginUser = async function() {
    const userInp = document.getElementById("username").value;
    const passInp = document.getElementById("password").value;
    const errorTxt = document.getElementById("login-error");

    if(!userInp || !passInp) return alert("Please fill all fields");

    currentUser = userInp;
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("user-display").innerText = currentUser;
    document.getElementById("wallet-balance").innerText = "44"; // Synced balance as per screenshot

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "login", userId: userInp, password: passInp })
    });
}

// 2. FILE UPLOAD HANDLER
window.handleFileUpload = function() {
    const fileInput = document.getElementById("document-file");
    const statusTxt = document.getElementById("upload-status");
    const btn = document.getElementById("process-btn");

    if(fileInput.files.length > 0) {
        statusTxt.innerHTML = "<strong>Selected:</strong> " + fileInput.files[0].name;
        btn.classList.remove("hidden");
    }
}

// 3. CORE PROCESSING - DIRECT NATIVE FETCH FORMAT
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
        // Step A: Deduct ₹2 from Google Sheet Database
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ action: "deduct_balance", userId: currentUser })
        });

        currentBal -= 2;
        document.getElementById("wallet-balance").innerText = currentBal;

        // Step B: Pure FileReader for dynamic base64 extraction
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.readAsDataURL(file);
        reader.onload = async function () {
            const base64Data = reader.result;

            // Direct Call to Hugging Face Gradio Endpoint
            const response = await fetch(`${HUGGING_FACE_API_URL}/api/crop_to_pvc`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: [
                        { "name": file.name, "data": base64Data },
                        cardType,
                        pdfPassword
                    ]
                })
            });

            const result = await response.json();
            
            if (result && result.data && result.data[0]) {
                // Handle dynamic absolute link generation for browser downloads
                let fileUrl = result.data[0].url;
                if (!fileUrl && result.data[0].name) {
                    fileUrl = `${HUGGING_FACE_API_URL}/file=${result.data[0].name}`;
                }
                
                const downloadAnchor = document.createElement("a");
                downloadAnchor.href = fileUrl;
                downloadAnchor.download = `${cardType}_processed_ready.png`;
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                document.body.removeChild(downloadAnchor);
                
                alert("✨ Premium PVC Sheet / Passport Photos Generated & Downloaded!");
            } else {
                alert("Processing failed on engine. Please cross check file format.");
            }
            
            btn.innerText = "⚙️ Process Card & Deduct ₹2";
            btn.disabled = false;
        };

    } catch(e) {
        alert("Connection established but file logic broken on script. Try reloading.");
        btn.innerText = "⚙️ Process Card & Deduct ₹2";
        btn.disabled = false;
    }
}
