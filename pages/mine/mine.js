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
    localPicPathList: [], // 本地图片路径列表
    cloudPicPathList: [], // 云端图片路径列表
    feedbackContent: '', // 意见反馈内容
    avatar: wx.getStorageSync('avatar') ? wx.getStorageSync('avatar') : '../../images/img_default_avatar.png', // 用户头像
    showSetNicknameView: false, // 显示设置昵称页面
    setNicknameContent: '', // 设置昵称的内容
    nickname: wx.getStorageSync('nickname') ? wx.getStorageSync('nickname') : '昵称', // 用户昵称
    hasManagePermission: false, // 是否有管理权限 有则显示设置公告功能
    showSetNoticeView: false, // 显示设置公告页面
    setNoticeContent: '', // 设置公告的内容
    showAboutSelf: false, // 显示关于回忆录
    aboutSelfContent: '这是一个可以《留住回忆》的小程序。\n可选的需要小程序授权的功能：\n1、开启手机和小程序的定位服务，可以在记录回忆时记下当前的位置与天气。\n2、记录回忆时可以从手机相册中选择想要的图片一同记录。\n如果您在使用小程序时遇到任何问题或者您对小程序有更好的建议或想法，欢迎通过《意见反馈》或《联系客服》功能来向开发者反馈。', // 关于回忆录的文本
    praiseState: wx.getStorageSync('praiseState') ? wx.getStorageSync('praiseState') : false, // 是否赞美小程序
    praiseSum: wx.getStorageSync('praiseSum') ? wx.getStorageSync('praiseSum') : 0, // 赞美小程序的总人数
  },

  uploadFeedbackState: false, // 上传意见反馈的状态(防止两次点击上传)

  /**
   * 页面创建时执行
   */
  onLoad() {
    let that = this;
    wx.showShareMenu();
    that.getManagePermission();
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
      title: '记你所记 想你所想',
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
        content: '返回会清空当前编辑的意见反馈',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(res => {
        if (res.confirm) {
          that.setData({
            showPopup: false,
            showFeedback: false,
            localPicPathList: [],
            cloudPicPathList: [],
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
    if (that.uploadFeedbackState === true) return;
    that.uploadFeedbackState = true;
    wx.showModal({
        title: '温馨提示',
        content: '确定上传您的反馈吗',
        cancelText: '取消',
        confirmText: '确定'
      })
      .then(async res => {
        if (res.confirm) {
          await that.startUploadFeedback();
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
    wx.showLoading({
      title: '上传中...',
      mask: true
    })
    await that.uploadLocalPicList();
    await that.uploadFeedback();
    that.setData({
      cloudPicPathList: [],
      feedbackContent: '',
      localPicPathList: [],
      showPopup: false,
      showFeedback: false
    })
    wx.hideLoading();
    wx.showToast({
      title: '反馈成功',
      icon: 'none',
      duration: 1500
    })
  },

  /**
   * 上传本地图片列表
   */
  async uploadLocalPicList() {
    let that = this;
    let proArr = []; // promise返回值数组
    let localPicPathList = that.data.localPicPathList;
    let cloudPicPathList = [];
    let currentInfo = await that.getOpenId();
    for (let i = 0; i < localPicPathList.length; i++) {
      proArr[i] = new Promise(async function (resolve, reject) {
        wx.compressImage({
            src: localPicPathList[i]
          })
          .then(res => {
            wx.cloud.uploadFile({
                cloudPath: currentInfo.openId + '/' + currentInfo.date + i + '.jpg', // 上传至云端的路径
                filePath: res.tempFilePath, // 上传的临时文件路径
              })
              .then(res => {
                cloudPicPathList[i] = res.fileID;
                resolve(true);
              })
              .catch(error => {
                cloudPicPathList[i] = "";
                resolve(true);
              })
          })
      })
    }
    await Promise.all(proArr).then((res) => {
      //全都图片都上传成功后
      that.setData({
        cloudPicPathList: cloudPicPathList
      })
    }).catch((err) => {})
  },

  /**
   * 获取用户openId
   */
  async getOpenId() {
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
   * 上传意见反馈
   */
  async uploadFeedback() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadFeedback',
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
    if (!result) that.showErrorTip();
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
          })
          .then(async res => {
            wx.setStorageSync('avatar', res.tempFilePath);
            let cloudAvatarPath = await that.uploadAvatar(res.tempFilePath);
            await that.uploadUserInfo(cloudAvatarPath, '');
            that.setData({
              avatar: res.tempFilePath
            })
            wx.hideLoading();
            wx.showToast({
              title: '设置成功',
              icon: 'none'
            })
          })
          .catch(err => {})
      }
    })
  },

  /**
   * 上传头像
   * @param {String} localAvatarPath 本地头像路径
   */
  async uploadAvatar(localAvatarPath) {
    let that = this;
    let currentInfo = await that.getOpenId();
    let p = new Promise(async function (resolve, reject) {
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
   * 上传用户信息
   * @param {String} cloudAvatarPath 云端头像路径 没有则传''
   * @param {String} nickname 昵称 没有则传''
   */
  async uploadUserInfo(cloudAvatarPath, nickname) {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadUserInfo',
          data: {
            cloudAvatarPath: cloudAvatarPath,
            nickname: nickname
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
    await p;
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
   * 点击上传昵称
   */
  onClickUploadNickname() {
    let that = this;
    let nickname = that.data.setNicknameContent;
    if (!nickname) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      })
    } else {
      wx.showModal({
          title: '温馨提示',
          content: '确定设置该昵称吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(async res => {
          if (res.confirm) {
            wx.showLoading({
              title: '设置中...',
              mask: true
            })
            wx.setStorageSync('nickname', nickname);
            await that.uploadUserInfo('', nickname);
            that.setData({
              showPopup: false,
              showSetNicknameView: false,
              nickname: nickname,
              setNicknameContent: ''
            })
            wx.hideLoading();
            wx.showToast({
              title: '设置成功',
              icon: 'none'
            })
          }
        })
    }
  },

  /**
   * 获取管理员权限
   */
  getManagePermission() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getManagePermission'
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              hasManagePermission: res.result.hasManagePermission
            })
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
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
   * 点击上传公告
   */
  onClickUploadNotice() {
    let that = this;
    let notice = that.data.setNoticeContent;
    if (!notice) {
      wx.showToast({
        title: '公告内容不能为空',
        icon: 'none'
      })
    } else {
      wx.showModal({
          title: '温馨提示',
          content: '确定更新该公告吗',
          cancelText: '取消',
          confirmText: '确定'
        })
        .then(async res => {
          if (res.confirm) {
            wx.showLoading({
              title: '更新中...',
            })
            wx.setStorageSync('notice', notice)
            await that.uploadNotice(notice);
            that.setData({
              showPopup: false,
              showSetNoticeView: false,
              setNoticeContent: ''
            })
            wx.hideLoading();
            wx.showToast({
              title: '更新完成',
              icon: 'none'
            })
          }
        })
    }
  },

  /**
   * 上传公告
   * @param {String} notice 公告
   */
  async uploadNotice(notice) {
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'uploadNotice',
          data: {
            notice: notice
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
    await p;
  },

  /**
   * 点击关于回忆录
   */
  onClickAbout() {
    let that = this;
    that.getPraiseInfo();
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
   * 获取点赞信息
   */
  async getPraiseInfo() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getPraiseInfo'
        })
        .then(res => {
          if (res.result && res.result.result) {
            that.setData({
              praiseState: res.result.praiseState,
              praiseSum: res.result.praiseSum
            })
            wx.setStorageSync('praiseState', res.result.praiseState);
            wx.setStorageSync('praiseSum', res.result.praiseSum);
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(error => {
          resolve(false);
        })
    });
    await p;
  },

  /**
   * 点击赞美
   */
  onClickPraise() {
    let that = this;
    if (!that.data.praiseState) that.uploadPraise();
  },

  /**
   * 上传点赞
   */
  uploadPraise() {
    let that = this;
    wx.cloud.callFunction({
        name: 'uploadPraise',
      })
      .then(res => {
        if (res.result && res.result.result) {
          that.setData({
            praiseState: res.result.praiseState,
            praiseSum: res.result.praiseSum
          })
          wx.setStorageSync('praiseState', res.result.praiseState);
          wx.setStorageSync('praiseSum', res.result.praiseSum);
        }
      })
      .catch(error => {})
  },

  /**
   * 检测本地头像路径是否存在
   */
  async checkLocalAvatarPath() {
    let that = this;
    let localAvatarPath = wx.getStorageSync('avatar') ? wx.getStorageSync('avatar') : "avatarPath";
    wx.getImageInfo({
        src: localAvatarPath
      })
      .then(res => {})
      .catch(async (res) => {
        let userInfo = await that.getUserInfo();
        if (!userInfo) return;
        await wx.cloud.downloadFile({
            fileID: userInfo.cloudAvatarPath
          })
          .then(res => {
            wx.setStorageSync('avatar', res.tempFilePath);
            that.setData({
              avatar: res.tempFilePath
            })
          })
          .catch(res => {
            that.setData({
              avatar: '../../images/img_default_avatar.png'
            })
          })
      })
  },

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    let that = this;
    let p = new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
          name: 'getUserInfo'
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
   * 检测本地昵称是否存在
   */
  async checkNickname() {
    let that = this;
    let nickname = wx.getStorageSync('nickname');
    if (nickname) return;
    let userInfo = await that.getUserInfo();
    if (!userInfo) return;
    wx.setStorageSync('userInfo', userInfo.nickname);
    that.setData({
      nickname: userInfo.nickname
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