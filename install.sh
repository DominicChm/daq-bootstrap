sudo apt install git -y
sudo apt-get install libudev-dev -y # Used for usb


if ! command -v nvm &> /dev/null
then
  echo "Installing nvm..."
  # Setup node.js
  wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

  nvm install 17
  nvm use 17
fi

npm install

#Set up the service.
sudo systemctl disable daq-bootstrap

sudo cp ./daq-bootstrap.service /etc/systemd/system/
sudo systemctl start daq-bootstrap
sudo systemctl enable daq-bootstrap
