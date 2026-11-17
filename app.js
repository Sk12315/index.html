/* VEHICLE QR GLOBAL
   Application JavaScript
*/

"use strict";

// Application configuration
const CONFIG = {
    appName: "Vehicle QR Global",
    storageKey: "vehicle_qr_records",
    language: "en"
};

// Generate unique vehicle ID
function generateVehicleID() {
    return "VQG-" +
        Date.now().toString(36).toUpperCase() +
        "-" +
        Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get saved vehicle records
function getVehicles() {
    try {
        return JSON.parse(
            localStorage.getItem(CONFIG.storageKey) || "[]"
        );
    } catch {
        return [];
    }
}

// Save vehicle records
function saveVehicles(vehicles) {
    localStorage.setItem(
        CONFIG.storageKey,
        JSON.stringify(vehicles)
    );
}

// Create QR display area
function createQRDisplay() {

    let area = document.getElementById("generatedQR");

    if (!area) {
        area = document.createElement("div");
        area.id = "generatedQR";
        area.className = "form-card";

        document.getElementById("register")
            .appendChild(area);
    }

    return area;
}

// Generate vehicle QR
function generateVehicleQR(vehicle) {

    const area = createQRDisplay();

    area.innerHTML = `
        <h3>Vehicle QR Identity Generated</h3>

        <p><b>Vehicle ID:</b> ${vehicle.id}</p>

        <div id="qrCodeImage"
        style="padding:20px;display:flex;
        justify-content:center;"></div>

        <p class="muted">
        Save this QR code for your vehicle.
        </p>

        <button id="downloadQR"
        class="btn btn-primary">
        Download QR Code
        </button>
    `;

    if (typeof QRCode === "undefined") {
        area.querySelector("#qrCodeImage").textContent =
            "QR library is not available. Please check your internet connection.";
        return;
    }

    const qrData =
        window.location.origin +
        window.location.pathname +
        "?vehicle=" +
        encodeURIComponent(vehicle.id);

    new QRCode(
        document.getElementById("qrCodeImage"),
        {
            text: qrData,
            width: 220,
            height: 220,
            correctLevel: QRCode.CorrectLevel.H
        }
    );

    document.getElementById("downloadQR")
        .addEventListener("click", function() {

            const canvas = area.querySelector("canvas");

            if (!canvas) return;

            const link = document.createElement("a");

            link.download = vehicle.id + ".png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        });
}

// Register vehicle locally
function registerVehicle(event) {

    event.preventDefault();
    event.stopImmediatePropagation();

    const vehicle = {

        id: generateVehicleID(),

        owner: document.getElementById("ownerName").value.trim(),

        email: document.getElementById("email").value.trim(),

        phone: document.getElementById("phone").value.trim(),

        country: document.getElementById("country").value.trim(),

        type: document.getElementById("vehicleType").value,

        registrationNumber:
            document.getElementById("registrationNumber").value.trim(),

        brand: document.getElementById("brand").value.trim(),

        model: document.getElementById("model").value.trim(),

        emergencyContact:
            document.getElementById("emergencyContact").value.trim(),

        createdAt: new Date().toISOString(),

        status: "LOCAL DEMO"
    };

    if (!vehicle.owner || !vehicle.registrationNumber) {
        alert("Please complete the required fields.");
        return;
    }

    const vehicles = getVehicles();

    const duplicate = vehicles.some(v =>
        v.registrationNumber.toLowerCase() ===
        vehicle.registrationNumber.toLowerCase()
    );

    if (duplicate) {
        alert("This vehicle is already registered on this device.");
        return;
    }

    vehicles.push(vehicle);

    saveVehicles(vehicles);

    generateVehicleQR(vehicle);

    document.getElementById("registrationResult")
        .textContent =
        "Demo vehicle record created successfully. ID: " + vehicle.id;

    document.getElementById("vehicleForm").reset();
}

// Search vehicle
function lookupVehicle() {

    const id = document.getElementById("qrIdentity")
        .value.trim();

    const result = document.getElementById("scanResult");

    const vehicle = getVehicles().find(v => v.id === id);

    if (!vehicle) {
        result.textContent =
            "Vehicle not found on this device. Production database is not connected.";
        return;
    }

    result.innerHTML = `
        <div class="panel">

            <h3>Vehicle Information</h3>

            <p><b>Vehicle ID:</b> ${escapeHTML(vehicle.id)}</p>

            <p><b>Vehicle Type:</b> ${escapeHTML(vehicle.type)}</p>

            <p><b>Brand:</b> ${escapeHTML(vehicle.brand)}</p>

            <p><b>Model:</b> ${escapeHTML(vehicle.model)}</p>

            <p><b>Registration:</b> ${escapeHTML(vehicle.registrationNumber)}</p>

            <p><b>Country:</b> ${escapeHTML(vehicle.country)}</p>

            <p class="muted">
            Local demo record. Ownership is not verified.
            </p>

        </div>
    `;
}

// Prevent unsafe HTML insertion
function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// QR scanner
let qrScanner = null;

async function startVehicleScanner() {

    const area = document.getElementById("scannerArea");

    if (typeof Html5Qrcode === "undefined") {
        area.textContent = "Scanner library unavailable.";
        return;
    }

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        area.textContent =
            "Camera requires HTTPS and browser permission.";

        return;
    }

    area.innerHTML = `
        <div id="reader" style="width:100%;max-width:400px"></div>
        <button id="stopScanner" class="btn btn-outline">
        Stop Scanner
        </button>
    `;

    qrScanner = new Html5Qrcode("reader");

    try {

        await qrScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 220 },

            async decodedText => {

                try {

                    const url = new URL(decodedText);

                    const id = url.searchParams.get("vehicle");

                    if (id) {

                        document.getElementById("qrIdentity")
                            .value = id;

                        await stopVehicleScanner();

                        lookupVehicle();

                    } else {

                        alert("This is not a supported Vehicle QR code.");

                    }

                } catch {

                    alert("Invalid QR code.");

                }

            }
        );

        document.getElementById("stopScanner")
            .addEventListener("click", stopVehicleScanner);

    } catch (error) {

        area.textContent =
            "Camera could not start. Please check camera permission.";

    }
}

async function stopVehicleScanner() {

    if (qrScanner) {

        try {
            await qrScanner.stop();
            await qrScanner.clear();
        } catch (error) {
            console.error(error);
        }

        qrScanner = null;
    }

    document.getElementById("scannerArea").textContent =
        "Scanner stopped.";
}

// Initialize application
document.addEventListener("DOMContentLoaded", function() {

    const form = document.getElementById("vehicleForm");

    form.addEventListener(
        "submit",
        registerVehicle,
        true
    );

    const scannerButton = document.createElement("button");

    scannerButton.type = "button";
    scannerButton.className = "btn btn-primary";
    scannerButton.textContent = "Open Camera Scanner";

    scannerButton.addEventListener(
        "click",
        startVehicleScanner
    );

    document.getElementById("scannerArea")
        .appendChild(scannerButton);

    console.log("Vehicle QR Global initialized.");

});
