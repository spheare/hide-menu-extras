"use strict";
const { app, Menu, Tray, dialog } = require('electron');
class HideMenuExtraApp {
    constructor() {
        this.AUTOHIDE_TIMEOUT = 15000;
        this.m_traySpacer = null;
        this.m_trayMenu = null;
        this.m_hTimer = null;
        this.m_bShowAllIcons = true;
    }
    get SPACER_URL() {
        return this.m_hPath.join(__dirname, 'spacer.png');
    }
    get SPACER_MOVE_URL() {
        return this.m_hPath.join(__dirname, 'dotTemplate.png');
    }
    get MENU_EXPAND_URL() {
        return this.m_hPath.join(__dirname, 'expandTemplate.png');
    }
    get MENU_COLLAPSE_URL() {
        return this.m_hPath.join(__dirname, 'collapseTemplate.png');
    }
    get MENU_EXPAND_PRESSED_URL() {
        return this.m_hPath.join(__dirname, 'expandPushedTemplate.png');
    }
    get MENU_COLLAPSE_PRESSED_URL() {
        return this.m_hPath.join(__dirname, 'collapsePushedTemplate.png');
    }
    static get Instance() {
        return this.m_hInstance || (this.m_hInstance = new HideMenuExtraApp());
    }
    run(hApplication, hPath, dialog) {
        this.m_hApp = hApplication;
        this.m_hPath = hPath;
        this.m_hDialog = dialog;
        this.m_hApp.dock.hide();
        this.m_hApp.on('ready', this.OnAppReady.bind(this));
    }
    OnAppReady() {
        this.createMenuIcon();
        this.createSpacerIcon();
        this.showIconMode(true);
        setInterval(this.verifyIconsAccessible.bind(this), 2000);
    }
    createSpacerIcon() {
        this.m_traySpacer = new Tray(this.m_bShowAllIcons ? this.SPACER_MOVE_URL : this.SPACER_URL);
        this.m_traySpacer.setHighlightMode('never');
        this.m_traySpacer.on('click', this.OnClickSpacerIcon.bind(this));
    }
    createMenuIcon() {
        this.m_trayMenu = new Tray(this.MENU_EXPAND_URL);
        this.m_trayMenu.setPressedImage(this.MENU_EXPAND_PRESSED_URL);
        this.m_trayMenu.setHighlightMode('never');
        this.m_trayMenu.on('click', this.OnClickMenuIcon.bind(this));
        this.m_trayMenu.on('right-click', this.OnRightClickMenuIcon.bind(this));
        // const contextMenu = Menu.buildFromTemplate([
        // 	{ label: 'Move items', click: () => toggleShowIconMode() },
        // 	{ type: 'separator' },
        // 	{ role: 'quit' }
        // ]);
        // this.m_trayMenu.setContextMenu(contextMenu);
    }
    checkBounds() {
        const rcMenu = this.m_trayMenu.getBounds(), rcSpacer = this.m_traySpacer.getBounds();
        return rcMenu.x >= rcSpacer.x;
    }
    OnClickMenuIcon() {
        this.m_bShowAllIcons = this.showIconMode(!this.m_bShowAllIcons);
        if (this.m_bShowAllIcons)
            this.resetAutoHideTimer();
    }
    OnClickSpacerIcon() {
        this.m_bShowAllIcons = this.showIconMode(!this.m_bShowAllIcons);
    }
    OnRightClickMenuIcon() {
        this.m_hApp.quit();
    }
    showIconMode(bShowAll) {
        if (!this.checkBounds() && !bShowAll)
            return !bShowAll;
        this.m_traySpacer.setImage(bShowAll ? this.SPACER_MOVE_URL : this.SPACER_URL);
        this.m_trayMenu.setImage(bShowAll ? this.MENU_COLLAPSE_URL : this.MENU_EXPAND_URL);
        this.m_trayMenu.setPressedImage(bShowAll ? this.MENU_COLLAPSE_PRESSED_URL : this.MENU_EXPAND_PRESSED_URL);
        return bShowAll;
    }
    resetAutoHideTimer() {
        if (this.m_hTimer)
            clearTimeout(this.m_hTimer);
        this.m_hTimer = setTimeout(() => {
            this.m_hTimer = null;
            this.m_bShowAllIcons = this.showIconMode(false);
        }, this.AUTOHIDE_TIMEOUT);
    }
    verifyIconsAccessible() {
        if (this.checkBounds())
            return;
        this.m_bShowAllIcons = this.showIconMode(true);
        this.m_hDialog.showMessageBox({
            type: 'error',
            title: 'Hide Menu Extras',
            message: 'Please make sure the Arrow is always positioned after (to the right side of) the dot spacer.'
        });
    }
}
HideMenuExtraApp.Instance.run(app, require('path'), dialog);
