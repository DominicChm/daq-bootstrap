const fs = require("fs");
const drivelist = require('drivelist');
const {spawn, execSync, exec} = require("child_process");
const Path = require("path");

let currentMount = null;
let daqProcess = null;

if (!fs.existsSync("./usb")) {
    fs.mkdirSync("./usb");
}
try {
    execSync(`umount ./usb`);
} catch (e) {
    console.log("No need to unmount...");
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
    console.log("USB Connected...");

    if (driveType(`${drive.device}1`) !== "ntfs")
        throw new Error("ERROR - THIS DRIVE IS NOT NTFS FORMATTED!");

    execSync(`mount -o big_writes,umask=0 ${drive.device}1 ./usb`);
    currentMount = drive.device;

    if (!fs.existsSync("./usb/daq-prebuilt")) {
        console.log("No prebuilt repo detected, cloning and installing...");
        execSync("(cd ./usb; git clone https://github.com/DominicChm/daq-prebuilt.git)", {stdio: 'inherit'});
        execSync("(cd ./usb/daq-prebuilt; npm run pi-install)", {stdio: 'inherit'})
    }

    // Try to update the code, if we have a network connection.
    try {
        execSync("(cd ./usb/daq-prebuilt; git pull)");
    } catch (e) {
        console.log("Couldn't update.");
    }

    console.log("Starting DAQ process...")

    daqProcess = spawn("sh", ["start-daq.sh"], {
        stdio: 'pipe',
        env: {
            HTTP_PORT: 80,
            DAQ_DATA_DIR: Path.resolve(__dirname, ".."),
        }
    });
    daqProcess.stdout.on("data", (data) => {
        console.log(data.toString().trim());
    });
    daqProcess.stderr.on('data', (data) => {
        console.error(data);
    });

    console.log("Started DAQ!");
}

async function onDetach() {
    console.log("Detached... killing DAQ!");

    daqProcess.kill();
    execSync(`umount -l ./usb`);
    currentMount = null;
    daqProcess = null;

    console.log("Killed DAQ!");
}

function driveType(fsLabel) {
    return execSync(`sudo blkid -s TYPE -o value ${fsLabel}`).toString().trim();
}

setInterval(pollUSB, 1000);


function killAll() {
    if (daqProcess) daqProcess.kill();
}

process.on('exit', function () {
    killAll();
});

process.on('uncaughtException', err => {
    console.error('There was an uncaught error', err);
    killAll();
    process.exit(1) //mandatory (as per the Node.js docs)
})
