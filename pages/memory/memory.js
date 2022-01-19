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
    noticeData: wx.getStorageSync('noticeData') ? wx.getStorageSync('noticeData') : '', // 公告栏数据(最多40个汉字,尽量20个以内)
    memorySum: wx.getStorageSync('memoryList') ? wx.getStorageSync('memoryList').length : 0, // 回忆总数
    memoryList: wx.getStorageSync('memoryList') ? wx.getStorageSync('memoryList') : [] // 回忆列表
  },

  /**
   * 页面创建时执行
   */
  async onLoad() {
    let that = this;
    // await that.getMemoryListFromCloud();
    // that.getNoticeDataFromCloud();
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
   * @param {Object} e 点击事件的对象
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
   * @param {Object} e 点击事件的对象
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
        .then(async (res) => {
          if (res.result && res.result.result) {
            await that.checkLocalPicPath(res.result.memoryList);
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
   * 检测本地图片路径是否存在
   * @param {Array} memoryList 回忆列表
   */
  async checkLocalPicPath(memoryList) {
    let that = this;
    let bigProArr = []; // 大循环promise
    let smallProArr = []; // 小循环promise
    let updateType = false; // 是否向云端更新回忆
    for (let i = 0; i < memoryList.length; i++) {
      bigProArr[i] = new Promise(async function (resolve, reject) {
        for (let j = 0; j < memoryList[i].cloudPicPathList.length; j++) {
          smallProArr[j] = new Promise(async function (resolve, reject) {
            if (memoryList[i].localPicPathList[j] == undefined) {
              await wx.cloud.downloadFile({
                  fileID: memoryList[i].cloudPicPathList[j]
                })
                .then(res => {
                  memoryList[i].localPicPathList[j] = res.tempFilePath;
                  updateType = true;
                  resolve(true);
                })
                .catch(res => {
                  resolve(true);
                })
            } else {
              await wx.getImageInfo({
                  src: memoryList[i].localPicPathList[j]
                })
                .then(res => {
                  resolve(true);
                })
                .catch(async (res) => {
                  await wx.cloud.downloadFile({
                      fileID: memoryList[i].cloudPicPathList[j]
                    })
                    .then(res => {
                      memoryList[i].localPicPathList[j] = res.tempFilePath;
                      updateType = true;
                      resolve(true);
                    })
                    .catch(res => {
                      resolve(true);
                    })
                })
            }
          })
        }
        await Promise.all(smallProArr);
        resolve(true)
      })
    }
    await Promise.all(bigProArr).then(async (res) => {
      console.log("是否需要更新回忆:" + updateType);
      if (updateType == true) await that.updateMemoryListToCloud(memoryList);
    })
  },

  /**
   * 向云端更新回忆列表
   * @param {Array} memoryList 回忆列表
   */
  async updateMemoryListToCloud(memoryList) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateMemoryListByOpenId',
          data: {
            memoryList: memoryList
          }
        })
        .then(async (res) => {
          if (res.result && res.result.result) {
            that.setData({
              memoryList: memoryList,
              memorySum: memoryList.length
            })
            wx.setStorageSync('memoryList', memoryList);
            resolve(true);
          } else {
            that.setData({
              memoryList: [],
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
   * 从云端获取公告数据
   */
  getNoticeDataFromCloud() {
    let that = this;
    const db = wx.cloud.database();
    const notice = db.collection('notice');
    notice.where({
        _id: '8937eaa9613daffc0aa0e12b080c9859'
      })
      .get({
        success(res) {
          if (res.data[0] && res.data[0].noticeData && res.data[0].noticeData[0]) {
            let noticeData = res.data[0].noticeData[0].notice;
            that.setData({
              noticeData: noticeData
            })
            wx.setStorageSync('noticeData', noticeData);
          }
        }
      })
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