/**
 * @file "我的"页面
 * @author Trick 2022-04-18
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
    showSetNoticeView: false, // 显示设置公告页面
    setNoticeContent: '', // 设置公告的内容
    localPicPathList: [], // 本地图片路径列表
    cloudPicPathList: [], // 云端图片路径列表
    feedbackContent: '', // 意见反馈内容
    showAboutSelf: false, // 显示关于回忆录
    aboutSelfContent: '这是一个可以《留住回忆》的小程序。\n可选的需要小程序授权的功能：\n1、开启手机和小程序的定位服务，可以在记录回忆时记下当前的位置与天气。\n2、记录回忆时可以从手机相册中选择想要的图片一同记录。\n如果您在使用小程序时遇到任何问题或者您对小程序有更好的建议或想法，欢迎通过《意见反馈》或《联系客服》功能来向开发者反馈。', // 关于回忆录的文本
    praiseState: wx.getStorageSync('praiseState') ? wx.getStorageSync('praiseState') : false, // 是否赞美小程序
    praiseSum: wx.getStorageSync('praiseSum') ? wx.getStorageSync('praiseSum') : 0, // 赞美小程序的总人数
    userAvatar: wx.getStorageSync('userAvatar') ? wx.getStorageSync('userAvatar') : '', // 用户头像
    setNicknameContent: '', // 设置昵称的内容
    showSetNicknameView: false, // 显示设置昵称页面
    userNickname: wx.getStorageSync('userNickname') ? wx.getStorageSync('userNickname') : '', // 用户头像
  },

  uploadFeedbackState: false, // 上传意见反馈的状态(防止两次点击记录回忆)
  userAvatar: {
    cloudAvatarPath: '' // 云端头像路径
  }, // 用户头像

  /**
   * 页面创建时执行
   */
  onLoad() {
    let that = this;
    wx.showShareMenu();
    that.showSetNoticeFunction();
    that.checkLocalAvatarPath();
    that.checkNickname();
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
   * 点击设置公告
   */
  onClickSetNotice() {
    let that = this;
    that.setData({
      showPopup: true,
      showSetNoticeView: true
    })
  },

  /**
   * 点击设置公告页蒙版
   */
  onClickSetNoticeMask() {
    let that = this;
    that.setData({
      showPopup: false,
      showSetNoticeView: false,
      setNoticeContent: ''
    })
  },

  /**
   * 设置公告的内容
   * @param {Object} e 当前点击的对象
   */
  setNoticeContent(e) {
    let that = this;
    that.setData({
      setNoticeContent: e.detail.value
    })
  },

  /**
   * 点击更新公告
   */
  onClickUpdateNotice() {
    let that = this;
    if (!that.data.setNoticeContent) {
      wx.showToast({
        title: '公告内容不能为空',
        icon: 'none'
      })
    } else {
      wx.showModal({
          title: '温馨提示',
          content: '确定更新公告吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(res => {
          if (res.confirm) {
            wx.showLoading({
              title: '更新中...',
            })
            that.updateNotice();
          }
        })
    }
  },

  /**
   * 更新小程序公告
   */
  async updateNotice() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateNotice',
          data: {
            noticeData: that.data.setNoticeContent
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
    let updateTip = '更新完成';
    if (!result) updateTip = '更新失败';
    that.setData({
      showPopup: false,
      showSetNoticeView: false,
      setNoticeContent: ''
    })
    wx.hideLoading();
    wx.showToast({
      title: updateTip,
      icon: 'none'
    })
  },

  /**
   * 显示设置公告功能
   */
  async showSetNoticeFunction() {
    let that = this;
    let showSetNoticeFunction = false;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateNotice',
          data: {
            noticeData: ''
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            if (res.result.showSetNoticeFunction) showSetNoticeFunction = true;
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
    if (result && showSetNoticeFunction) {
      that.setData({
        showSetNotice: showSetNoticeFunction
      })
    }
  },

  /**
   * 点击设置头像
   */
  onClickSetAvatar() {
    let that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
      success(res) {
        wx.showLoading({
          title: '设置中...',
          mask: true
        })
        let tempFiles = res.tempFiles;
        wx.compressImage({
          src: tempFiles[0].tempFilePath,
          async success(res) {
            let cloudAvatarPath = await that.uploadLocalAvatarToCloud(res.tempFilePath);
            that.userAvatar.cloudAvatarPath = cloudAvatarPath;
            wx.setStorageSync('userAvatar', res.tempFilePath);
            await that.updateUserAvatarToCloud();
          }
        })
      }
    })
  },

  /**
   * 上传头像到云端
   * @param {String} localAvatarPath 本地头像路径
   */
  async uploadLocalAvatarToCloud(localAvatarPath) {
    let that = this;
    let p = new Promise(async function (resolve, reject) {
      let currentInfo = await that.getOpenIdFromCloud();
      if (!currentInfo || !localAvatarPath) resolve('');
      wx.cloud.uploadFile({
          cloudPath: 'userAvatar/' + currentInfo.openId + '.jpg', // 上传至云端的路径
          filePath: localAvatarPath, // 上传的临时文件路径
        })
        .then(res => {
          resolve(res.fileID);
        })
        .catch(error => {
          resolve('');
        })
    })
    return await p;
  },

  /**
   * 更新用户头像到云端
   */
  async updateUserAvatarToCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateUserInfoByOpenId',
          data: {
            userInfoData: that.userAvatar
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
    let updateTip = '设置成功';
    if (!result) updateTip = '设置失败';
    that.setData({
      userAvatar: wx.getStorageSync('userAvatar')
    })
    that.userAvatar = {
      cloudAvatarPath: ''
    };
    wx.hideLoading();
    wx.showToast({
      title: updateTip,
      icon: 'none'
    })
  },

  /**
   * 点击设置昵称
   */
  onClickSetNickname() {
    let that = this;
    that.setData({
      showPopup: true,
      showSetNicknameView: true
    })
  },

  /**
   * 点击设置昵称页蒙版
   */
  onClickSetNicknameMask() {
    let that = this;
    that.setData({
      showPopup: false,
      showSetNicknameView: false,
      setNicknameContent: ''
    })
  },

  /**
   * 设置昵称的内容
   * @param {Object} e 当前点击的对象
   */
  setNicknameContent(e) {
    let that = this;
    that.setData({
      setNicknameContent: e.detail.value
    })
  },

  /**
   * 点击更新昵称
   */
  onClickUpdateNickname() {
    let that = this;
    if (!that.data.setNicknameContent) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
    } else {
      wx.showModal({
          title: '温馨提示',
          content: '确定设置昵称吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(res => {
          if (res.confirm) {
            wx.showLoading({
              title: '设置中...',
            })
            that.updateNicknameToCloud();
          }
        })
    }
  },

  /**
   * 更新昵称
   */
  async updateNicknameToCloud() {
    let that = this;
    let nickname = {};
    nickname['nickname'] = that.data.setNicknameContent;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateUserInfoByOpenId',
          data: {
            userInfoData: nickname
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
    let updateTip = '设置成功';
    if (!result) updateTip = '设置失败';
    wx.setStorageSync('userNickname', nickname.nickname);
    that.setData({
      showPopup: false,
      showSetNicknameView: false,
      userNickname: nickname.nickname,
      setNicknameContent: ''
    })
    wx.hideLoading();
    wx.showToast({
      title: updateTip,
      icon: 'none'
    })
  },

  /**
   * 获取用户信息
   */
  async getUserInfoFromCloud() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'updateUserInfoByOpenId',
          data: {
            getUserInfoState: true
          }
        })
        .then(res => {
          if (res.result && res.result.result) {
            resolve(res.result.userInfo);
          } else resolve(false);
        })
        .catch(error => {
          resolve(false);
        })
    });
    return await p;
  },

  /**
   * 检测本地头像路径是否存在
   */
  async checkLocalAvatarPath() {
    let that = this;
    let localAvatarPath = wx.getStorageSync('userAvatar') ? wx.getStorageSync('userAvatar') : "fakePath";
    wx.getImageInfo({
        src: localAvatarPath
      })
      .then(res => {})
      .catch(async (res) => {
        let userInfoData = await that.getUserInfoFromCloud();
        if (!userInfoData) return;
        wx.cloud.downloadFile({
            fileID: userInfoData.cloudAvatarPath
          })
          .then(res => {
            wx.setStorageSync('userAvatar', res.tempFilePath);
            that.setData({
              userAvatar: res.tempFilePath
            })
          })
          .catch(res => {
            that.setData({
              userAvatar: ''
            })
          })
      })
  },

  /**
   * 检测本地昵称是否存在
   */
  async checkNickname() {
    let that = this;
    let userNickname = wx.getStorageSync('userNickname');
    if (userNickname) return;
    let userInfoData = await that.getUserInfoFromCloud();
    if (!userInfoData) return;
    wx.setStorageSync('userNickname', userInfoData.nickname);
    that.setData({
      userNickname: userInfoData.nickname
    })
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