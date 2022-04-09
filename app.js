/**
 * @file 回忆录
 * @author Trick 2022-04-07
 */
App({
  onLaunch() {
    let that = this;
    // 云开发初始化
    wx.cloud.init({
      env: 'zxj-8gnakc5c52888d77',
      traceUser: true
    })
    that.checkVersion();
    that.uploadAccess();
  },

  /**
   * 检查版本
   */
  checkVersion() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            updateManager.applyUpdate(); // 更新小程序
          })
        }
      })
    }
  },

  /**
   * 上传访问记录
   */
  uploadAccess() {
    wx.cloud.callFunction({
        name: 'uploadAccess',
      })
      .then(res => {})
      .catch(error => {})
  },

  /**
   * 小程序的全局数据
   */
  globalData: {}
})