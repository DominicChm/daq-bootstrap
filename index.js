const fs = require("fs");
const drivelist = require('drivelist');
const {spawn, execSync, exec} = require("child_process");

currentMount = null;

let frontendProcess = null;
let backendProcess = null;

if (!fs.existsSync("./usb")) {
    fs.mkdirSync("./usb");
}
execSync(`umount ./usb`);

console.log("Start monitoring...");

async function pollUSB() {
    //Filter USB drives
    const drives = (await drivelist.list()).filter(d => d.isUSB);

    if (currentMount) {
        if (!drives.find(d => d.device === currentMount)) await onDetach();
    } else {
        if (drives && drives.length > 0) await onAttach(drives[0]);
    }

}

async function onAttach(drive) {
    console.log("USB Connected...");

    if (driveType(`${drive.device}1`) !== "ntfs")
        throw new Error("ERROR - THIS DRIVE IS NOT NTFS FORMATTED!");

    execSync(`mount -o umask=0 ${drive.device}1 ./usb`);
    currentMount = drive.device;

    if (!fs.existsSync("./usb/bajacorev1")) {
        console.log("No backend repo detected, cloning and installing...");
        execSync("(cd ./usb; git clone https://github.com/DominicChm/bajacorev1.git)", {stdio: 'inherit'});
        execSync("(cd ./usb/bajacorev1; npm i)", {stdio: 'inherit'})
    }

    if (!fs.existsSync("./usb/bajafrontendv1")) {
        console.log("No frontend repo detected, cloning and installing...");
        execSync("(cd ./usb; git clone https://github.com/DominicChm/bajafrontendv1.git)", {stdio: 'inherit'});
        execSync("(cd ./usb/bajafrontendv1; npm i)", {stdio: 'inherit'})
    }

    // Try to update the code, if we have a network connection.
    try {
        execSync("(cd ./usb/bajafrontendv1; git pull)");
        execSync("(cd ./usb/bajacorev1; git pull)");
    } catch (e) {
        console.log("Couldn't update.");
    }

    console.log("Starting DAQ...")

    frontendProcess = spawn("bash", ["run-frontend.sh"], {stdio: 'inherit'});
    frontendProcess.stdout.on("data", (data) => {
        console.log(`frontend: ${data}`);
    });
    frontendProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    backendProcess = spawn("bash", ["run-frontend.sh"], {stdio: 'inherit'});
    backendProcess.stdout.on("data", (data) => {
        console.log(`backend: ${data}`);
    });
    backendProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    console.log("Started DAQ!");
}

async function onDetach() {
    console.log("Detached... killing DAQ!");

    frontendProcess.kill();
    backendProcess.kill();
    execSync(`umount -l ./usb`);
    currentMount = null;
    frontendProcess = null;
    backendProcess = null;

    console.log("Killed DAQ!");
}

function driveType(fsLabel) {
    return execSync(`sudo blkid -s TYPE -o value /dev/sdc1`).toString().trim();
}

setInterval(pollUSB, 1000);
