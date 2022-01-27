/**
 * Page: mine
 * Author: Trick
 * Date: 2022-01-24
 */
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showPopup: false, // 是否显示弹出窗口(true可以防止弹窗穿透)
    showFeedback: false, // 是否显示意见反馈
    showSetNotice: false, // 显示设置公告
    localPicPathList: [], // 本地图片路径列表
    cloudPicPathList: [], // 云端图片路径列表
    feedbackContent: '', // 意见反馈内容
    showAboutSelf: false, // 显示关于回忆录
    aboutSelfContent: '这是一个可以《留住回忆》的小程序。\n可选的需要小程序授权的功能：\n1、开启手机和小程序的定位服务，可以在记录回忆时记下当前的位置与天气。\n2、记录回忆时可以从手机相册中选择想要的图片一同记录。\n如果您在使用小程序时遇到任何问题或者您对小程序有更好的建议或想法，欢迎通过《意见反馈》或《联系客服》功能来向开发者反馈。', // 关于回忆录的文本
    praiseState: wx.getStorageSync('praiseState'), // 是否赞美小程序
    praiseSum: wx.getStorageSync('praiseSum') // 赞美小程序的总人数
  },

  uploadFeedbackState: false, // 上传意见反馈的状态(防止两次点击记录回忆)

  /**
   * 页面创建时执行
   */
  onLoad() {
    let that = this;
    wx.showShareMenu();
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
   * 点击意见反馈
   */
  onClickFeedback() {
    let that = this;
    that.setData({
      showPopup: true,
      showFeedback: true
    })
  },

  /**
   * 预览意见反馈的图片
   * @param {Object} e 当前点击的对象
   */
  onPreviewAddPic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: that.data.localPicPathList[index],
      urls: that.data.localPicPathList
    })
  },

  /**
   * 删除已添加的意见反馈的图片
   * @param {object} e 当前点击的对象
   */
  onClickDeletePic(e) {
    let that = this;
    let index = e.currentTarget.dataset.index;
    let localPicPathList = that.data.localPicPathList;
    localPicPathList.splice(index, 1);
    that.setData({
      localPicPathList: localPicPathList
    })
  },

  /**
   * 点击添加图片
   */
  onClickAddPic() {
    let that = this;
    let localPicPathList = that.data.localPicPathList;
    if (localPicPathList.length >= 5) {
      wx.showToast({
        title: '图片最多上传5张',
        icon: 'none',
        duration: 1500
      });
    } else {
      let imgCount = 5 - localPicPathList.length;
      wx.chooseMedia({
        count: imgCount,
        mediaType: ['image'],
        sourceType: ['album'],
        sizeType: ['compressed'],
        success(res) {
          let tempFiles = res.tempFiles;
          for (let i = 0; i < tempFiles.length; i++) {
            localPicPathList.push(tempFiles[i].tempFilePath);
          }
          that.setData({
            localPicPathList: localPicPathList
          })
        }
      })
    }
  },

  /**
   * 意见反馈的内容
   * @param {Object} e 当前点击的对象
   */
  feedbackContent(e) {
    let that = this;
    that.setData({
      feedbackContent: e.detail.value
    })
  },

  /**
   * 意见反馈时点击返回
   */
  onClickBackMine() {
    let that = this;
    wx.showModal({
        title: '温馨提示',
        content: '返回会清空当前意见反馈',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          that.setData({
            showPopup: false,
            showFeedback: false,
            localPicPathList: [],
            feedbackContent: ''
          })
        }
      })
  },

  /**
   * 点击上传意见反馈
   */
  onClickUploadFeedback() {
    let that = this;
    let feedbackContent = that.data.feedbackContent;

    if (feedbackContent == '') {
      wx.showToast({
        title: '反馈内容不能为空',
        icon: 'none',
        duration: 1500
      })
      return;
    }
    if (that.uploadFeedbackState == true) return;
    that.uploadFeedbackState = true;
    wx.showModal({
        title: '温馨提示',
        content: '确定上传您的反馈吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          wx.showLoading({
            title: '上传中...',
            mask: true
          })
          that.startUploadFeedback();
          that.uploadFeedbackState = false;
        } else {
          that.uploadFeedbackState = false;
        }
      })
  },

  /**
   * 开始上传意见反馈
   */
  async startUploadFeedback() {
    let that = this;
    await that.uploadLocalPicListToCloud();
    await that.updateFeedbackToCloud();
    wx.showToast({
      title: '反馈成功',
      icon: 'none',
      duration: 1500
    })
  },

  /**
   * 上传本地图片列表到云端
   */
  async uploadLocalPicListToCloud() {
    let that = this;
    let proArr = []; // promise返回值数组
    let localPicPathList = that.data.localPicPathList;
    for (let i = 0; i < localPicPathList.length; i++) {
      proArr[i] = new Promise(async function (resolve, reject) {
        let currentInfo = await that.getOpenIdFromCloud();
        if (!currentInfo) resolve('');
        wx.cloud.uploadFile({
            cloudPath: currentInfo.openId + '/' + currentInfo.date + '.jpg', // 上传至云端的路径
            filePath: localPicPathList[i], // 上传的临时文件路径
          })
          .then(res => {
            resolve(res.fileID);
          })
          .catch(error => {
            resolve('');
          })
      })
    }
    await Promise.all(proArr).then((res) => {
      //全都图片都上传成功后
      that.setData({
        cloudPicPathList: res
      })
    }).catch((err) => {})
  },

  /**
   * 从云端获取用户openId
   */
  async getOpenIdFromCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getOpenId'
        })
        .then(res => {
          if (res.result && res.result.result) {
            resolve(res.result);
          } else resolve(false);
        })
        .catch(error => {
          resolve(false);
        })
    });
    return await p;
  },

  /**
   * 向云端更新反馈列表
   */
  async updateFeedbackToCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateFeedbackByOpenId',
          data: {
            cloudPicPathList: that.data.cloudPicPathList,
            feedbackContent: that.data.feedbackContent
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
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
    that.setData({
      cloudPicPathList: [],
      feedbackContent: '',
      localPicPathList: [],
      showPopup: false,
      showFeedback: false
    })
    if (!result) that.showErrorTip();
  },

  /**
   * 点击关于回忆录
   */
  onClickAbout() {
    let that = this;
    that.updatePraise(false);
    that.setData({
      showPopup: true,
      showAboutSelf: true
    })
  },

  /**
   * 点击关于回忆页的蒙版
   */
  onClickAboutSelfMask() {
    let that = this;
    that.setData({
      showPopup: false,
      showAboutSelf: false
    })
  },

  /**
   * 点击赞美小程序
   */
  onClickPraise() {
    let that = this;
    if (!that.data.praiseState) that.updatePraise(true);
  },

  /**
   * 更新赞美小程序
   * @param {Boolean} updateState 更新状态
   */
  async updatePraise(updateState) {
    let that = this;
    let praiseData;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updatePraise',
          data: {
            updateState: updateState
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            praiseData = res.result;
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
    if (result && praiseData) {
      that.setData({
        praiseState: praiseData.praiseState,
        praiseSum: praiseData.praiseSum
      })
      wx.setStorageSync('praiseState', praiseData.praiseState);
      wx.setStorageSync('praiseSum', praiseData.praiseSum);
    }
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