parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd ./usb/daq-prebuilt/dist || exit;
echo "Starting..."
export HTTP_PORT=80
export DAQ_DATA_DIR="${parent_path}/usb"
sudo n exec 17 node index.js
