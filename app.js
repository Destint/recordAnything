/**
 * @file 回忆录
 * @author Trick 2022-01-14 17:20
 */
App({
  onLaunch() {
    let that = this;
    // 云开发初始化
    wx.cloud.init({
      env: 'zxj-8gnakc5c52888d77',
      traceUser: true
    })
    that.checkVersionUpdate();
    that.updateAccessToCloud();
  },

  /**
   * 检测小程序版本更新
   */
  checkVersionUpdate() {
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
   * 更新用户访问记录到云端
   */
  updateAccessToCloud() {
    wx.cloud.callFunction({
        name: 'updateAccessByOpenId',
      })
      .then(res => {})
      .catch(error => {})
  },

  /**
   * 小程序的全局数据
   */
  globalData: {}
})