/**
 * Page: memory
 * Author: Trick
 * Date: 2022-01-17
 */
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    noticeData: "公告内容", // 公告栏数据(最多40个汉字,尽量20个以内)
    memorySum: wx.getStorageSync('memoryList') ? wx.getStorageSync('memoryList').length : 0, // 回忆总数
    memoryList: wx.getStorageSync('memoryList') ? wx.getStorageSync('memoryList') : [] // 回忆列表
  },

  /**
   * 页面创建时执行
   */
  async onLoad() {
    let that = this;
    await that.getMemoryListFromCloud();
  },

  /**
   * 页面出现在前台时执行
   */
  onShow() {},

  /**
   * 页面从前台变为后台时执行
   */
  onHide() {},

  /**
   * 页面被用户分享时执行
   */
  onShareAppMessage() {},

  /**
   * 触发下拉刷新时执行
   */
  onPullDownRefresh() {},

  /**
   * 点击回忆排序
   */
  onClickMemorySort() {
    console.log("点击回忆排序");
  },

  /**
   * 点击回忆
   * @param {object} e 点击事件的对象
   */
  onClickMemory(e) {
    let memoryData = e.currentTarget.dataset.data; // 点击的回忆数据
    let memoryIndex = e.currentTarget.dataset.index; // 点击的回忆索引
    console.log("点击回忆" + memoryIndex);
  },

  /**
   * 点击添加回忆
   */
  onClickAddMemory() {
    console.log("点击添加回忆");
  },

  /**
   * 点击编辑回忆
   * @param {object} e 点击事件的对象
   */
  onClickEditorMemory(e) {
    let memoryId = e.currentTarget.dataset.id; // 点击的回忆id
    console.log("点击编辑回忆:" + memoryId);
  },

  /**
   * 从云端获取回忆列表
   */
  async getMemoryListFromCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getMemoryListByOpenId',
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              memoryList: res.result.memoryList,
              memorySum: res.result.memoryList.length
            })
            wx.setStorageSync('memoryList', res.result.memoryList);
            resolve(true);
          } else {
            that.setData({
              memoryList: res.result.memoryList,
              memorySum: 0
            })
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
  },

  /**
   * 显示错误提示
   */
  showErrorTip() {
    wx.showToast({
      title: '网络异常请重启',
      icon: 'error',
      duration: 2000
    })
  },
});