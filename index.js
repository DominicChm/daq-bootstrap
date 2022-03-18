const fs = require("fs");
const drivelist = require('drivelist');
const {spawn, execSync} = require("child_process");

currentMount = null;

let frontendProcess = null;
let backendProcess = null;

if (!fs.existsSync("./usb")) {
    fs.mkdirSync("./usb");
}

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
    console.log("Connected... starting DAQ!");

    if(driveType(`${drive.device}1`) !== "ntfs")
        throw new Error("ERROR - THIS DRIVE IS NOT NTFS FORMATTED!");

    execSync(`mount -o umask=0 ${drive.device}1 ./usb`);

    if (!fs.existsSync("./usb/bajacorev1"))
        execSync("(cd ./usb; git clone https://github.com/DominicChm/bajacorev1.git)");

    if (!fs.existsSync("./usb/bajafrontendv1"))
        execSync("(cd ./usb; git clone https://github.com/DominicChm/bajafrontendv1.git)");

    // Try to update the code, if we have a network connection.
    try {
        execSync("(cd ./usb/bajafrontendv1; git pull)");
        execSync("(cd ./usb/bajacorev1; git pull)");
    } catch (e) {
        console.log("Couldn't update.");
    }

    console.log("Starting DAQ...")
    currentMount = drive.device;
    frontendProcess = execSync("(cd ./usb/bajafrontendv1; sudo -u pi npm i; sudo -u pi npm run start > frontend.log)");
    backendProcess = spawn("(cd ./usb/bajacorev1; sudo -u pi npm i; sudo -u pi npm run dev > backend.log)");

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
