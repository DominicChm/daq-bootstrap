const fs = require("fs");
const drivelist = require('drivelist');
const {spawn, execSync} = require("child_process");

const nodeDir =

    let
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

    execSync(`mount -o umask=0 ${drive.device}1 ./usb`);
    execSync(`export NODE_VERSION=17.7.1`);

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

setInterval(pollUSB, 1000);
