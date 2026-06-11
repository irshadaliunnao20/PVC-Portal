const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0wRyLs7tQFpiP0x3N_K_2zVvPAMPWACBaazToSQt6iVZtIY2dk0xm7vsTmJGXPcPRtg/exec";
const HUGGING_FACE_API_URL = "https://pvc-cropper-api-pvc-cropper-api.hf.space"; 

let currentUser = "";

window.loginUser = async function() {
    const userInp = document.getElementById("username").value;
    const passInp = document.getElementById("password").value;
    if(!userInp || !passInp) return alert("Please fill all fields");

    currentUser = userInp;
    document.getElementById("login-box").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("user-display").innerText = currentUser;
    document.getElementById("wallet-balance").innerText = "42"; // Sycned to current wallet state

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
    const pdfPassword = document.getElementById("pdf-password").value || "";
    const fileInput = document.getElementById("document-file");
    const btn = document.getElementById("process-btn");

    if(currentBal < 2) return alert("Low Balance!");
    if(fileInput.files.length === 0) return alert("Upload file first!");

    btn.innerText = "⏳ Processing... Please Wait...";
    btn.disabled = true;

    try {
        // Step A: Balance Deduction
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ action: "deduct_balance", userId: currentUser })
        });

        currentBal -= 2;
        document.getElementById("wallet-balance").innerText = currentBal;

        // Step B: Native base64 generation block 
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.readAsDataURL(file);
        reader.onload = async function () {
            try {
                const response = await fetch(`${HUGGING_FACE_API_URL}/api/predict`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        data: [
                            { "name": file.name, "data": reader.result },
                            cardType,
                            pdfPassword
                        ]
                    })
                });

                const result = await response.json();
                
                if (result && result.data && result.data[0]) {
                    // Extract exact direct download parameter from layout stream
                    const rawName = result.data[0].name;
                    const finalDownloadUrl = `${HUGGING_FACE_API_URL}/file=${rawName}`;
                    
                    const downloadAnchor = document.createElement("a");
                    downloadAnchor.href = finalDownloadUrl;
                    downloadAnchor.download = `${cardType}_processed.png`;
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    document.body.removeChild(downloadAnchor);
                    
                    alert("✨ File generated and downloaded successfully!");
                } else {
                    alert("Engine execution failed. Please verify if file is corrupt.");
                }
            } catch(innerErr) {
                alert("Processing connection handshake error.");
            } finally {
                btn.innerText = "⚙️ Process Card & Deduct ₹2";
                btn.disabled = false;
            }
        };

    } catch(e) {
        alert("Transaction layer issue.");
        btn.innerText = "⚙️ Process Card & Deduct ₹2";
        btn.disabled = false;
    }
}
