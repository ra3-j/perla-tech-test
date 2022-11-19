const {app, BrowserWindow,Menu} = require('electron');
const path = require('path');
let mainWindow;
const isDev = process.env.NODE_ENV !== 'development';
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true;
const isMac = process.platForm === 'darwin';

function createMainWindow () {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
    
  });
  if(isDev){
    mainWindow.webContents.openDevTools();
}
  mainWindow.loadFile('renderer/index.html');
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

const menu =[
  {
      label:'File',
      submenu:[
          {
              label:'Quit',
              click:()=>app.quit(),
              accelerator:'Ctrl+X',
          }
      ]
  },
]

app.whenReady().then(()=>{
  createMainWindow();
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);
  app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
          createMainWindow();
      }
    })
}
)
app.on('window-all-closed', function () {
  if (!isMac) app.quit()
});

app.on('activate', function () {
  if (mainWindow === null) createMainWindow()
});
