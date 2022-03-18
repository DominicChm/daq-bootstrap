const {usb} = require("usb");
console.log(usb.getDeviceList());

usb.on("attach", console.log);
usb.on("detach", console.log);
