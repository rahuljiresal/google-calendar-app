const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('fs');
const windowStateKeeper = require('electron-window-state');

// The main window
let win = null;
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (myWindow) {
      if (myWindow.isMinimized()) myWindow.restore()
      myWindow.focus()
    }
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('ready', () => {
    // Load the previous state with fallback to defaults
    let mainWindowState = windowStateKeeper({
      defaultWidth: 1024,
      defaultHeight: 768
    });

    win = new BrowserWindow({
      'x': mainWindowState.x,
      'y': mainWindowState.y,
      'width': mainWindowState.width,
      'height': mainWindowState.height,
      titleBarStyle: 'hiddenInset',
    });

    // Let us register listeners on the window, so we can update the state
    // automatically (the listeners will be removed when the window is closed)
    // and restore the maximized or full screen state
    mainWindowState.manage(win);
    
    const wc = win.webContents;

    function sendEscape(keyCode) {
      return () => {
        wc.sendInputEvent({ type: 'char', keyCode: 'Esc' });
        wc.sendInputEvent({ type: 'char', keyCode });
      };
    }

    function click(selector) {
      return () => {
        wc.executeJavaScript(`document.querySelector('${selector}').click()`);
      };
    }

    var template = [
      {
        label: 'Google Calendar',
        submenu: [
          { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: sendEscape('s') },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'New Event',
            accelerator: 'CmdOrCtrl+N',
            click: sendEscape('c')
          },
          { label: 'Find', accelerator: 'CmdOrCtrl+F', click: sendEscape('/') },
          {
            label: 'Goto to Today',
            accelerator: 'CmdOrCtrl+T',
            click: sendEscape('t')
          },
          { type: 'separator' },
          { label: 'Refresh', accelerator: 'CmdOrCtrl+R', click: sendEscape('r') },
          { label: 'Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => { win.reload(); }},
          { type: 'separator' },
          { label: 'Next', accelerator: 'CmdOrCtrl+Right', click: sendEscape('n') },
          { type: 'separator' },
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
          { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            selector: 'selectAll:'
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { label: 'Day View', accelerator: 'CmdOrCtrl+1', click: sendEscape('1') },
          {
            label: 'Week View',
            accelerator: 'CmdOrCtrl+2',
            click: sendEscape('2')
          },
          {
            label: 'Month View',
            accelerator: 'CmdOrCtrl+3',
            click: sendEscape('3')
          },
          {
            label: 'Custom View',
            accelerator: 'CmdOrCtrl+4',
            click: sendEscape('4')
          },
          {
            label: 'Schedule View',
            accelerator: 'CmdOrCtrl+5',
            click: sendEscape('5')
          },
          {
            label: 'Year View',
            accelerator: 'CmdOrCtrl+6',
            click: sendEscape('6')
          },
          { type: 'separator' },
          {
            label: 'Toggle Sidebar',
            accelerator: 'CmdOrCtrl+.',
            click: click('.gb_ec')
          }
        ]
      }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    wc.on('new-window', (ev, url, name) => {
      ev.preventDefault();
      if (url == 'about:blank') {
        // Create a hidden window (for Hangouts)
        ev.newGuest = new BrowserWindow({ show: false });
      } else {
        // Open URLs in the default browser
        shell.openExternal(url);
      }
    });

    win.loadURL('https://www.google.com/calendar');

    // Inject custom CSS and JavaScript code on dom-ready
    wc.on('dom-ready', () => {
      wc.insertCSS(fs.readFileSync(__dirname + '/inject.css', 'utf8'));
      wc.executeJavaScript(fs.readFileSync(__dirname + '/inject.js', 'utf8'));
    });

    win.on('closed', () => {
      win = null;
    });
  });
}


