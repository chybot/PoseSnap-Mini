App({
  globalData: {
    themeColor: '#FF6B6B',
    version: '1.0.0',
    systemInfo: null,
    screenWidth: 375,
    screenHeight: 667,
    statusBarHeight: 44,
    navBarHeight: 88,
  },

  onLaunch() {
    try {
      const systemInfo = wx.getWindowInfo()
      if (systemInfo) {
        this.globalData.systemInfo = systemInfo
        this.globalData.screenWidth = systemInfo.screenWidth || 375
        this.globalData.screenHeight = systemInfo.screenHeight || 667
        this.globalData.statusBarHeight = systemInfo.statusBarHeight || 44
        this.globalData.navBarHeight = (systemInfo.statusBarHeight || 44) + 44
      }
    } catch (e) {
      console.warn('[App] getWindowInfo failed:', e)
    }
  },
})
