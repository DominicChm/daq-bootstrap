cd ./usb/bajacorev1 || exit;
echo "Updating. This might take a WHILE."
sudo -u pi npm i;

echo "Starting..."
sudo -u pi npm run dev
