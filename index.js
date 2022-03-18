const fs = require("fs");
const drivelist = require('drivelist');
const {spawn} = require("child_process");

let currentMount = null;

let frontendProcess = null;
let backendProcess = null;

if (!fs.existsSync("./usb"))
    fs.mkdirSync("./usb");

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
    await execShell(`mount ${drive.device} ./usb`);
    currentMount = drive.device;
    frontendProcess = spawn("(cd ./usb/bajafrontendv1; npm dev > backend.log)");
    backendProcess = spawn("(cd ./usb/bajacorev1; npm dev  > frontend.log)");

    console.log("Started DAQ!");
}

async function onDetach() {
    frontendProcess.kill();
    backendProcess.kill();
    await execShell(`umount -l ./usb`);
    currentMount = null;

    console.log("Killed DAQ!");
}

setInterval(pollUSB, 1000);


function execShell(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}
