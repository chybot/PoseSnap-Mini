App({
  globalData: {
    themeColor: '#FF6B6B',
    version: '1.0.0',
    systemInfo: null,
    screenWidth: 375,
    screenHeight: 667,
  },

  onLaunch() {
    const systemInfo = wx.getWindowInfo()
    this.globalData.systemInfo = systemInfo
    this.globalData.screenWidth = systemInfo.screenWidth
    this.globalData.screenHeight = systemInfo.screenHeight
  },
})
