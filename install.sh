sudo apt install git -y
sudo apt-get install libudev-dev -y # Used for usb

# Install the n node version manager https://github.com/tj/n
curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n
sudo bash n lts
sudo npm install -g n

sudo n 17
npm install # Install bootstrapper deps

#Set up the service.
sudo systemctl disable daq-bootstrap

sudo cp ./daq-bootstrap.service /etc/systemd/system/
#sudo systemctl start daq-bootstrap
#sudo systemctl enable daq-bootstrap
