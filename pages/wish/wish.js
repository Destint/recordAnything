/**
 * @file "心愿"页面
 * @author Trick 2022-04-18
 */
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showPopup: false, // 是否显示弹出窗口(true可以防止弹窗穿透)
    notice: wx.getStorageSync('notice') ? wx.getStorageSync('notice') : '', // 公告栏数据(最多40个汉字,尽量20个以内)
    wishSum: wx.getStorageSync('wishSum') ? wx.getStorageSync('wishSum') : 0, // 心愿总数
    wishList: wx.getStorageSync('wishList') ? wx.getStorageSync('wishList') : [], // 心愿列表
    showAddWishView: false, // 显示添加心愿页面
    addWishContent: '', // 添加心愿的内容
  },

  reachBottomState: false, // 上拉触底状态(防止多次上拉)

  /**
   * 页面创建时执行
   */
  async onLoad() {
    let that = this;
    wx.showShareMenu();
    that.getNotice();
    wx.showLoading({
      title: '载入心愿中',
      mask: true
    })
    await that.getWishList(0);
    wx.hideLoading();
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
      title: '记你所记 想你所想',
      path: '/pages/memory/memory',
      imageUrl: '/images/img_logo.png'
    };
  },

  /**
   * 触发下拉刷新时执行
   */
  async onPullDownRefresh() {
    let that = this;
    that.getNotice();
    await that.getWishList(0);
    wx.stopPullDownRefresh();
  },

  /**
   * 触发上拉触底时执行
   */
  async onReachBottom() {
    let that = this;
    let currentIndex = that.data.wishList.length;
    if (currentIndex === that.data.wishSum || that.reachBottomState) return;
    that.reachBottomState = true;
    await that.getWishList(currentIndex);
    that.reachBottomState = false;
  },

  /**
   * 获取公告
   */
  getNotice() {
    let that = this;
    wx.cloud.callFunction({
        name: 'getNotice'
      })
      .then(res => {
        if (res.result && res.result.result) {
          that.setData({
            notice: res.result.notice
          })
          wx.setStorageSync('notice', res.result.notice);
        }
      })
      .catch(error => {})
  },

  /**
   * 获取心愿列表
   * @param {Number} currentIndex 每次只获取索引值后(云函数中配置)条数据
   */
  async getWishList(currentIndex) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getWishList',
          data: {
            currentIndex: currentIndex
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            let partialWishList = that.getWishDuration(res.result.partialWishList);
            if (currentIndex === 0) {
              that.setData({
                wishSum: res.result.wishSum,
                wishList: partialWishList
              })
              wx.setStorageSync('wishSum', res.result.wishSum);
              wx.setStorageSync('wishList', partialWishList);
            } else {
              let wishList = that.data.wishList;
              wishList = wishList.concat(partialWishList);
              that.setData({
                wishList: wishList
              })
            }
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
  },

  /**
   * 获取心愿完成的持续时间
   * @param {Array} wishList 心愿列表
   */
  getWishDuration(wishList) {
    for (let i = 0; i < wishList.length; i++) {
      let startDate = wishList[i].startDate;
      let endDate = wishList[i].finishDate ? wishList[i].finishDate : wishList[i].giveUpDate;
      let state = wishList[i].state;
      if (state === true && startDate && endDate) {
        let duration = (new Date(endDate.replace(/-/g, '/')).getTime() - new Date(startDate.replace(/-/g, '/')).getTime()) / 1000;
        if (duration < 60) duration = duration.toFixed(1) + "秒";
        else {
          duration = duration / 60;
          if (duration < 60) duration = duration.toFixed(1) + "分钟";
          else {
            duration = duration / 60;
            if (duration < 24) duration = duration.toFixed(1) + "小时";
            else duration = (duration / 24).toFixed(1) + "天";
          }
        }
        wishList[i].duration = duration;
      }
    }
    return wishList;
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
          content: '确定添加该心愿吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(async res => {
          if (res.confirm) {
            wx.showLoading({
              title: '添加中...',
              mask: true
            })
            await that.uploadWish(that.data.addWishContent);
            that.setData({
              addWishContent: '',
              showPopup: false,
              showAddWishView: false
            })
            wx.hideLoading();
            wx.showToast({
              title: '添加成功',
              icon: 'none',
              duration: 1500
            })
          }
        })
    }
  },

  /**
   * 上传心愿
   * @param {String} wish 上传的心愿
   */
  async uploadWish(wish) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadWish',
          data: {
            wish: wish
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            let partialWishList = that.getWishDuration(res.result.partialWishList);
            that.setData({
              wishList: partialWishList,
              wishSum: res.result.wishSum
            })
            wx.setStorageSync('wishList', partialWishList);
            wx.setStorageSync('wishSum', res.result.wishSum);
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
  },

  /**
   * 点击编辑心愿
   * @param {Object} e 点击事件的对象
   */
  onClickEditorWish(e) {
    let that = this;
    let wish = e.currentTarget.dataset.data;
    if (wish.state) {
      wx.showActionSheet({
        itemList: ['删除心愿'],
        success(res) {
          if (res.tapIndex === 0) that.onClickWishDelete(wish.id)
        },
        fail(res) {}
      })
    } else {
      wx.showActionSheet({
        itemList: ['完成心愿', '放弃心愿', '删除心愿'],
        success(res) {
          if (res.tapIndex === 0) that.onClickWishFinish(wish.id)
          else if (res.tapIndex === 1) that.onClickWishGiveUp(wish.id);
          else if (res.tapIndex === 2) that.onClickWishDelete(wish.id);
        },
        fail(res) {}
      })
    }
  },

  /**
   * 点击完成心愿
   * @param {Number} wishId 心愿id
   */
  onClickWishFinish(wishId) {
    let that = this;

    wx.showModal({
        title: '温馨提示',
        content: '确定完成该心愿吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(async res => {
        if (res.confirm) {
          wx.showLoading({
            title: '完成中...',
            mask: true
          })
          await that.updateWish(wishId, 1);
          wx.hideLoading();
          wx.showToast({
            title: '已完成心愿',
            icon: 'none',
            duration: 1500
          })
        }
      })
  },

  /**
   * 点击放弃心愿
   * @param {Number} wishId 心愿id
   */
  onClickWishGiveUp(wishId) {
    let that = this;

    wx.showModal({
        title: '温馨提示',
        content: '确定放弃该心愿吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(async res => {
        if (res.confirm) {
          wx.showLoading({
            title: '放弃中...',
            mask: true
          })
          await that.updateWish(wishId, 3);
          wx.hideLoading();
          wx.showToast({
            title: '放弃成功',
            icon: 'none',
            duration: 1500
          })
        }
      })
  },

  /**
   * 点击删除心愿
   * @param {Number} wishId 心愿id
   */
  onClickWishDelete(wishId) {
    let that = this;

    wx.showModal({
        title: '温馨提示',
        content: '确定删除该心愿吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(async res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          })
          await that.updateWish(wishId, 2);
          wx.hideLoading();
          wx.showToast({
            title: '删除成功',
            icon: 'none',
            duration: 1500
          })
        }
      })
  },

  /**
   * 更新心愿
   * @param {Number} wishId 更新心愿的id
   * @param {Number} wishState 更新心愿的状态(1 完成 2 删除 3 放弃)
   */
  async updateWish(wishId, wishState) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateWish',
          data: {
            wishId: wishId,
            wishState: wishState
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            let partialWishList = that.getWishDuration(res.result.partialWishList);
            that.setData({
              wishList: partialWishList,
              wishSum: res.result.wishSum
            })
            wx.setStorageSync('wishList', partialWishList);
            wx.setStorageSync('wishSum', res.result.wishSum);
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
  },

  /**
   * 显示错误提示
   */
  showErrorTip() {
    wx.showToast({
      title: '网络异常请重试',
      icon: 'error',
      duration: 2000
    })
  },
});