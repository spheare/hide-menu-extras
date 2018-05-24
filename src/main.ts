const { app, Menu, Tray, dialog } = require('electron');

type FNCallback = () => any;

interface IBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}
interface IElectronTrayIcon {
	setHighlightMode(mode: string): void;
	on(event: string, cb: FNCallback): void;
	setToolTip(tip: string): void;
	setTitle(tip: string): void;
	setImage(url: string): void;
	setPressedImage(url: string): void;
	getBounds(): IBounds;
}

class HideMenuExtraApp {
	protected AUTOHIDE_TIMEOUT: number = 15;
	protected get SPACER_URL(): string {
		return this.m_hPath.join(__dirname, 'spacer.png');
	}
	protected get SPACER_MOVE_URL(): string {
		return this.m_hPath.join(__dirname, 'dotTemplate.png');
	}
	protected get MENU_EXPAND_URL(): string {
		return this.m_hPath.join(__dirname, 'expandTemplate.png');
	}
	protected get MENU_COLLAPSE_URL(): string {
		return this.m_hPath.join(__dirname, 'collapseTemplate.png');
	}
	protected get MENU_EXPAND_PRESSED_URL(): string {
		return this.m_hPath.join(__dirname, 'expandPushedTemplate.png');
	}
	protected get MENU_COLLAPSE_PRESSED_URL(): string {
		return this.m_hPath.join(__dirname, 'collapsePushedTemplate.png');
	}
	protected get MENU_COLLAPSE_COUNT_URLS(): string[] {
		return [ 100, 75, 50, 25 ].map(x => this.m_hPath.join(__dirname, `collapse${x}Template.png`));
	}
	protected static m_hInstance: HideMenuExtraApp;

	protected m_hApp: any;
	protected m_hPath: any;
	protected m_hDialog: any;

	protected m_traySpacer: IElectronTrayIcon = null;
	protected m_trayMenu: IElectronTrayIcon = null;
	protected m_hTimer: NodeJS.Timer = null;
	protected m_bShowAllIcons: boolean = true;

	protected m_nSecondsLeftBeforeHide: number = 0;

	private constructor() {}

	public static get Instance(): HideMenuExtraApp {
		return this.m_hInstance || (this.m_hInstance = new HideMenuExtraApp());
	}

	public run(hApplication, hPath, dialog) {
		this.m_hApp = hApplication;
		this.m_hPath = hPath;
		this.m_hDialog = dialog;

		this.m_hApp.dock.hide();
		this.m_hApp.on('ready', this.OnAppReady.bind(this));
	}

	protected OnAppReady(): void {
		this.createMenuIcon();
		this.createSpacerIcon();
		this.showIconMode(true);
		this.enableCountdownTimer();
		setInterval(this.verifyIconsAccessible.bind(this), 2000);
	}

	protected createSpacerIcon() {
		this.m_traySpacer = new Tray(this.m_bShowAllIcons ? this.SPACER_MOVE_URL : this.SPACER_URL);
		this.m_traySpacer.setHighlightMode('never');
		this.m_traySpacer.on('click', this.OnClickSpacerIcon.bind(this));
	}
	protected createMenuIcon() {
		this.m_trayMenu = new Tray(this.MENU_EXPAND_URL);
		this.m_trayMenu.setPressedImage(this.MENU_EXPAND_PRESSED_URL);
		this.m_trayMenu.setHighlightMode('never');
		this.m_trayMenu.on('click', this.OnClickMenuIcon.bind(this));
		this.m_trayMenu.on('right-click', this.OnRightClickMenuIcon.bind(this));
	}

	protected checkBounds(): boolean {
		const rcMenu: IBounds = this.m_trayMenu.getBounds(),
			rcSpacer: IBounds = this.m_traySpacer.getBounds();
		return rcMenu.x >= rcSpacer.x;
	}

	protected OnClickMenuIcon(): void {
		this.m_bShowAllIcons = this.showIconMode(!this.m_bShowAllIcons);
		if (this.m_bShowAllIcons) this.enableCountdownTimer();
		else this.cancelCountdownTimer();
	}
	protected OnClickSpacerIcon(): void {
		// toggle between canceling the autohide timer and hiding the icons
		if (this.m_hTimer) {
			this.cancelCountdownTimer();
			this.showIconMode(this.m_bShowAllIcons); // toggle current icon again (ie: clear count down image)
		} else
			this.m_bShowAllIcons = this.showIconMode(!this.m_bShowAllIcons);
	}
	protected OnRightClickMenuIcon(): void {
		this.m_hApp.quit();
	}

	protected showIconMode(bShowAll): boolean {
		if (!this.checkBounds() && !bShowAll) return !bShowAll;

		this.m_traySpacer.setImage(bShowAll ? this.SPACER_MOVE_URL : this.SPACER_URL);
		this.m_trayMenu.setImage(bShowAll ? this.MENU_COLLAPSE_URL : this.MENU_EXPAND_URL);
		this.m_trayMenu.setPressedImage(bShowAll ? this.MENU_COLLAPSE_PRESSED_URL : this.MENU_EXPAND_PRESSED_URL);

		return bShowAll;
	}

	protected cancelCountdownTimer(): void {
		if (!this.m_hTimer) return;

		clearInterval(this.m_hTimer);
		this.m_hTimer = null;
	}
	protected enableCountdownTimer(): void {
		const IMAGES = this.MENU_COLLAPSE_COUNT_URLS;
		const updateTrayIcon = secondsLeft => {
			const index = Math.max(
				0,
				IMAGES.length - 1 - Math.round((IMAGES.length - 1) * (secondsLeft / this.AUTOHIDE_TIMEOUT))
			);
			console.log(index, IMAGES,IMAGES[index]);
			this.m_trayMenu.setImage(IMAGES[index]);
		};

		this.cancelCountdownTimer();
		this.m_nSecondsLeftBeforeHide = this.AUTOHIDE_TIMEOUT;
		updateTrayIcon(this.m_nSecondsLeftBeforeHide);
		this.m_hTimer = setInterval(() => {
			updateTrayIcon(--this.m_nSecondsLeftBeforeHide);
			if (this.m_nSecondsLeftBeforeHide <= 0) {
				this.cancelCountdownTimer();
				this.m_bShowAllIcons = this.showIconMode(false);
			}
		}, 1000);
	}

	protected verifyIconsAccessible(): void {
		if (this.checkBounds()) return;

		this.m_bShowAllIcons = this.showIconMode(true);
		this.m_hDialog.showMessageBox({
			type: 'error',
			title: 'Hide Menu Extras',
			message: 'Please make sure the Arrow is always positioned after (to the right side of) the dot spacer.'
		});
	}
}

HideMenuExtraApp.Instance.run(app, require('path'), dialog);
