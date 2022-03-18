cd ./usb/bajafrontendv1 || exit;
echo "Updating. This might take a WHILE."
sudo -u pi npm i;

echo "Starting..."
sudo -u pi npm run start
