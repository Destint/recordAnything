/**
 * Page: wish
 * Author: Trick
 * Date: 2022-03-09
 */
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showPopup: false, // 是否显示弹出窗口(true可以防止弹窗穿透)
    noticeData: wx.getStorageSync('noticeData') ? wx.getStorageSync('noticeData') : '', // 公告栏数据(最多40个汉字,尽量20个以内)
    wishSum: wx.getStorageSync('wishList') ? wx.getStorageSync('wishList').length : 0, // 心愿总数
    wishList: wx.getStorageSync('wishList') ? wx.getStorageSync('wishList') : [], // 心愿列表
    showAddWishView: false, // 显示添加心愿页面
    addWishContent: '', // 添加心愿的内容
  },

  /**
   * 页面创建时执行
   */
  async onLoad() {
    let that = this;
    wx.showShareMenu();
    that.getNoticeDataFromCloud();
    wx.showLoading({
      title: '载入心愿中',
      mask: true
    })
    await that.getWishListFromCloud();
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
  onShareAppMessage() {
    return {
      title: '回忆录-所记往事皆为回忆',
      path: '/pages/memory/memory',
      imageUrl: '/images/img_logo.png'
    };
  },

  /**
   * 触发下拉刷新时执行
   */
  onPullDownRefresh() {
    let that = this;
    that.getNoticeDataFromCloud();
    wx.stopPullDownRefresh();
  },

  /**
   * 从云端获取心愿列表
   */
  async getWishListFromCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getWishListByOpenId',
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              wishList: res.result.wishList,
              wishSum: res.result.wishList.length
            })
            wx.setStorageSync('wishList', res.result.wishList);
            resolve(true);
          } else {
            that.setData({
              wishList: [],
              wishSum: 0
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
    wx.hideLoading();
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
   * 点击心愿排序
   */
  onClickWishSort() {
    let that = this;
    let wishList = that.data.wishList;
    that.setData({
      wishList: wishList.reverse()
    })
  },

  /**
   * 点击添加心愿
   */
  onClickAddWish() {
    let that = this;
    that.setData({
      showPopup: true,
      showAddWishView: true
    })
  },

  /**
   * 触碰心愿结束
   * @param {Object} e 点击事件的对象
   */
  touchWishEnd(e) {
    let that = this;
    let index = e.currentTarget.dataset.data;
    let wishList = 'wishList[' + index + '].set';

    that.setData({
      [wishList]: false
    })
  },

  /**
   * 点击编辑心愿
   * @param {Object} e 点击事件的对象
   */
  onClickEditorWish(e) {
    let that = this;
    let index = e.currentTarget.dataset.data;
    let wishList = 'wishList[' + index + '].set';

    that.setData({
      [wishList]: true
    })
  },

  /**
   * 点击完成心愿
   */
  onClickWishFinish(e) {
    let that = this;
    let wishId = e.currentTarget.dataset.data;

    wx.showModal({
        title: '温馨提示',
        content: '确定完成该心愿吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          wx.showLoading({
            title: '完成中...',
          })
          that.startFinishWish(wishId);
        }
      })
  },

  /**
   * 点击删除心愿
   */
  onClickWishDelete(e) {
    let that = this;
    let wishId = e.currentTarget.dataset.data;

    wx.showModal({
        title: '温馨提示',
        content: '确定删除该心愿吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
          })
          that.startDeleteWish(wishId);
        }
      })
  },

  /**
   * 点击未完成心愿
   */
  onClickWishUnfinish(e) {
    let that = this;
    let wishId = e.currentTarget.dataset.data;

    wx.showModal({
        title: '温馨提示',
        content: '确定还原该心愿吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          wx.showLoading({
            title: '还原中...',
          })
          that.startUnfinishWish(wishId);
        }
      })
  },

  /**
   * 点击添加心愿页蒙版
   */
  onClickAddWishMask() {
    let that = this;
    that.setData({
      showPopup: false,
      showAddWishView: false,
      addWishContent: ''
    })
  },

  /**
   * 点击上传心愿
   */
  onClickUploadWish() {
    let that = this;
    if (!that.data.addWishContent) {
      wx.showToast({
        title: '心愿内容不能为空',
        icon: 'none'
      })
    } else {
      wx.showModal({
          title: '温馨提示',
          content: '确定添加心愿吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(res => {
          if (res.confirm) {
            wx.showLoading({
              title: '添加中...',
            })
            that.startUploadWish();
          }
        })
    }
  },

  /**
   * 添加心愿的内容
   * @param {Object} e 当前点击的对象
   */
  addWishContent(e) {
    let that = this;
    that.setData({
      addWishContent: e.detail.value
    })
  },

  /**
   * 开始上传心愿
   */
  async startUploadWish() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'addWishByOpenId',
          data: {
            wish: that.data.addWishContent
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              wishList: res.result.wishList,
              wishSum: res.result.wishList.length,
              addWishContent: '',
              showPopup: false,
              showAddWishView: false
            })
            wx.setStorageSync('wishList', res.result.wishList);
            resolve(true);
          } else {
            that.setData({
              addWishContent: '',
              showPopup: false,
              showAddWishView: false
            })
            resolve(false);
          }
        })
        .catch(error => {
          that.setData({
            addWishContent: '',
            showPopup: false,
            showAddWishView: false
          })
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
    wx.hideLoading();
    wx.showToast({
      title: '添加成功',
      icon: 'none',
      duration: 1500
    })
  },

  /**
   * 开始删除心愿
   * @param {Number} wishId 心愿id
   */
  async startDeleteWish(wishId) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateWishById',
          data: {
            wishId: wishId,
            type: 'delete'
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              wishList: res.result.wishList,
              wishSum: res.result.wishList.length
            })
            wx.setStorageSync('wishList', res.result.wishList);
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
    wx.hideLoading();
    wx.showToast({
      title: '删除成功',
      icon: 'none',
      duration: 1500
    })
  },

  /**
   * 开始完成心愿
   * @param {Number} wishId 心愿id
   */
  async startFinishWish(wishId) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateWishById',
          data: {
            wishId: wishId,
            type: 'finish'
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              wishList: res.result.wishList,
              wishSum: res.result.wishList.length
            })
            wx.setStorageSync('wishList', res.result.wishList);
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
    wx.hideLoading();
    wx.showToast({
      title: '完成心愿',
      icon: 'none',
      duration: 1500
    })
  },

  /**
   * 开始还原心愿
   * @param {Number} wishId 心愿id
   */
  async startUnfinishWish(wishId) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateWishById',
          data: {
            wishId: wishId,
            type: 'unfinish'
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              wishList: res.result.wishList,
              wishSum: res.result.wishList.length
            })
            wx.setStorageSync('wishList', res.result.wishList);
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    let result = await p;
    if (!result) that.showErrorTip();
    wx.hideLoading();
    wx.showToast({
      title: '还原成功',
      icon: 'none',
      duration: 1500
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